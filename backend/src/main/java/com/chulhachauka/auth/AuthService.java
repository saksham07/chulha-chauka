package com.chulhachauka.auth;

import com.chulhachauka.auth.dto.AuthResponse;
import com.chulhachauka.auth.dto.LoginRequest;
import com.chulhachauka.auth.dto.RegisterRequest;
import com.chulhachauka.common.exception.BusinessException;
import com.chulhachauka.user.Role;
import com.chulhachauka.user.User;
import com.chulhachauka.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-expiry-days:30}")
    private long refreshExpiryDays;

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByPhone(req.phone())) {
            throw new BusinessException("An account with this phone number already exists.");
        }
        if (req.email() != null && !req.email().isBlank() && userRepository.existsByEmail(req.email())) {
            throw new BusinessException("An account with this email address already exists.");
        }

        User user = User.builder()
                .name(req.name())
                .phone(req.phone())
                .email((req.email() != null && !req.email().isBlank()) ? req.email() : null)
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.USER)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: id={}, phone={}", user.getId(), user.getPhone());

        return buildAuthResponse(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest req) {
        // Deliberately use the same error message for both "not found" and "wrong password"
        // to avoid leaking which field is incorrect.
        User user = userRepository.findByPhone(req.phone())
                .orElseThrow(() -> new BusinessException("Invalid phone or password."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BusinessException("Invalid phone or password.");
        }

        // Revoke all existing refresh tokens for this user before issuing a new one.
        refreshTokenRepository.deleteByUserId(user.getId());

        log.info("User logged in: id={}", user.getId());
        return buildAuthResponse(user);
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String tokenHash = sha256Hex(rawRefreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("Invalid or unrecognised refresh token."));

        if (storedToken.isRevoked()) {
            throw new BusinessException("Refresh token has been revoked.");
        }
        if (storedToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("Refresh token has expired. Please log in again.");
        }

        User user = storedToken.getUser();

        // Rotate: revoke old token, issue a brand-new one.
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        log.info("Refresh token rotated for user id={}", user.getId());
        return buildAuthResponse(user);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
        log.info("User logged out, all refresh tokens revoked: id={}", userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);

        // Generate a raw refresh token, store only its SHA-256 hash.
        String rawRefreshToken = UUID.randomUUID().toString() + "-" + user.getId();
        String tokenHash = sha256Hex(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(OffsetDateTime.now().plusDays(refreshExpiryDays))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                jwtService.getAccessExpiry(),
                new AuthResponse.UserInfo(user.getId(), user.getName(), user.getPhone(), user.getRole())
        );
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
