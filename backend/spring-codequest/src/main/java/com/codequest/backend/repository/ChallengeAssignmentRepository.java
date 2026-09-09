package com.codequest.backend.repository;

import com.codequest.backend.entity.ChallengeAssignment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeAssignmentRepository extends JpaRepository<ChallengeAssignment, Long> {
    List<ChallengeAssignment> findByChallengeId(Long challengeId);
    boolean existsByChallengeIdAndUserId(Long challengeId, Long userId);
    void deleteByChallengeId(Long challengeId);
}
