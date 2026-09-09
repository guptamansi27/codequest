package com.codequest.backend.service;

import com.codequest.backend.entity.Submission;
import com.codequest.backend.entity.SubmissionAttempt;
import com.codequest.backend.entity.User;
import com.codequest.backend.entity.UserXP;
import com.codequest.backend.repository.*;
import com.codequest.backend.security.CurrentUser;
import com.codequest.backend.util.ApiMaps;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReportingService {
    private final UserRepository users;
    private final ChallengeRepository challenges;
    private final SubmissionRepository submissions;
    private final SubmissionAttemptRepository attempts;
    private final UserXPRepository xpRepository;
    private final ModuleRepository modules;
    private final CurrentUser currentUser;
    private final LearningService learningService;

    public ReportingService(UserRepository users, ChallengeRepository challenges, SubmissionRepository submissions,
                            SubmissionAttemptRepository attempts, UserXPRepository xpRepository, ModuleRepository modules,
                            CurrentUser currentUser, LearningService learningService) {
        this.users = users;
        this.challenges = challenges;
        this.submissions = submissions;
        this.attempts = attempts;
        this.xpRepository = xpRepository;
        this.modules = modules;
        this.currentUser = currentUser;
        this.learningService = learningService;
    }

    public List<Map<String, Object>> leaderboard() {
        List<User> learners = users.findByRoleAndStaffFalseOrderByEmailAsc("USER");
        Map<Long, Integer> xp = xpRepository.findAll().stream().collect(java.util.stream.Collectors.toMap(x -> x.getUser().getId(), UserXP::getTotalXp));
        User current = currentUser.get();
        List<Map<String, Object>> rows = new ArrayList<>();
        int[] rank = {1};
        learners.stream()
            .sorted(Comparator.comparing((User u) -> -xp.getOrDefault(u.getId(), 0)).thenComparing(User::getEmail))
            .forEach(user -> rows.add(ApiMaps.map(
                "rank", rank[0]++,
                "name", displayName(user),
                "email", user.getEmail(),
                "xp", xp.getOrDefault(user.getId(), 0),
                "xpPoints", xp.getOrDefault(user.getId(), 0),
                "completed_challenges", submissions.countByUserIdAndPassedTrue(user.getId()),
                "challengesCompleted", submissions.countByUserIdAndPassedTrue(user.getId()),
                "submissions", submissions.findByUserId(user.getId()).size(),
                "progress", 0,
                "is_current_user", user.getId().equals(current.getId())
            )));
        return rows;
    }

    public Map<String, Object> userDashboard() {
        User user = currentUser.get();
        List<Submission> mine = submissions.findByUserId(user.getId());
        long completed = mine.stream().filter(Submission::isPassed).count();
        int totalXp = xpRepository.findByUserId(user.getId()).map(UserXP::getTotalXp).orElse(0);
        return ApiMaps.map(
            "user", ApiMaps.map("name", displayName(user), "email", user.getEmail()),
            "stats", ApiMaps.map(
                "completed_challenges", completed,
                "accuracy", ApiMaps.percent(completed, mine.size()),
                "in_progress", Math.max(challenges.count() - completed, 0),
                "rank", leaderboard().stream().filter(r -> Boolean.TRUE.equals(r.get("is_current_user"))).findFirst().map(r -> r.get("rank")).orElse(0),
                "total_xp", totalXp,
                "code_of_day_streak", learningService.codeOfDayStreak(user)
            ),
            "language_progress", List.of(),
            "monthly_activity", List.of(),
            "performance", List.of(),
            "overview", ApiMaps.map("week_activity", List.of(), "completed_by_module", List.of())
        );
    }

    public Map<String, Object> adminDashboard() {
        long userCount = users.count();
        long activeUsers = users.findAll().stream().filter(User::isActive).count();
        long challengeCount = challenges.count();
        long submissionCount = submissions.count();
        long completed = submissions.countByPassedTrue();
        List<Map<String, Object>> roleMix = users.findAll().stream()
            .collect(Collectors.groupingBy(u -> u.getRole() == null ? "USER" : u.getRole(), LinkedHashMap::new, Collectors.counting()))
            .entrySet().stream()
            .map(e -> ApiMaps.map("role", e.getKey(), "label", roleLabel(e.getKey()), "count", e.getValue()))
            .toList();
        return ApiMaps.map(
            "admin", ApiMaps.map("name", displayName(currentUser.get()), "email", currentUser.get().getEmail(), "role", currentUser.get().getRole()),
            "selected_batch", "",
            "selected_super_batch", "",
            "selected_program_type", "",
            "batches", List.of(),
            "super_batches", List.of(),
            "batch_options", List.of(),
            "kpis", ApiMaps.map("total_users", userCount, "active_users", activeUsers, "completion_rate", ApiMaps.percent(completed, submissionCount), "average_xp", averageXp(), "ai_usage", 0, "completed_submissions", completed, "in_progress", Math.max(submissionCount - completed, 0), "total_submissions", submissionCount),
            "charts", ApiMaps.map("user_growth", List.of(), "task_completion", moduleCompletion(), "ai_usage", List.of(), "overview", ApiMaps.map("role_mix", roleMix, "submission_outcomes", submissionOutcomes(completed, submissionCount - completed), "challenge_type_submissions", challengeTypeSubmissions())),
            "recent_activity", attempts.findTop8ByOrderBySubmittedAtDesc().stream().map(a -> ApiMaps.map("id", a.getId(), "user", displayName(a.getUser()), "target", a.getChallenge().getTitle(), "action", a.isPassed() ? "completed" : "attempted", "time", a.getSubmittedAt())).toList(),
            "summary", ApiMaps.map("users", userCount, "challenges", challengeCount, "submissions", submissionCount)
        );
    }

    public Map<String, Object> smeDashboard() {
        User user = currentUser.get();
        long created = challenges.findByCreatedByOrderByCreatedAtDescIdDesc(user).size();
        return ApiMaps.map(
            "sme", ApiMaps.map("name", displayName(user), "email", user.getEmail(), "role", user.getRole(), "program_type", "GENERAL"),
            "selected_batch", "",
            "selected_super_batch", "",
            "selected_program_type", "",
            "batches", List.of(),
            "super_batches", List.of(),
            "batch_options", List.of(),
            "kpis", ApiMaps.map("created_challenges", created, "active_challenges", created, "assigned_learners", users.findByRoleAndStaffFalseOrderByEmailAsc("USER").size(), "submissions_count", submissions.count(), "success_rate", 0, "average_score", 0, "top_performing_challenge", null),
            "charts", ApiMaps.map("submission_trends", List.of(), "difficulty_analytics", difficultyAnalytics(), "challenge_analytics", challengeAnalytics(user), "technology_analytics", technologyAnalytics(), "activity_heatmap", List.of(), "completion_mix", submissionOutcomes(submissions.countByPassedTrue(), submissions.count() - submissions.countByPassedTrue()), "overview", ApiMaps.map("content_portfolio", List.of(), "attempt_mix", List.of())),
            "recent_activity", List.of()
        );
    }

    public Map<String, Object> userReport() {
        User user = currentUser.get();
        List<Submission> mine = submissions.findByUserId(user.getId());
        List<SubmissionAttempt> myAttempts = attempts.findByUserIdOrderBySubmittedAtDesc(user.getId());
        long completed = mine.stream().filter(Submission::isPassed).count();
        long attempted = mine.size();
        long successfulAttempts = myAttempts.stream().filter(SubmissionAttempt::isPassed).count();
        long totalAttempts = myAttempts.size();
        int totalXp = xpRepository.findByUserId(user.getId()).map(UserXP::getTotalXp).orElse(0);
        int averageXp = completed == 0 ? 0 : (int) Math.round(mine.stream().filter(Submission::isPassed).mapToInt(Submission::getEarnedXp).average().orElse(0));
        long codeOfDayCompleted = mine.stream().filter(s -> s.isPassed() && s.getChallenge() != null && "CODE_OF_DAY".equals(s.getChallenge().getChallengeType())).count();
        int rank = leaderboard().stream()
            .filter(r -> Boolean.TRUE.equals(r.get("is_current_user")))
            .findFirst()
            .map(r -> ((Number) r.get("rank")).intValue())
            .orElse(0);
        List<Map<String, Object>> moduleProgress = modules.findByActiveTrueOrderByOrderAsc().stream()
            .map(module -> {
                List<Submission> moduleSubmissions = mine.stream()
                    .filter(s -> s.getChallenge() != null && s.getChallenge().getModule() != null && module.getId().equals(s.getChallenge().getModule().getId()) && "CHALLENGE".equals(s.getChallenge().getChallengeType()))
                    .toList();
                long moduleCompleted = moduleSubmissions.stream().filter(Submission::isPassed).count();
                long moduleTotal = challenges.findAllByOrderByCreatedAtDescIdDesc().stream()
                    .filter(c -> c.getModule() != null && module.getId().equals(c.getModule().getId()) && "CHALLENGE".equals(c.getChallengeType()))
                    .count();
                return ApiMaps.map(
                    "name", module.getName(),
                    "completed", moduleCompleted,
                    "total", moduleTotal,
                    "percentage", ApiMaps.percent(moduleCompleted, moduleTotal),
                    "validation_success", 0,
                    "xp", moduleSubmissions.stream().mapToInt(Submission::getEarnedXp).sum(),
                    "color", "#3b82f6"
                );
            })
            .toList();
        List<Map<String, Object>> recent = myAttempts.stream().limit(8).map(attempt -> ApiMaps.map(
            "id", attempt.getId(),
            "title", (attempt.isPassed() ? "Completed challenge: " : "Attempted challenge: ") + (attempt.getChallenge() == null ? "Challenge" : attempt.getChallenge().getTitle()),
            "date", attempt.getSubmittedAt(),
            "points", "+" + attempt.getAwardedXp() + " XP",
            "xp", attempt.getAwardedXp(),
            "passed", attempt.isPassed(),
            "challenge_type", attempt.getChallenge() == null ? null : attempt.getChallenge().getChallengeType()
        )).toList();
        return ApiMaps.map(
            "summary", ApiMaps.map(
                "current_rank", rank,
                "total_learners", users.findByRoleAndStaffFalseOrderByEmailAsc("USER").size(),
                "total_xp", totalXp,
                "weekly_xp", 0,
                "challenges_completed", completed,
                "completed_challenges", completed,
                "attempted_challenges", attempted,
                "success_rate", ApiMaps.percent(successfulAttempts, totalAttempts),
                "average_xp", averageXp,
                "pass_rate", ApiMaps.percent(successfulAttempts, totalAttempts),
                "total_submissions", totalAttempts,
                "completion_percentage", ApiMaps.percent(completed, Math.max(challenges.count(), 0)),
                "assessment_completion", ApiMaps.percent(
                    myAttempts.stream().filter(a -> a.getChallenge() != null && "ASSESSMENT".equals(a.getChallenge().getChallengeType()) && a.isPassed()).count(),
                    myAttempts.stream().filter(a -> a.getChallenge() != null && "ASSESSMENT".equals(a.getChallenge().getChallengeType())).count()
                ),
                "code_of_day_completed", codeOfDayCompleted
            ),
            "module_progress", moduleProgress,
            "strengths", List.of(),
            "improvements", List.of(),
            "recent_activity", recent
        );
    }

    public Map<String, Object> adminReport() {
        Map<String, Object> dashboard = adminDashboard();
        long totalUsers = users.count();
        long activeUsers = users.findAll().stream().filter(User::isActive).count();
        long totalSubmissions = submissions.count();
        long completed = submissions.countByPassedTrue();
        long challengeSlots = Math.max(totalUsers * challenges.count(), 0);
        return ApiMaps.map(
            "selected_batch", "",
            "selected_super_batch", "",
            "selected_program_type", "",
            "super_batches", List.of(),
            "batch_options", List.of(),
            "batches", List.of(),
            "overview", dashboard.get("summary"),
            "kpis", ApiMaps.map(
                "total_users", totalUsers,
                "active_users", activeUsers,
                "completed_challenges", completed,
                "total_assigned_challenges", challengeSlots,
                "xp_total", totalXp(),
                "submissions_count", totalSubmissions,
                "challenge_completion_rate", ApiMaps.percent(completed, challengeSlots),
                "average_scores", averageScore(),
                "assessment_average_score", averageScore(),
                "assessment_completion_rate", ApiMaps.percent(completed, totalSubmissions)
            ),
            "charts", ApiMaps.map(
                "batch_performance", weeklyPerformance(),
                "xp_distribution", xpDistribution(),
                "submissions_over_time", submissionsOverTime(),
                "challenge_completion_trends", weeklyPerformance(),
                "active_users", activeUsersOverTime(),
                "difficulty_analytics", difficultyAnalytics(),
                "assessment_success_trends", weeklyPerformance(),
                "module_performance", modulePerformance(),
                "leaderboard_distribution", leaderboardDistribution(),
                "activity_heatmap", List.of()
            ),
            "leaderboard", leaderboard().stream().map(row -> ApiMaps.map(
                "rank", row.get("rank"),
                "name", row.get("name"),
                "email", row.get("email"),
                "user_id", row.get("email"),
                "xpPoints", row.get("xpPoints"),
                "challengesCompleted", row.get("challengesCompleted"),
                "totalTime", "00:00:00",
                "totalTimeSeconds", 0
            )).toList(),
            "recent_activity", dashboard.get("recent_activity")
        );
    }

    public List<Map<String, Object>> myActivity() {
        return submissions.findByUserId(currentUser.get().getId()).stream()
            .map(s -> ApiMaps.map("id", s.getId(), "target", s.getChallenge().getTitle(), "action", s.isPassed() ? "Completed challenge" : "Attempted challenge", "time", s.getSubmittedAt()))
            .toList();
    }

    private String displayName(User user) {
        String local = user.getEmail() == null ? "User" : user.getEmail().split("@")[0];
        return local.replace(".", " ").replace("_", " ");
    }

    private String roleLabel(String role) {
        return switch (role == null ? "USER" : role) {
            case "ADMIN" -> "Admins";
            case "SME" -> "SME authors";
            default -> "Learners";
        };
    }

    private int totalXp() {
        return xpRepository.findAll().stream().mapToInt(UserXP::getTotalXp).sum();
    }

    private double averageXp() {
        long count = users.count();
        return count == 0 ? 0 : Math.round((totalXp() * 10.0) / count) / 10.0;
    }

    private int averageScore() {
        List<SubmissionAttempt> scored = attempts.findAll().stream().filter(a -> a.getTotalCount() > 0).toList();
        if (scored.isEmpty()) return 0;
        double total = scored.stream().mapToDouble(a -> (a.getPassedCount() * 100.0) / a.getTotalCount()).sum();
        return (int) Math.round(total / scored.size());
    }

    private List<Map<String, Object>> submissionOutcomes(long passed, long failed) {
        return List.of(ApiMaps.map("name", "Passed", "value", passed), ApiMaps.map("name", "Not yet passed", "value", failed));
    }

    private List<Map<String, Object>> challengeTypeSubmissions() {
        Map<String, Long> counts = submissions.findAll().stream()
            .filter(s -> s.getChallenge() != null)
            .collect(Collectors.groupingBy(s -> s.getChallenge().getChallengeType() == null ? "Other" : s.getChallenge().getChallengeType(), Collectors.counting()));
        return counts.entrySet().stream().map(e -> ApiMaps.map("type", e.getKey(), "submissions", e.getValue())).toList();
    }

    private List<Map<String, Object>> moduleCompletion() {
        return challenges.findAllByOrderByCreatedAtDescIdDesc().stream()
            .collect(Collectors.groupingBy(c -> c.getModule() == null ? "Other" : c.getModule().getName(), LinkedHashMap::new, Collectors.counting()))
            .entrySet().stream()
            .map(e -> ApiMaps.map("tech", e.getKey(), "completed", 0))
            .toList();
    }

    private List<Map<String, Object>> modulePerformance() {
        return challenges.findAllByOrderByCreatedAtDescIdDesc().stream()
            .collect(Collectors.groupingBy(c -> c.getModule() == null ? "Other" : c.getModule().getName(), LinkedHashMap::new, Collectors.counting()))
            .entrySet().stream()
            .map(e -> ApiMaps.map("module", e.getKey(), "completion", 0, "submissions", 0))
            .toList();
    }

    private List<Map<String, Object>> difficultyAnalytics() {
        List<SubmissionAttempt> allAttempts = attempts.findAll();
        return challenges.findAllByOrderByCreatedAtDescIdDesc().stream()
            .collect(Collectors.groupingBy(c -> c.getDifficulty() == null ? "UNKNOWN" : c.getDifficulty(), LinkedHashMap::new, Collectors.toList()))
            .entrySet().stream()
            .map(e -> {
                List<Long> ids = e.getValue().stream().map(c -> c.getId()).toList();
                List<SubmissionAttempt> scoped = allAttempts.stream().filter(a -> a.getChallenge() != null && ids.contains(a.getChallenge().getId())).toList();
                return ApiMaps.map("difficulty", e.getKey(), "challenges", e.getValue().size(), "successRate", ApiMaps.percent(scoped.stream().filter(SubmissionAttempt::isPassed).count(), scoped.size()));
            })
            .toList();
    }

    private List<Map<String, Object>> technologyAnalytics() {
        return challenges.findAllByOrderByCreatedAtDescIdDesc().stream()
            .collect(Collectors.groupingBy(c -> c.getTechnology() == null ? "html" : c.getTechnology(), LinkedHashMap::new, Collectors.counting()))
            .entrySet().stream()
            .map(e -> ApiMaps.map("technology", e.getKey(), "completionRate", 0, "submissions", 0))
            .toList();
    }

    private List<Map<String, Object>> challengeAnalytics(User owner) {
        return challenges.findByCreatedByOrderByCreatedAtDescIdDesc(owner).stream()
            .map(c -> ApiMaps.map("id", c.getId(), "title", c.getTitle(), "technology", c.getTechnology(), "difficulty", c.getDifficulty(), "assigned", users.findByRoleAndStaffFalseOrderByEmailAsc("USER").size(), "completed", 0, "completionRate", 0, "averageScore", 0, "passCount", 0, "failCount", 0))
            .toList();
    }

    private List<Map<String, Object>> weeklyPerformance() {
        return java.util.stream.IntStream.rangeClosed(1, 6)
            .mapToObj(i -> ApiMaps.map("week", "Week " + i, "score", 0, "completionRate", 0))
            .toList();
    }

    private List<Map<String, Object>> submissionsOverTime() {
        return submissions.findAll().stream()
            .collect(Collectors.groupingBy(s -> s.getSubmittedAt() == null ? LocalDate.now().toString() : s.getSubmittedAt().toLocalDate().toString(), LinkedHashMap::new, Collectors.toList()))
            .entrySet().stream()
            .map(e -> ApiMaps.map("date", e.getKey(), "submissions", e.getValue().size(), "completed", e.getValue().stream().filter(Submission::isPassed).count()))
            .toList();
    }

    private List<Map<String, Object>> activeUsersOverTime() {
        return submissions.findAll().stream()
            .collect(Collectors.groupingBy(s -> s.getSubmittedAt() == null ? LocalDate.now().toString() : s.getSubmittedAt().toLocalDate().toString(), LinkedHashMap::new, Collectors.mapping(s -> s.getUser().getId(), Collectors.toSet())))
            .entrySet().stream()
            .map(e -> ApiMaps.map("date", e.getKey(), "activeUsers", e.getValue().size()))
            .toList();
    }

    private List<Map<String, Object>> xpDistribution() {
        int[] buckets = {0, 0, 0, 0};
        for (UserXP xp : xpRepository.findAll()) {
            int value = xp.getTotalXp();
            if (value >= 1000) buckets[3]++;
            else if (value >= 500) buckets[2]++;
            else if (value >= 100) buckets[1]++;
            else buckets[0]++;
        }
        return List.of(
            ApiMaps.map("range", "0-99", "users", buckets[0]),
            ApiMaps.map("range", "100-499", "users", buckets[1]),
            ApiMaps.map("range", "500-999", "users", buckets[2]),
            ApiMaps.map("range", "1000+", "users", buckets[3])
        );
    }

    private List<Map<String, Object>> leaderboardDistribution() {
        int total = users.findByRoleAndStaffFalseOrderByEmailAsc("USER").size();
        return List.of(
            ApiMaps.map("range", "Top 10", "users", Math.min(total, 10)),
            ApiMaps.map("range", "11-25", "users", Math.max(Math.min(total, 25) - 10, 0)),
            ApiMaps.map("range", "26+", "users", Math.max(total - 25, 0))
        );
    }
}
