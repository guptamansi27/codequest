package com.codequest.backend.repository;

import com.codequest.backend.entity.ChallengeAttempt;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeAttemptRepository extends JpaRepository<ChallengeAttempt, Long> {
    Optional<ChallengeAttempt> findByUserIdAndChallengeId(Long userId, Long challengeId);
    void deleteByChallengeId(Long challengeId);
}
