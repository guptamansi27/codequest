package com.codequest.backend.repository;

import com.codequest.backend.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByEmployeeIdIgnoreCase(String employeeId);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByRoleIgnoreCase(String role);
    long countByRoleIgnoreCase(String role);
    List<User> findByRoleAndStaffFalseOrderByEmailAsc(String role);
}
