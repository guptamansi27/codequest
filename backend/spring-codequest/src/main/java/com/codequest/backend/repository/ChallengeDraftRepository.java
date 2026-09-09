package com.codequest.backend.repository;

import com.codequest.backend.entity.ChallengeDraft;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeDraftRepository extends JpaRepository<ChallengeDraft, Long> {
    @EntityGraph(attributePaths = {"user", "challenge"})
    Optional<ChallengeDraft> findByUserIdAndChallengeId(Long userId, Long challengeId);
    void deleteByChallengeId(Long challengeId);
}
