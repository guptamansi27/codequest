package com.codequest.backend.controller;

import com.codequest.backend.dto.ApiDtos.UserDto;
import com.codequest.backend.entity.User;
import com.codequest.backend.exception.ApiException;
import com.codequest.backend.mapper.ApiMapper;
import com.codequest.backend.repository.UserRepository;
import com.codequest.backend.security.CurrentUser;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users;
    private final CurrentUser current;
    private final PasswordEncoder passwordEncoder;
    public UserController(UserRepository users, CurrentUser current, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.current = current;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/") @PreAuthorize("hasAnyRole('ADMIN','SME')")
    List<UserDto> list(@RequestParam(required = false) String search, @RequestParam(required = false) String q, @RequestParam(required = false) String role) {
        String term = (search == null || search.isBlank()) ? q : search;
        return users.findAll().stream()
            .filter(u -> role == null || role.isBlank() || role.equalsIgnoreCase(u.getRole()))
            .filter(u -> matches(u, term))
            .map(ApiMapper::user)
            .toList();
    }

    @PostMapping("/") @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    UserDto create(@RequestBody Map<String, Object> body) {
        String email = normalize(String.valueOf(body.get("email")));
        String fullName = clean(String.valueOf(body.getOrDefault("full_name", "")));
        String password = String.valueOf(body.getOrDefault("password", ""));
        if (email.isBlank()) throw ApiException.badRequest("Email is required");
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw ApiException.badRequest("Enter a valid email address");
        if (users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");

        User u = new User();
        u.setEmail(email);
        u.setFullName(fullName.isBlank() ? email : fullName);
        if (!password.isBlank()) u.setPassword(passwordEncoder.encode(password));
        u.setRole(normalizeRole(String.valueOf(body.getOrDefault("role", "USER"))));
        u.setStaff("ADMIN".equals(u.getRole()));
        u.setSuperuser("ADMIN".equals(u.getRole()));
        u.setActive(!body.containsKey("is_active") || Boolean.TRUE.equals(body.get("is_active")));
        return ApiMapper.user(users.save(u));
    }

    @GetMapping("/{id}/") @PreAuthorize("hasAnyRole('ADMIN','SME')")
    UserDto get(@PathVariable Long id) { return ApiMapper.user(find(id)); }

    @PatchMapping("/{id}/") @PreAuthorize("hasRole('ADMIN')")
    UserDto patch(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User u = find(id);
        User actor = current.get();
        if (actor.getId().equals(u.getId()) && body.containsKey("role")) throw ApiException.forbidden("You cannot modify your own role.");
        if (body.containsKey("full_name")) u.setFullName(String.valueOf(body.get("full_name")).trim());
        if (body.containsKey("role")) {
            String role = normalizeRole(String.valueOf(body.get("role")));
            u.setRole(role);
            u.setStaff("ADMIN".equals(role));
            u.setSuperuser("ADMIN".equals(role));
        }
        if (body.containsKey("is_active")) u.setActive(Boolean.TRUE.equals(body.get("is_active")));
        return ApiMapper.user(users.save(u));
    }

    @DeleteMapping("/{id}/") @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) { users.delete(find(id)); }

    private User find(Long id) { return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found")); }

    private boolean matches(User user, String term) {
        if (term == null || term.isBlank()) return true;
        String needle = term.toLowerCase();
        return contains(user.getFullName(), needle) || contains(user.getEmail(), needle);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase().contains(needle);
    }

    private static String normalizeRole(String value) {
        String role = String.valueOf(value == null ? "USER" : value).trim().toUpperCase(Locale.ROOT);
        if (!List.of("ADMIN", "SME", "USER").contains(role)) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role");
        return role;
    }

    private static String normalize(String value) {
        return String.valueOf(value == null ? "" : value).trim().toLowerCase(Locale.ROOT);
    }

    private static String clean(String value) {
        return String.valueOf(value == null ? "" : value).trim().replaceAll("\\s+", " ");
    }
}
