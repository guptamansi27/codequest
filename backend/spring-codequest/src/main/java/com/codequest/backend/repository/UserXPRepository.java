package com.codequest.backend.repository;

import com.codequest.backend.entity.UserXP;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserXPRepository extends JpaRepository<UserXP, Long> {
    @EntityGraph(attributePaths = {"user"})
    Optional<UserXP> findByUserId(Long userId);

    @Override
    @EntityGraph(attributePaths = {"user"})
    List<UserXP> findAll();

    @EntityGraph(attributePaths = {"user"})
    List<UserXP> findAllByOrderByTotalXpDesc();
}
