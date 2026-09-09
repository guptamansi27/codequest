package com.codequest.backend.repository;

import com.codequest.backend.entity.UserModuleProgress;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserModuleProgressRepository extends JpaRepository<UserModuleProgress, Long> {
    List<UserModuleProgress> findByUserId(Long userId);
}
