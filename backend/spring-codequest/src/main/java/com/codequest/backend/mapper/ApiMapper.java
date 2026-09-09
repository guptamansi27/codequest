package com.codequest.backend.mapper;

import com.codequest.backend.dto.ApiDtos.*;
import com.codequest.backend.entity.*;
import java.util.List;

public final class ApiMapper {
    private ApiMapper() {}

    public static UserDto user(User u) {
        return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.isActive(), u.isStaff(), u.getLastLogin(), u.getCreatedAt(), u.getUpdatedAt());
    }

    public static ModuleDto module(com.codequest.backend.entity.Module m) {
        return new ModuleDto(m.getId(), m.getName(), m.getOrder(), m.isActive());
    }

    public static TestCaseDto testCase(TestCase t) {
        return new TestCaseDto(t.getId(), t.getName(), t.getInputData(), t.getExpectedOutput(), t.isCaseSensitive());
    }

    public static ChallengeAssignmentDto assignment(ChallengeAssignment a) {
        User u = a.getUser();
        return new ChallengeAssignmentDto(a.getId(), u == null ? null : u.getEmployeeId(), u == null ? null : u.getEmail(), u == null ? null : u.getId(), a.getAssignedAt());
    }

    public static ChallengeDto challenge(Challenge c, boolean includeTestCases) {
        List<TestCaseDto> tests = includeTestCases ? c.getTestCases().stream().map(ApiMapper::testCase).toList() : null;
        return new ChallengeDto(
            c.getId(),
            c.getTitle(),
            c.getDescription(),
            c.getDifficulty(),
            c.getModule() == null ? null : c.getModule().getId(),
            c.getModule() == null ? null : c.getModule().getName(),
            c.getChallengeType(),
            c.getType(),
            c.getTechnology(),
            c.getStarterCode(),
            c.getXpPoints(),
            c.isChatbotEnabled(),
            c.isChatbotEnabledAlias(),
            c.isActive(),
            c.getEmployeeAssignments().stream().map(ApiMapper::assignment).toList(),
            c.getStartTime(),
            c.getEndTime(),
            c.getCreatedAt(),
            tests
        );
    }

    public static SubmissionDto submission(Submission s) {
        return new SubmissionDto(s.getId(), s.getUser().getId(), s.getChallenge().getId(), s.getSubmittedCode(), s.isPassed(), s.getPassedCount(), s.getTotalCount(), s.getEarnedXp(), s.getSubmittedAt());
    }

    public static SubmissionAttemptDto attempt(SubmissionAttempt a) {
        return new SubmissionAttemptDto(a.getId(), a.getChallenge().getId(), a.getSubmittedCode(), a.isPassed(), a.getPassedCount(), a.getTotalCount(), a.getAwardedXp(), a.getSubmittedAt());
    }

    public static DraftDto draft(ChallengeDraft d) {
        return new DraftDto(d.getId(), d.getChallenge().getId(), d.getCode(), d.getUpdatedAt());
    }

    public static XPDto xp(UserXP xp) {
        return new XPDto(xp.getId(), xp.getUser().getId(), xp.getTotalXp(), xp.getUpdatedAt());
    }

    public static ProgressDto progress(UserModuleProgress p) {
        return new ProgressDto(p.getId(), p.getUser().getId(), p.getModule().getId(), p.isCompleted(), p.getCompletedAt());
    }

    public static AIInteractionDto ai(AIInteraction i) {
        return new AIInteractionDto(i.getId(), i.getUser().getId(), i.getChallenge().getId(), i.getQuestion(), i.getResponse(), i.getCreatedAt());
    }
}
