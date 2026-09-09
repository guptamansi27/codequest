package com.codequest.backend.repository;

import com.codequest.backend.entity.Module;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModuleRepository extends JpaRepository<Module, Long> {
    List<Module> findByActiveTrueOrderByOrderAsc();
    Optional<Module> findByNameIgnoreCase(String name);
}
