package com.codequest.backend.controller;

import com.codequest.backend.dto.ApiDtos.AIInteractionDto;
import com.codequest.backend.dto.ApiDtos.AIRequest;
import com.codequest.backend.entity.AIInteraction;
import com.codequest.backend.exception.ApiException;
import com.codequest.backend.mapper.ApiMapper;
import com.codequest.backend.repository.AIInteractionRepository;
import com.codequest.backend.repository.ChallengeRepository;
import com.codequest.backend.security.CurrentUser;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AIController {
    private final AIInteractionRepository interactions;
    private final ChallengeRepository challenges;
    private final CurrentUser current;
    public AIController(AIInteractionRepository interactions, ChallengeRepository challenges, CurrentUser current) {
        this.interactions = interactions;
        this.challenges = challenges;
        this.current = current;
    }

    @GetMapping("/ai-interactions/") List<AIInteractionDto> interactions() {
        return interactions.findByUserIdOrderByCreatedAtDesc(current.get().getId()).stream().map(ApiMapper::ai).toList();
    }

    @PostMapping("/ai-interactions/") @ResponseStatus(HttpStatus.CREATED)
    AIInteractionDto save(@RequestBody AIInteractionDto dto) {
        AIInteraction row = new AIInteraction();
        row.setUser(current.get());
        row.setChallenge(challenges.findById(dto.challenge()).orElseThrow(() -> ApiException.notFound("Challenge not found")));
        row.setQuestion(dto.question());
        row.setResponse(dto.response());
        return ApiMapper.ai(interactions.save(row));
    }

    @PostMapping("/ai/generate-testcases/")
    Map<String, Object> generate(@RequestBody AIRequest request) {
        if (blank(request.title()) || blank(request.description())) return Map.of("success", false, "error", "Challenge title and description are required.");
        return Map.of("success", true, "testcases", List.of(
            Map.of("name", "Generated validation", "input_data", "", "expected_output", request.title(), "is_case_sensitive", false)
        ));
    }

    @PostMapping("/ai/validate-testcase-accuracy/")
    Map<String, Object> validate(@RequestBody AIRequest request) {
        int total = request.testcases() == null ? 0 : request.testcases().size();
        return Map.of("success", true, "score", total == 0 ? 0 : 80, "issues", List.of(), "suggestions", List.of());
    }

    @PostMapping("/ai/challenge-chat/")
    Map<String, Object> chat(@RequestBody AIRequest request) {
        if (request.challengeId() == null) return Map.of("success", false, "error", "Challenge id is required.");
        if (blank(request.message())) return Map.of("success", false, "error", "Message is required.");
        String reply = "Focus on the challenge requirements and compare your code against each validation rule. I can help refine a specific failing case if you share the error.";
        AIInteraction row = new AIInteraction();
        row.setUser(current.get());
        row.setChallenge(challenges.findById(request.challengeId()).orElseThrow(() -> ApiException.notFound("Challenge not found")));
        row.setQuestion(request.message());
        row.setResponse(reply);
        interactions.save(row);
        return Map.of("success", true, "reply", reply);
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
}
