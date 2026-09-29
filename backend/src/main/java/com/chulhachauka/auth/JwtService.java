package com.chulhachauka.auth;

import com.chulhachauka.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessExpiry;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiry-seconds}") long accessExpiry
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpiry = accessExpiry;
    }

    // ── Token generation ──────────────────────────────────────────────────────

    /**
     * Generates a signed JWT access token for the given user.
     * Claims: sub = userId, phone, role, iat, exp.
     */
    public String generateAccessToken(User user) {
        long nowMillis = System.currentTimeMillis();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("phone", user.getPhone())
                .claim("role", user.getRole().name())
                .issuedAt(new Date(nowMillis))
                .expiration(new Date(nowMillis + accessExpiry * 1_000L))
                .signWith(signingKey)
                .compact();
    }

    // ── Claim extraction ──────────────────────────────────────────────────────

    public Long extractUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public String extractPhone(String token) {
        return parseClaims(token).get("phone", String.class);
    }

    // ── Validation ────────────────────────────────────────────────────────────

    /**
     * Returns {@code true} if the token is parseable, properly signed, and not expired.
     */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("JWT validation failed: {}", ex.getMessage());
            return false;
        }
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getAccessExpiry() {
        return accessExpiry;
    }
}
