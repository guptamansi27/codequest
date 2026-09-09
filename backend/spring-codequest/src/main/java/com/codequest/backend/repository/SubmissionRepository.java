package com.codequest.backend.repository;

import com.codequest.backend.entity.Submission;
import com.codequest.backend.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    @Override
    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    List<Submission> findAll();

    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    List<Submission> findByUserOrderBySubmittedAtDesc(User user);

    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    List<Submission> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "challenge", "challenge.module"})
    Optional<Submission> findByUserIdAndChallengeId(Long userId, Long challengeId);

    long countByPassedTrue();
    long countByUserIdAndPassedTrue(Long userId);
    void deleteByChallengeId(Long challengeId);
}
