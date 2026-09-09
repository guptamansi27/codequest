package com.codequest.backend.controller;

import com.codequest.backend.dto.ApiDtos.SubmissionRequest;
import com.codequest.backend.mapper.ApiMapper;
import com.codequest.backend.repository.UserModuleProgressRepository;
import com.codequest.backend.repository.UserXPRepository;
import com.codequest.backend.security.CurrentUser;
import com.codequest.backend.service.LearningService;
import com.codequest.backend.service.ReportingService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class LearningController {
    private final LearningService learning;
    private final ReportingService reporting;
    private final UserXPRepository xpRepository;
    private final UserModuleProgressRepository progressRepository;
    private final CurrentUser current;

    public LearningController(LearningService learning, ReportingService reporting, UserXPRepository xpRepository,
                              UserModuleProgressRepository progressRepository, CurrentUser current) {
        this.learning = learning;
        this.reporting = reporting;
        this.xpRepository = xpRepository;
        this.progressRepository = progressRepository;
        this.current = current;
    }

    @GetMapping("/submissions/") List<?> submissions() { return learning.mySubmissions().stream().map(ApiMapper::submission).toList(); }
    @PostMapping("/submissions/") @ResponseStatus(HttpStatus.CREATED) Map<String, Object> submit(@RequestBody SubmissionRequest request) { return learning.submit(request); }
    @GetMapping("/submissions/{challengeId}/history/") List<?> history(@PathVariable Long challengeId) { return learning.history(challengeId).stream().map(ApiMapper::attempt).toList(); }
    @GetMapping("/drafts/{challengeId}/") Map<String, Object> getDraft(@PathVariable Long challengeId) { return learning.getDraft(challengeId); }
    @PutMapping("/drafts/{challengeId}/") Object putDraft(@PathVariable Long challengeId, @RequestBody Map<String, String> body) { return ApiMapper.draft(learning.saveDraft(challengeId, body.get("code"))); }
    @PostMapping("/challenges/{challengeId}/timer/") Map<String, Object> timer(@PathVariable Long challengeId, @RequestBody Map<String, String> body) { return learning.timer(challengeId, body.getOrDefault("action", "sync")); }
    @GetMapping("/xp/") Object xp() {
        var user = current.get();
        var xp = xpRepository.findByUserId(user.getId()).orElseGet(() -> {
            var row = new com.codequest.backend.entity.UserXP();
            row.setUser(user);
            return xpRepository.save(row);
        });
        return ApiMapper.xp(xp);
    }
    @GetMapping("/leaderboard/") List<Map<String, Object>> leaderboard() { return reporting.leaderboard(); }
    @GetMapping("/reports/user/") Map<String, Object> userReport() { return reporting.userReport(); }
    @GetMapping("/reports/admin/") Map<String, Object> adminReport() { return reporting.adminReport(); }
    @GetMapping("/reports/sme/export/") Map<String, Object> smeExport() { return Map.of("rows", List.of()); }
    @GetMapping("/dashboard/admin/") Map<String, Object> adminDashboard() { return reporting.adminDashboard(); }
    @GetMapping("/dashboard/sme/") Map<String, Object> smeDashboard() { return reporting.smeDashboard(); }
    @GetMapping("/dashboard/user/") Map<String, Object> userDashboard() { return reporting.userDashboard(); }
    @GetMapping("/module-progress/") List<?> progress() { return progressRepository.findByUserId(current.get().getId()).stream().map(ApiMapper::progress).toList(); }
}
