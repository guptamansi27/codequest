package com.codequest.backend.repository;

import com.codequest.backend.entity.SubmissionAttempt;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionAttemptRepository extends JpaRepository<SubmissionAttempt, Long> {
    @Override
    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    List<SubmissionAttempt> findAll();

    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    List<SubmissionAttempt> findByUserIdAndChallengeIdOrderBySubmittedAtDesc(Long userId, Long challengeId);

    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    List<SubmissionAttempt> findTop8ByOrderBySubmittedAtDesc();

    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    List<SubmissionAttempt> findByUserIdOrderBySubmittedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    List<SubmissionAttempt> findByChallengeIdOrderBySubmittedAtDesc(Long challengeId);

    void deleteByChallengeId(Long challengeId);
}
