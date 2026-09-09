package com.codequest.backend.repository;

import com.codequest.backend.entity.TestCase;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByChallengeIdOrderByIdAsc(Long challengeId);
    void deleteByChallengeId(Long challengeId);
}
