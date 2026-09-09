package com.codequest.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public final class ApiDtos {
    private ApiDtos() {}

    public record AuthRequest(String email, String password, String refresh) {}
    public record RegisterRequest(String fullName, String email, String password, String confirmPassword) {}
    public record AuthResponse(String access, String refresh, Long id, String fullName, String email, String role, Boolean isNewUser) {}
    public record ErrorResponse(String error) {}
    public record DetailResponse(String detail) {}
    public record UserDto(Long id, String fullName, String email, String role, Boolean isActive, Boolean isStaff, OffsetDateTime lastLogin, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
    public record ModuleDto(Long id, String name, Integer order, Boolean isActive) {}
    public record TestCaseDto(Long id, String name, String inputData, String expectedOutput, Boolean isCaseSensitive) {}
    public record ChallengeAssignmentDto(Long id, String employeeId, String email, Long assignedUser, OffsetDateTime assignedAt) {}
    public record ChallengeDto(
        Long id,
        String title,
        String description,
        String difficulty,
        Long module,
        String moduleName,
        String challengeType,
        String type,
        String technology,
        JsonNode starterCode,
        Integer xpPoints,
        Boolean chatbotEnabled,
        Boolean isChatbotEnabled,
        Boolean isActive,
        List<ChallengeAssignmentDto> employeeAssignments,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        OffsetDateTime createdAt,
        List<TestCaseDto> testCases
    ) {}
    public record ChallengeRequest(
        String title,
        String description,
        String difficulty,
        Long module,
        String challengeType,
        String type,
        String technology,
        JsonNode starterCode,
        Integer xpPoints,
        Boolean chatbotEnabled,
        Boolean isChatbotEnabled,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        Boolean isActive,
        List<TestCaseDto> testCases,
        List<String> employeeIds,
        List<ChallengeRequest> challenges
    ) {}
    public record SubmissionRequest(Long challenge, String submittedCode, JsonNode clientEvaluation) {}
    public record SubmissionDto(Long id, Long user, Long challenge, String submittedCode, Boolean isPassed, Integer passedCount, Integer totalCount, Integer earnedXp, OffsetDateTime submittedAt) {}
    public record SubmissionAttemptDto(Long id, Long challenge, String submittedCode, Boolean isPassed, Integer passedCount, Integer totalCount, Integer awardedXp, OffsetDateTime submittedAt) {}
    public record DraftDto(Long id, Long challenge, String code, OffsetDateTime updatedAt) {}
    public record XPDto(Long id, Long user, Integer totalXp, OffsetDateTime updatedAt) {}
    public record ProgressDto(Long id, Long user, Long module, Boolean isCompleted, OffsetDateTime completedAt) {}
    public record AIInteractionDto(Long id, Long user, Long challenge, String question, String response, OffsetDateTime createdAt) {}
    public record AIRequest(String title, String description, String technology, String difficulty, List<Map<String, Object>> testcases, Long challengeId, String message, String currentCode) {}
}
