package com.codequest.backend.service;

import com.codequest.backend.dto.ApiDtos.AuthResponse;
import com.codequest.backend.dto.ApiDtos.RegisterRequest;
import com.codequest.backend.dto.ApiDtos.UserDto;
import com.codequest.backend.entity.User;
import com.codequest.backend.exception.ApiException;
import com.codequest.backend.mapper.ApiMapper;
import com.codequest.backend.repository.UserRepository;
import com.codequest.backend.security.JwtService;
import java.time.OffsetDateTime;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final JwtService jwt;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, JwtService jwt, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.jwt = jwt;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        String email = jwt.parse(refreshToken).getSubject();
        User user = users.findByEmailIgnoreCase(email).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        return issue(user, false);
    }

    @Transactional
    public AuthResponse passwordLogin(String email, String password) {
        String normalized = normalize(email);
        User user = users.findByEmailIgnoreCase(normalized)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!user.isActive()) throw new ApiException(HttpStatus.FORBIDDEN, "Account is disabled");
        if (user.getPassword() == null || user.getPassword().isBlank() || !passwordEncoder.matches(String.valueOf(password), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return issue(user, false);
    }

    @Transactional
    public UserDto register(RegisterRequest request) {
        String fullName = clean(request.fullName());
        String email = normalize(request.email());
        String password = String.valueOf(request.password() == null ? "" : request.password());
        String confirmPassword = String.valueOf(request.confirmPassword() == null ? "" : request.confirmPassword());

        validateRegistration(fullName, email, password, confirmPassword);
        if (users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("USER");
        user.setActive(true);
        user.setStaff(false);
        user.setSuperuser(false);
        return ApiMapper.user(users.save(user));
    }

    @Transactional(readOnly = true)
    public UserDto me(String email) {
        User user = users.findByEmailIgnoreCase(normalize(email))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        return ApiMapper.user(user);
    }

    private AuthResponse issue(User user, boolean created) {
        user.setLastLogin(OffsetDateTime.now());
        users.save(user);
        return new AuthResponse(jwt.accessToken(user), jwt.refreshToken(user), user.getId(), user.getFullName(), user.getEmail(), user.getRole(), created);
    }

    private void validateRegistration(String fullName, String email, String password, String confirmPassword) {
        if (fullName.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "Full name is required");
        if (email.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "Email is required");
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw new ApiException(HttpStatus.BAD_REQUEST, "Enter a valid email address");
        if (password.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "Password is required");
        if (!password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
        }
        if (!password.equals(confirmPassword)) throw new ApiException(HttpStatus.BAD_REQUEST, "Confirm password must match password");
    }

    private static String normalize(String email) { return String.valueOf(email == null ? "" : email).trim().toLowerCase(Locale.ROOT); }
    private static String clean(String value) { return String.valueOf(value == null ? "" : value).trim().replaceAll("\\s+", " "); }
}
