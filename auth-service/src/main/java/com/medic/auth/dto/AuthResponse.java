package com.medic.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Returned on successful login and token refresh.
 * The frontend stores accessToken in memory (Zustand) and refreshToken in an HttpOnly cookie.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
    String      accessToken,
    String      refreshToken,
    long        expiresIn,       // access token TTL in seconds
    UserPayload user
) {
    public record UserPayload(
        Long   id,
        String username,
        String fullName,
        String email,
        String role,
        String facilityId,
        String facilityName
    ) {}
}
