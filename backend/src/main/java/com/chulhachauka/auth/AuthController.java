package com.chulhachauka.auth;

import com.chulhachauka.auth.dto.AuthResponse;
import com.chulhachauka.auth.dto.LoginRequest;
import com.chulhachauka.auth.dto.RegisterRequest;
import com.chulhachauka.common.dto.ApiResponse;
import com.chulhachauka.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Creates a new user account and returns JWT tokens.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    /**
     * POST /api/auth/login
     * Authenticates a user and returns JWT tokens.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * POST /api/auth/refresh
     * Body: { "refreshToken": "<raw-refresh-token>" }
     * Validates the refresh token and issues a new access token (with rotation).
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody Map<String, String> body
    ) {
        String rawRefreshToken = body.get("refreshToken");
        AuthResponse response = authService.refresh(rawRefreshToken);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * POST /api/auth/logout
     * Revokes all refresh tokens for the currently authenticated user.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal User user
    ) {
        authService.logout(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
