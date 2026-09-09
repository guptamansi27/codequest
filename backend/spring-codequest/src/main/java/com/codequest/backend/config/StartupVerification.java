package com.codequest.backend.config;

import com.codequest.backend.entity.Module;
import com.codequest.backend.repository.ModuleRepository;
import com.codequest.backend.repository.UserRepository;
import java.util.List;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class StartupVerification {
    private static final Logger log = LoggerFactory.getLogger(StartupVerification.class);
    private static final List<String> REQUIRED_TABLES = List.of(
        "apis_user",
        "apis_module",
        "apis_challenge",
        "apis_testcase",
        "apis_challengeassignment"
    );

    @Bean
    @Order(2)
    ApplicationRunner verifyStartup(DataSource dataSource, Flyway flyway, UserRepository users, ModuleRepository modules) {
        return args -> {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            jdbc.queryForObject("SELECT 1", Integer.class);
            log.info("Database connection verified.");

            var migration = flyway.info().current();
            log.info("Flyway migration status verified. Current version: {}.", migration == null ? "none" : migration.getVersion());

            for (String table : REQUIRED_TABLES) {
                Boolean exists = jdbc.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?)",
                    Boolean.class,
                    table
                );
                if (!Boolean.TRUE.equals(exists)) {
                    throw new IllegalStateException("Required table is missing: " + table);
                }
            }
            log.info("Required database tables verified.");

            seedModules(modules);
            log.info("Initial module seed data verified.");
            log.info("Administrator verification complete. ADMIN accounts present: {}.", users.countByRoleIgnoreCase("ADMIN"));
        };
    }

    private void seedModules(ModuleRepository modules) {
        createModuleIfMissing(modules, "HTML", 1);
        createModuleIfMissing(modules, "CSS", 2);
        createModuleIfMissing(modules, "JS", 3);
        createModuleIfMissing(modules, "REACT", 4);
    }

    private void createModuleIfMissing(ModuleRepository modules, String name, int order) {
        modules.findByNameIgnoreCase(name).orElseGet(() -> {
            Module module = new Module();
            module.setName(name);
            module.setOrder(order);
            module.setActive(true);
            return modules.save(module);
        });
    }
}
