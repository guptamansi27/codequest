package com.codequest.backend.repository;

import com.codequest.backend.entity.AIInteraction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AIInteractionRepository extends JpaRepository<AIInteraction, Long> {
    List<AIInteraction> findByUserIdOrderByCreatedAtDesc(Long userId);
    void deleteByChallengeId(Long challengeId);
}
