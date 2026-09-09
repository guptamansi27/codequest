package com.codequest.backend.controller;

import com.codequest.backend.dto.ApiDtos.AuthRequest;
import com.codequest.backend.dto.ApiDtos.AuthResponse;
import com.codequest.backend.dto.ApiDtos.DetailResponse;
import com.codequest.backend.dto.ApiDtos.RegisterRequest;
import com.codequest.backend.dto.ApiDtos.UserDto;
import com.codequest.backend.service.AuthService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }
    @PostMapping({"/login", "/login/"}) AuthResponse login(@RequestBody AuthRequest request) { return auth.passwordLogin(request.email(), request.password()); }
    @PostMapping({"/register", "/register/"}) @ResponseStatus(HttpStatus.CREATED) UserDto register(@RequestBody RegisterRequest request) { return auth.register(request); }
    @GetMapping({"/me", "/me/"}) UserDto me(Authentication authentication) { return auth.me(authentication.getName()); }
    @PostMapping("/token/refresh/") AuthResponse refresh(@RequestBody AuthRequest request) { return auth.refresh(request.refresh()); }
    @PostMapping("/logout/") ResponseEntity<Map<String, String>> logout() { return ResponseEntity.ok(Map.of("message", "Logout successful")); }
}
