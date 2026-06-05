package com.medic.auth.security;

import com.medic.auth.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiry-ms:900000}")        // 15 min default
    private long accessTokenExpiryMs;

    @Value("${jwt.refresh-token-expiry-ms:604800000}")    // 7 days default
    private long refreshTokenExpiryMs;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        // Key must be ≥ 32 bytes for HS384
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "JWT secret must be at least 32 characters. Check JWT_SECRET env var.");
        }
        signingKey = Keys.hmacShaKeyFor(keyBytes);
        log.info("JWT service initialised — access token TTL: {}ms, refresh TTL: {}ms",
            accessTokenExpiryMs, refreshTokenExpiryMs);
    }

    /**
     * Generates a short-lived access token with user claims embedded.
     * The API Gateway validates this token on every request.
     */
    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub",          user.getUsername());
        claims.put("userId",       user.getId());
        claims.put("email",        user.getEmail());
        claims.put("role",         user.getRole().name());
        claims.put("facilityId",   user.getFacilityId());
        claims.put("facilityName", user.getFacilityName());
        claims.put("type",         "ACCESS");
        return buildToken(claims, accessTokenExpiryMs);
    }

    /**
     * Generates a long-lived refresh token (minimal claims — just subject + type).
     * The actual refresh token record is stored in the database.
     */
    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub",    user.getUsername());
        claims.put("userId", user.getId());
        claims.put("type",   "REFRESH");
        return buildToken(claims, refreshTokenExpiryMs);
    }

    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        return getClaims(token).get("userId", Long.class);
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public String extractTokenType(String token) {
        return getClaims(token).get("type", String.class);
    }

    public long getRefreshTokenExpiryMs() {
        return refreshTokenExpiryMs;
    }

    // ── Private helpers ────────────────────────────────

    private String buildToken(Map<String, Object> claims, long expiryMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(new Date(now))
            .setExpiration(new Date(now + expiryMs))
            .signWith(signingKey, SignatureAlgorithm.HS384)
            .compact();
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(signingKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
