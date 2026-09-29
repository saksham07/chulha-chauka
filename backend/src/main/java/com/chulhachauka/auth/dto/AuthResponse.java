package com.chulhachauka.auth.dto;

import com.chulhachauka.user.Role;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UserInfo user
) {
    public record UserInfo(
            Long id,
            String name,
            String phone,
            Role role
    ) {}
}
