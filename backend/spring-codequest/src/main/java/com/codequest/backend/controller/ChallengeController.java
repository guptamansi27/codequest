package com.codequest.backend.controller;

import com.codequest.backend.dto.ApiDtos.ChallengeDto;
import com.codequest.backend.dto.ApiDtos.ChallengeRequest;
import com.codequest.backend.mapper.ApiMapper;
import com.codequest.backend.service.ChallengeService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/challenges")
public class ChallengeController {
    private final ChallengeService service;
    public ChallengeController(ChallengeService service) { this.service = service; }

    @GetMapping("/") List<ChallengeDto> list(@RequestParam(required = false) String type, @RequestParam(required = false) String status) {
        return service.list(type, status).stream().map(c -> ApiMapper.challenge(c, false)).toList();
    }
    @PostMapping("/") @ResponseStatus(HttpStatus.CREATED) Object create(@RequestBody ChallengeRequest request) {
        if (request.challenges() != null) return request.challenges().stream().map(service::create).map(c -> ApiMapper.challenge(c, true)).toList();
        return ApiMapper.challenge(service.create(request), true);
    }
    @GetMapping("/{id}/") ChallengeDto get(@PathVariable Long id) { return ApiMapper.challenge(service.getVisible(id), true); }
    @PatchMapping("/{id}/") ChallengeDto patch(@PathVariable Long id, @RequestBody ChallengeRequest request) { return ApiMapper.challenge(service.update(id, request), true); }
    @DeleteMapping("/{id}/") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable Long id) { service.delete(id); }
    @PostMapping("/{id}/clone/") @ResponseStatus(HttpStatus.CREATED) ChallengeDto clone(@PathVariable Long id) { return ApiMapper.challenge(service.clone(id), true); }
    @PatchMapping("/{id}/toggle/") Map<String, Object> toggle(@PathVariable Long id, @RequestBody ChallengeRequest request) {
        var c = service.toggle(id, request);
        return Map.of("id", c.getId(), "is_active", c.isActive(), "chatbot_enabled", c.isChatbotEnabled(), "is_chatbot_enabled", c.isChatbotEnabledAlias());
    }
    @GetMapping("/bulk-upload/template/") Map<String, Object> template() { return Map.of("columns", List.of("title", "description", "difficulty", "module", "type", "start_time", "end_time")); }
    @PostMapping("/bulk-upload/validate/") Map<String, Object> validateBulk() { return Map.of("valid", true, "errors", List.of(), "preview", List.of()); }
    @PostMapping("/bulk-upload/import/") Map<String, Object> importBulk() { return Map.of("created", 0, "updated", 0); }
    @GetMapping("/bulk-upload/errors/{token}/") Map<String, Object> errors(@PathVariable String token) { return Map.of("token", token, "errors", List.of()); }
    @GetMapping("/{id}/activity/") Map<String, Object> activity(@PathVariable Long id) { return Map.of("challenge", id, "activity", List.of()); }
    @GetMapping("/{id}/insights/") Map<String, Object> insights(@PathVariable Long id) { return service.insights(id); }
    @GetMapping("/{id}/insights/export/") Map<String, Object> insightsExport(@PathVariable Long id) { return insights(id); }
}
