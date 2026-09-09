package com.codequest.backend.service;

import com.codequest.backend.dto.ApiDtos.SubmissionRequest;
import com.codequest.backend.entity.*;
import com.codequest.backend.exception.ApiException;
import com.codequest.backend.repository.*;
import com.codequest.backend.security.CurrentUser;
import com.codequest.backend.util.ApiMaps;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LearningService {
    private final ChallengeService challengeService;
    private final SubmissionRepository submissions;
    private final SubmissionAttemptRepository attempts;
    private final UserXPRepository xpRepository;
    private final ChallengeDraftRepository drafts;
    private final ChallengeAttemptRepository timers;
    private final CurrentUser currentUser;
    private final ObjectMapper mapper;

    public LearningService(ChallengeService challengeService, SubmissionRepository submissions,
                           SubmissionAttemptRepository attempts, UserXPRepository xpRepository,
                           ChallengeDraftRepository drafts, ChallengeAttemptRepository timers,
                           CurrentUser currentUser, ObjectMapper mapper) {
        this.challengeService = challengeService;
        this.submissions = submissions;
        this.attempts = attempts;
        this.xpRepository = xpRepository;
        this.drafts = drafts;
        this.timers = timers;
        this.currentUser = currentUser;
        this.mapper = mapper;
    }

    @Transactional
    public Map<String, Object> submit(SubmissionRequest request) {
        User user = currentUser.get();
        Challenge challenge = challengeService.getVisible(request.challenge());
        Result result = evaluate(challenge, request.submittedCode(), request.clientEvaluation());
        Submission existing = submissions.findByUserIdAndChallengeId(user.getId(), challenge.getId()).orElse(null);
        boolean alreadyPassed = existing != null && existing.isPassed();
        Submission submission = existing == null ? new Submission() : existing;
        submission.setUser(user);
        submission.setChallenge(challenge);
        submission.setSubmittedCode(request.submittedCode());
        submission.setPassed(result.passed());
        submission.setPassedCount(result.passedCount());
        submission.setTotalCount(result.totalCount());
        submission.setFeedback(result.feedback());
        int award = result.passed() && !alreadyPassed ? challenge.getXpPoints() : 0;
        submission.setEarnedXp(award);
        submission = submissions.save(submission);

        SubmissionAttempt attempt = new SubmissionAttempt();
        attempt.setUser(user);
        attempt.setChallenge(challenge);
        attempt.setSubmittedCode(request.submittedCode());
        attempt.setPassed(result.passed());
        attempt.setPassedCount(result.passedCount());
        attempt.setTotalCount(result.totalCount());
        attempt.setAwardedXp(award);
        attempt.setFeedback(result.feedback());
        attempts.save(attempt);

        if (award > 0) {
            UserXP xp = xpRepository.findByUserId(user.getId()).orElseGet(() -> {
                UserXP row = new UserXP();
                row.setUser(user);
                return row;
            });
            xp.setTotalXp(xp.getTotalXp() + award);
            xpRepository.save(xp);
        }
        if (result.passed() && "CODE_OF_DAY".equals(challenge.getChallengeType())) {
            ChallengeAttempt timer = timers.findByUserIdAndChallengeId(user.getId(), challenge.getId()).orElseGet(() -> {
                ChallengeAttempt row = new ChallengeAttempt();
                row.setUser(user);
                row.setChallenge(challenge);
                return row;
            });
            timer.setCompleted(true);
            if (timer.getCompletedAt() == null) timer.setCompletedAt(OffsetDateTime.now());
            timers.save(timer);
        }
        int codeOfDayStreak = codeOfDayStreak(user);

        return ApiMaps.map(
            "id", submission.getId(),
            "user", user.getId(),
            "challenge", challenge.getId(),
            "submitted_code", submission.getSubmittedCode(),
            "is_passed", submission.isPassed(),
            "passed_count", submission.getPassedCount(),
            "total_count", submission.getTotalCount(),
            "earned_xp", submission.getEarnedXp(),
            "submitted_at", submission.getSubmittedAt(),
            "status", result.passed() ? "Accepted" : "Failed",
            "submissionSuccess", true,
            "challengeCompleted", result.passed(),
            "passed", result.passedCount(),
            "total", result.totalCount(),
            "awarded_xp", award,
            "xpEarned", award,
            "completion_percent", ApiMaps.percent(result.passedCount(), result.totalCount()),
            "challengeType", challenge.getType(),
            "challenge_type", challenge.getChallengeType(),
            "code_of_day_streak", codeOfDayStreak,
            "codeOfDayStreak", codeOfDayStreak
        );
    }

    public int codeOfDayStreak(User user) {
        Set<LocalDate> completedDays = new HashSet<>();
        for (Submission submission : submissions.findByUserId(user.getId())) {
            Challenge challenge = submission.getChallenge();
            if (submission.isPassed() && challenge != null && "CODE_OF_DAY".equals(challenge.getChallengeType()) && submission.getSubmittedAt() != null) {
                completedDays.add(submission.getSubmittedAt().toLocalDate());
            }
        }
        int streak = 0;
        LocalDate cursor = LocalDate.now();
        while (completedDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    public List<Submission> mySubmissions() {
        return submissions.findByUserOrderBySubmittedAtDesc(currentUser.get());
    }

    public List<SubmissionAttempt> history(Long challengeId) {
        User user = currentUser.get();
        challengeService.getVisible(challengeId);
        return attempts.findByUserIdAndChallengeIdOrderBySubmittedAtDesc(user.getId(), challengeId);
    }

    @Transactional
    public ChallengeDraft saveDraft(Long challengeId, String code) {
        User user = currentUser.get();
        Challenge challenge = challengeService.getVisible(challengeId);
        ChallengeDraft draft = drafts.findByUserIdAndChallengeId(user.getId(), challengeId).orElseGet(ChallengeDraft::new);
        draft.setUser(user);
        draft.setChallenge(challenge);
        draft.setCode(code == null ? "" : code);
        return drafts.save(draft);
    }

    public Map<String, Object> getDraft(Long challengeId) {
        User user = currentUser.get();
        challengeService.getVisible(challengeId);
        return drafts.findByUserIdAndChallengeId(user.getId(), challengeId)
            .<Map<String, Object>>map(d -> ApiMaps.map("id", d.getId(), "challenge", challengeId, "code", d.getCode(), "updated_at", d.getUpdatedAt()))
            .orElseGet(() -> ApiMaps.map("code", null, "updated_at", null));
    }

    @Transactional
    public Map<String, Object> timer(Long challengeId, String action) {
        User user = currentUser.get();
        Challenge challenge = challengeService.getVisible(challengeId);
        ChallengeAttempt timer = timers.findByUserIdAndChallengeId(user.getId(), challengeId).orElseGet(() -> {
            ChallengeAttempt row = new ChallengeAttempt();
            row.setUser(user);
            row.setChallenge(challenge);
            return row;
        });
        OffsetDateTime now = OffsetDateTime.now();
        if ("open".equals(action)) timer.setLastOpenedAt(now);
        if ("sync".equals(action) || "close".equals(action)) {
            if (timer.getLastOpenedAt() != null) {
                timer.setTotalTimeSeconds(timer.getTotalTimeSeconds() + Math.max(0, (int) Duration.between(timer.getLastOpenedAt(), now).toSeconds()));
            }
            timer.setLastOpenedAt("close".equals(action) ? null : now);
        }
        if ("complete".equals(action)) {
            timer.setCompleted(true);
            timer.setCompletedAt(now);
        }
        timer = timers.save(timer);
        return ApiMaps.map(
            "id", timer.getId(),
            "challenge", challengeId,
            "started_at", timer.getStartedAt(),
            "last_opened_at", timer.getLastOpenedAt(),
            "total_time_seconds", timer.getTotalTimeSeconds(),
            "completed_at", timer.getCompletedAt(),
            "is_completed", timer.isCompleted()
        );
    }

    private Result evaluate(Challenge challenge, String code, JsonNode clientEvaluation) {
        if (clientEvaluation != null && clientEvaluation.has("total") && clientEvaluation.has("passed")) {
            int total = clientEvaluation.path("total").asInt();
            int passed = clientEvaluation.path("passed").asInt();
            JsonNode feedback = clientEvaluation.path("feedback").isMissingNode() ? mapper.createArrayNode() : clientEvaluation.path("feedback");
            return new Result(passed >= total && total > 0, passed, total, feedback);
        }
        List<Map<String, Object>> feedback = new ArrayList<>();
        int passed = 0;
        String submitted = code == null ? "" : code;
        for (TestCase test : challenge.getTestCases()) {
            String expected = test.getExpectedOutput() == null ? "" : test.getExpectedOutput();
            boolean ok = test.isCaseSensitive()
                ? submitted.contains(expected)
                : submitted.toLowerCase().contains(expected.toLowerCase());
            if (ok) passed++;
            feedback.add(ApiMaps.map("name", test.getName(), "passed", ok, "message", ok ? "Passed" : "Expected output was not found."));
        }
        int total = challenge.getTestCases().size();
        return new Result(total > 0 && passed == total, passed, total, mapper.valueToTree(feedback));
    }

    private record Result(boolean passed, int passedCount, int totalCount, JsonNode feedback) {}
}
