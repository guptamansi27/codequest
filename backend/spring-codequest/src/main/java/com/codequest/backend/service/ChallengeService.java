package com.codequest.backend.service;

import com.codequest.backend.dto.ApiDtos.ChallengeRequest;
import com.codequest.backend.dto.ApiDtos.TestCaseDto;
import com.codequest.backend.entity.Challenge;
import com.codequest.backend.entity.ChallengeAssignment;
import com.codequest.backend.entity.TestCase;
import com.codequest.backend.entity.User;
import com.codequest.backend.exception.ApiException;
import com.codequest.backend.mapper.ApiMapper;
import com.codequest.backend.repository.AIInteractionRepository;
import com.codequest.backend.repository.ChallengeAssignmentRepository;
import com.codequest.backend.repository.ChallengeAttemptRepository;
import com.codequest.backend.repository.ChallengeDraftRepository;
import com.codequest.backend.repository.ChallengeRepository;
import com.codequest.backend.repository.ModuleRepository;
import com.codequest.backend.repository.SubmissionAttemptRepository;
import com.codequest.backend.repository.SubmissionRepository;
import com.codequest.backend.repository.TestCaseRepository;
import com.codequest.backend.repository.UserRepository;
import com.codequest.backend.security.CurrentUser;
import com.codequest.backend.util.ApiMaps;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChallengeService {
    private final ChallengeRepository challenges;
    private final ModuleRepository modules;
    private final UserRepository users;
    private final ChallengeAssignmentRepository assignments;
    private final TestCaseRepository testCases;
    private final SubmissionRepository submissions;
    private final SubmissionAttemptRepository submissionAttempts;
    private final ChallengeDraftRepository drafts;
    private final ChallengeAttemptRepository challengeAttempts;
    private final AIInteractionRepository aiInteractions;
    private final CurrentUser currentUser;

    public ChallengeService(ChallengeRepository challenges, ModuleRepository modules, UserRepository users,
                            ChallengeAssignmentRepository assignments, TestCaseRepository testCases,
                            SubmissionRepository submissions, SubmissionAttemptRepository submissionAttempts,
                            ChallengeDraftRepository drafts, ChallengeAttemptRepository challengeAttempts,
                            AIInteractionRepository aiInteractions, CurrentUser currentUser) {
        this.challenges = challenges;
        this.modules = modules;
        this.users = users;
        this.assignments = assignments;
        this.testCases = testCases;
        this.submissions = submissions;
        this.submissionAttempts = submissionAttempts;
        this.drafts = drafts;
        this.challengeAttempts = challengeAttempts;
        this.aiInteractions = aiInteractions;
        this.currentUser = currentUser;
    }

    public List<Challenge> list(String type, String status) {
        User user = currentUser.get();
        List<Challenge> rows;
        if (currentUser.isAdmin(user)) rows = challenges.findAllByOrderByCreatedAtDescIdDesc();
        else if (currentUser.isSme(user)) rows = challenges.findByCreatedByOrderByCreatedAtDescIdDesc(user);
        else rows = challenges.findByActiveTrueAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderByCreatedAtDescIdDesc(OffsetDateTime.now(), OffsetDateTime.now());
        OffsetDateTime now = OffsetDateTime.now();
        return rows.stream()
            .filter(c -> type == null || type.isBlank() || type.equals(c.getType()) || ("assessment".equals(type) && "test".equals(c.getType())))
            .filter(c -> status == null || status.isBlank() || switch (status) {
                case "active" -> c.isActive() && isStarted(c, now) && !isExpired(c, now);
                case "upcoming" -> c.getStartTime() != null && now.isBefore(c.getStartTime());
                case "expired" -> isExpired(c, now);
                default -> true;
            })
            .toList();
    }

    public Challenge getVisible(Long id) {
        Challenge c = challenges.findById(id).orElseThrow(() -> ApiException.notFound("Challenge not found"));
        User user = currentUser.get();
        if (currentUser.isAdmin(user) || (currentUser.isSme(user) && c.getCreatedBy() != null && c.getCreatedBy().getId().equals(user.getId()))) return c;
        if (c.isActive()) return c;
        throw ApiException.forbidden("You do not have permission to view this challenge.");
    }

    @Transactional
    public Challenge create(ChallengeRequest request) {
        User user = currentUser.get();
        if (!currentUser.isSme(user) && !currentUser.isAdmin(user)) throw ApiException.forbidden("Only SME or admin accounts can create challenges.");
        Challenge c = new Challenge();
        apply(c, request, true);
        c.setCreatedBy(user);
        return challenges.save(c);
    }

    @Transactional
    public Challenge update(Long id, ChallengeRequest request) {
        Challenge c = getWritable(id);
        apply(c, request, false);
        return challenges.save(c);
    }

    @Transactional
    public void delete(Long id) {
        User user = currentUser.get();
        Challenge challenge = challenges.findById(id).orElseThrow(() -> ApiException.notFound("Challenge not found"));
        boolean ownsChallenge = currentUser.isSme(user) && challenge.getCreatedBy() != null && challenge.getCreatedBy().getId().equals(user.getId());
        if (!currentUser.isAdmin(user) && !ownsChallenge) throw ApiException.forbidden("Only administrators or the SME who created this challenge can delete it.");
        Long challengeId = challenge.getId();
        aiInteractions.deleteByChallengeId(challengeId);
        drafts.deleteByChallengeId(challengeId);
        challengeAttempts.deleteByChallengeId(challengeId);
        submissionAttempts.deleteByChallengeId(challengeId);
        submissions.deleteByChallengeId(challengeId);
        assignments.deleteByChallengeId(challengeId);
        testCases.deleteByChallengeId(challengeId);
        challenges.delete(challenge);
    }

    @Transactional
    public Challenge clone(Long id) {
        Challenge source = getWritable(id);
        Challenge copy = new Challenge();
        copy.setTitle(source.getTitle() + " (Copy)");
        copy.setDescription(source.getDescription());
        copy.setDifficulty(source.getDifficulty());
        copy.setModule(source.getModule());
        copy.setChallengeType(source.getChallengeType());
        copy.setType(source.getType());
        copy.setTechnology(source.getTechnology());
        copy.setStarterCode(source.getStarterCode());
        copy.setXpPoints(source.getXpPoints());
        copy.setChatbotEnabled(source.isChatbotEnabled());
        copy.setChatbotEnabledAlias(source.isChatbotEnabledAlias());
        copy.setStartTime(source.getStartTime());
        copy.setEndTime(source.getEndTime());
        copy.setActive(false);
        copy.setCreatedBy(currentUser.get());
        for (TestCase test : source.getTestCases()) {
            TestCase t = new TestCase();
            t.setChallenge(copy);
            t.setName(test.getName());
            t.setInputData(test.getInputData());
            t.setExpectedOutput(test.getExpectedOutput());
            t.setCaseSensitive(test.isCaseSensitive());
            copy.getTestCases().add(t);
        }
        for (ChallengeAssignment sourceAssignment : source.getEmployeeAssignments()) {
            ChallengeAssignment assignment = new ChallengeAssignment();
            assignment.setChallenge(copy);
            assignment.setUser(sourceAssignment.getUser());
            assignment.setAssignedBy(currentUser.get());
            copy.getEmployeeAssignments().add(assignment);
        }
        return challenges.save(copy);
    }

    public Map<String, Object> insights(Long id) {
        Challenge challenge = getVisible(id);
        List<com.codequest.backend.entity.SubmissionAttempt> attemptRows = submissionAttempts.findByChallengeIdOrderBySubmittedAtDesc(id);
        long totalSubmissions = attemptRows.size();
        long passed = attemptRows.stream().filter(com.codequest.backend.entity.SubmissionAttempt::isPassed).count();
        long failed = Math.max(totalSubmissions - passed, 0);
        long completedUsers = attemptRows.stream()
            .filter(com.codequest.backend.entity.SubmissionAttempt::isPassed)
            .map(a -> a.getUser().getId())
            .distinct()
            .count();
        long submittedUsers = attemptRows.stream().map(a -> a.getUser().getId()).distinct().count();
        long assignedUsers = challenge.getEmployeeAssignments().isEmpty()
            ? users.findByRoleAndStaffFalseOrderByEmailAsc("USER").size()
            : challenge.getEmployeeAssignments().stream().filter(a -> a.getUser() != null).map(a -> a.getUser().getId()).distinct().count();
        int averageScore = averageScore(attemptRows);
        double averageXp = totalSubmissions == 0 ? 0 : Math.round(attemptRows.stream().mapToInt(com.codequest.backend.entity.SubmissionAttempt::getAwardedXp).average().orElse(0) * 10.0) / 10.0;
        Map<String, Long> byDate = attemptRows.stream()
            .collect(Collectors.groupingBy(a -> a.getSubmittedAt() == null ? OffsetDateTime.now().toLocalDate().toString() : a.getSubmittedAt().toLocalDate().toString(), LinkedHashMap::new, Collectors.counting()));
        Map<String, Long> passedByDate = attemptRows.stream()
            .filter(com.codequest.backend.entity.SubmissionAttempt::isPassed)
            .collect(Collectors.groupingBy(a -> a.getSubmittedAt() == null ? OffsetDateTime.now().toLocalDate().toString() : a.getSubmittedAt().toLocalDate().toString(), LinkedHashMap::new, Collectors.counting()));
        List<Map<String, Object>> timeline = byDate.entrySet().stream()
            .map(e -> ApiMaps.map("date", e.getKey(), "submissions", e.getValue(), "passed", passedByDate.getOrDefault(e.getKey(), 0L)))
            .toList();
        List<Map<String, Object>> recent = attemptRows.stream().limit(8)
            .map(a -> ApiMaps.map(
                "id", a.getId(),
                "user", a.getUser().getEmail(),
                "status", a.isPassed() ? "Passed" : "Failed",
                "score", ApiMaps.percent(a.getPassedCount(), a.getTotalCount()),
                "submitted_at", a.getSubmittedAt()
            ))
            .toList();
        List<Map<String, Object>> topPerformers = attemptRows.stream()
            .filter(com.codequest.backend.entity.SubmissionAttempt::isPassed)
            .collect(Collectors.toMap(
                a -> a.getUser().getId(),
                a -> a,
                (left, right) -> score(left) >= score(right) ? left : right,
                LinkedHashMap::new
            ))
            .values().stream()
            .sorted((a, b) -> Integer.compare(score(b), score(a)))
            .limit(10)
            .map(a -> ApiMaps.map(
                "user", a.getUser().getEmail(),
                "email", a.getUser().getEmail(),
                "employee_id", a.getUser().getEmployeeId(),
                "batch", "",
                "best_score", ApiMaps.percent(a.getPassedCount(), a.getTotalCount()),
                "earned_xp", a.getAwardedXp()
            ))
            .toList();
        return ApiMaps.map(
            "challenge", ApiMaps.map(
                "id", challenge.getId(),
                "title", challenge.getTitle(),
                "description", challenge.getDescription(),
                "difficulty", challenge.getDifficulty(),
                "module", challenge.getModule() == null ? null : challenge.getModule().getId(),
                "module_name", challenge.getModule() == null ? null : challenge.getModule().getName(),
                "challenge_type", challenge.getChallengeType(),
                "type", challenge.getType(),
                "technology", challenge.getTechnology(),
                "starter_code", challenge.getStarterCode(),
                "xp_points", challenge.getXpPoints(),
                "chatbot_enabled", challenge.isChatbotEnabled(),
                "is_chatbot_enabled", challenge.isChatbotEnabledAlias(),
                "is_active", challenge.isActive(),
                "assignment_mode", challenge.getEmployeeAssignments().isEmpty() ? "GENERAL" : "NON_IGNITE",
                "target_super_batches", List.of(),
                "target_batches", List.of(),
                "target_sub_batches", List.of(),
                "start_time", challenge.getStartTime(),
                "end_time", challenge.getEndTime(),
                "created_at", challenge.getCreatedAt(),
                "test_cases", challenge.getTestCases().stream().map(ApiMapper::testCase).toList(),
                "employee_assignments", challenge.getEmployeeAssignments().stream().map(ApiMapper::assignment).toList()
            ),
            "summary", ApiMaps.map(
                "total_assigned_users", assignedUsers,
                "completed_users", completedUsers,
                "incomplete_users", Math.max(assignedUsers - completedUsers, 0),
                "submitted_once_users", submittedUsers,
                "not_submitted_users", Math.max(assignedUsers - submittedUsers, 0),
                "average_score", averageScore,
                "average_xp_earned", averageXp,
                "completion_percentage", ApiMaps.percent(completedUsers, assignedUsers),
                "submission_counts", totalSubmissions,
                "pass_percentage", ApiMaps.percent(passed, totalSubmissions),
                "active_participation_rate", ApiMaps.percent(submittedUsers, assignedUsers),
                "pass_count", passed,
                "fail_count", failed
            ),
            "filters", ApiMaps.map("super_batches", List.of(), "batches", List.of()),
            "charts", ApiMaps.map(
                "submission_trends", timeline,
                "engagement_trend", timeline.stream().map(row -> ApiMaps.map("date", row.get("date"), "activeLearners", row.get("submissions"))).toList(),
                "pass_fail_ratio", List.of(ApiMaps.map("name", "Passed", "value", passed), ApiMaps.map("name", "Failed", "value", failed)),
                "xp_distribution", xpDistribution(attemptRows),
                "difficulty_impact", List.of(ApiMaps.map("difficulty", challenge.getDifficulty(), "averageScore", averageScore, "completion", ApiMaps.percent(completedUsers, assignedUsers)))
            ),
            "top_performers", topPerformers,
            "batch_analytics", List.of(),
            "recent_activity", recent
        );
    }

    @Transactional
    public Challenge toggle(Long id, ChallengeRequest request) {
        Challenge c = getWritable(id);
        if (request.isActive() != null) c.setActive(request.isActive());
        if (request.chatbotEnabled() != null) c.setChatbotEnabled(request.chatbotEnabled());
        if (request.isChatbotEnabled() != null) c.setChatbotEnabledAlias(request.isChatbotEnabled());
        return challenges.save(c);
    }

    private Challenge getWritable(Long id) {
        Challenge c = challenges.findById(id).orElseThrow(() -> ApiException.notFound("Challenge not found"));
        User user = currentUser.get();
        if (currentUser.isAdmin(user) || (currentUser.isSme(user) && c.getCreatedBy() != null && c.getCreatedBy().getId().equals(user.getId()))) return c;
        throw ApiException.forbidden("You do not have permission to modify this challenge.");
    }

    private boolean isStarted(Challenge c, OffsetDateTime now) {
        return c.getStartTime() == null || !now.isBefore(c.getStartTime());
    }

    private boolean isExpired(Challenge c, OffsetDateTime now) {
        return c.getEndTime() != null && now.isAfter(c.getEndTime());
    }

    private void apply(Challenge c, ChallengeRequest r, boolean create) {
        if (r.title() != null) c.setTitle(r.title());
        if (r.description() != null) c.setDescription(r.description());
        if (r.difficulty() != null) c.setDifficulty(r.difficulty());
        if (r.module() != null) c.setModule(modules.findById(r.module()).orElseThrow(() -> ApiException.badRequest("Invalid module.")));
        if (r.challengeType() != null) c.setChallengeType(r.challengeType());
        if (r.type() != null) c.setType(r.type());
        if (r.technology() != null) c.setTechnology(r.technology());
        if (r.starterCode() != null) c.setStarterCode(r.starterCode());
        if (r.xpPoints() != null) c.setXpPoints(r.xpPoints());
        if (r.chatbotEnabled() != null) c.setChatbotEnabled(r.chatbotEnabled());
        if (r.isChatbotEnabled() != null) c.setChatbotEnabledAlias(r.isChatbotEnabled());
        if (r.startTime() != null) c.setStartTime(r.startTime());
        if (r.endTime() != null) c.setEndTime(r.endTime());
        if (r.isActive() != null) c.setActive(r.isActive());
        if (create && (c.getStartTime() == null || c.getEndTime() == null)) throw ApiException.badRequest("Please select challenge start and end date.");
        if (c.getStartTime() != null && c.getEndTime() != null && !c.getEndTime().isAfter(c.getStartTime())) throw ApiException.badRequest("End time must be after start time.");
        if (r.testCases() != null) replaceTestCases(c, r.testCases());
        if (r.employeeIds() != null) assignEmployees(c, r.employeeIds());
    }

    private void replaceTestCases(Challenge c, List<TestCaseDto> dtos) {
        c.getTestCases().clear();
        int index = 1;
        for (TestCaseDto dto : dtos) {
            TestCase t = new TestCase();
            t.setChallenge(c);
            t.setName(dto.name() == null || dto.name().isBlank() ? "TC-" + index : dto.name());
            t.setInputData(dto.inputData());
            t.setExpectedOutput(dto.expectedOutput());
            t.setCaseSensitive(dto.isCaseSensitive() == null || dto.isCaseSensitive());
            c.getTestCases().add(t);
            index++;
        }
    }

    private void assignEmployees(Challenge c, List<String> employeeIds) {
        c.getEmployeeAssignments().clear();
        for (String employeeId : employeeIds) {
            users.findByEmployeeIdIgnoreCase(employeeId).ifPresent(user -> {
                if (c.getId() == null || !assignments.existsByChallengeIdAndUserId(c.getId(), user.getId())) {
                    ChallengeAssignment assignment = new ChallengeAssignment();
                    assignment.setChallenge(c);
                    assignment.setUser(user);
                    assignment.setAssignedBy(currentUser.get());
                    c.getEmployeeAssignments().add(assignment);
                }
            });
        }
    }

    private int averageScore(List<com.codequest.backend.entity.SubmissionAttempt> attempts) {
        List<com.codequest.backend.entity.SubmissionAttempt> scored = attempts.stream().filter(a -> a.getTotalCount() > 0).toList();
        if (scored.isEmpty()) return 0;
        return (int) Math.round(scored.stream().mapToDouble(this::score).average().orElse(0));
    }

    private int score(com.codequest.backend.entity.SubmissionAttempt attempt) {
        return ApiMaps.percent(attempt.getPassedCount(), attempt.getTotalCount());
    }

    private List<Map<String, Object>> xpDistribution(List<com.codequest.backend.entity.SubmissionAttempt> attempts) {
        int zero = 0;
        int partial = 0;
        int full = 0;
        for (com.codequest.backend.entity.SubmissionAttempt attempt : attempts) {
            if (attempt.getAwardedXp() <= 0) zero++;
            else if (attempt.getChallenge() != null && attempt.getAwardedXp() >= attempt.getChallenge().getXpPoints()) full++;
            else partial++;
        }
        return List.of(
            ApiMaps.map("range", "0 XP", "users", zero),
            ApiMaps.map("range", "Partial", "users", partial),
            ApiMaps.map("range", "Full", "users", full)
        );
    }
}
