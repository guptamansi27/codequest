package com.codequest.backend.config;

import com.codequest.backend.entity.User;
import com.codequest.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {
    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    @Bean
    @Order(1)
    CommandLineRunner createDefaultAdmin(
        UserRepository users,
        PasswordEncoder passwordEncoder,
        @Value("${codequest.admin.full-name}") String adminFullName,
        @Value("${codequest.admin.email}") String adminEmail,
        @Value("${codequest.admin.password}") String adminPassword
    ) {
        return args -> {
            if (users.existsByRoleIgnoreCase("ADMIN")) {
                log.info("Default administrator check passed: existing ADMIN account found.");
                return;
            }

            User admin = new User();
            admin.setFullName(adminFullName);
            admin.setEmail(adminEmail.trim().toLowerCase());
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            admin.setActive(true);
            admin.setStaff(true);
            admin.setSuperuser(true);
            users.save(admin);
            log.info("Default administrator created with email {}.", admin.getEmail());
        };
    }
}
