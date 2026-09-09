package com.codequest.backend.repository;

import com.codequest.backend.entity.Challenge;
import com.codequest.backend.entity.User;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    @Override
    @EntityGraph(attributePaths = {"module", "createdBy", "testCases", "employeeAssignments", "employeeAssignments.user", "employeeAssignments.assignedBy"})
    Optional<Challenge> findById(Long id);

    @EntityGraph(attributePaths = {"module", "createdBy", "employeeAssignments", "employeeAssignments.user"})
    List<Challenge> findAllByOrderByCreatedAtDescIdDesc();
    @EntityGraph(attributePaths = {"module", "createdBy", "employeeAssignments", "employeeAssignments.user"})
    List<Challenge> findByCreatedByOrderByCreatedAtDescIdDesc(User createdBy);
    @EntityGraph(attributePaths = {"module", "createdBy", "employeeAssignments", "employeeAssignments.user"})
    List<Challenge> findByActiveTrueAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderByCreatedAtDescIdDesc(OffsetDateTime start, OffsetDateTime end);
}
