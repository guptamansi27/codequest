package com.codequest.backend.security;

import com.codequest.backend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final long accessMinutes;
    private final long refreshDays;

    public JwtService(@Value("${codequest.jwt.secret}") String secret,
                      @Value("${codequest.jwt.access-token-minutes}") long accessMinutes,
                      @Value("${codequest.jwt.refresh-token-days}") long refreshDays) {
        String padded = (secret == null || secret.length() < 32) ? "change-me-change-me-change-me-change-me" : secret;
        this.key = Keys.hmacShaKeyFor(padded.getBytes(StandardCharsets.UTF_8));
        this.accessMinutes = accessMinutes;
        this.refreshDays = refreshDays;
    }

    public String accessToken(User user) { return token(user, accessMinutes, ChronoUnit.MINUTES, "access"); }
    public String refreshToken(User user) { return token(user, refreshDays, ChronoUnit.DAYS, "refresh"); }

    private String token(User user, long amount, ChronoUnit unit, String type) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(user.getEmail())
            .claim("user_id", user.getId())
            .claim("role", user.getRole())
            .claim("token_type", type)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(amount, unit)))
            .signWith(key)
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
