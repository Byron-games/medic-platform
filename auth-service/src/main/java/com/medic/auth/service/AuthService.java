package com.medic.auth.service;

import com.medic.auth.domain.RefreshToken;
import com.medic.auth.domain.Role;
import com.medic.auth.domain.User;
import com.medic.auth.dto.*;
import com.medic.auth.exception.AuthException;
import com.medic.auth.repository.RefreshTokenRepository;
import com.medic.auth.repository.UserRepository;
import com.medic.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository        userRepository;
    private final RefreshTokenRepository refreshTokenRepo;
    private final JwtService            jwtService;
    private final PasswordEncoder       passwordEncoder;

    // ── Login ───────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsernameIgnoreCase(req.username())
            .orElseThrow(() -> new AuthException("Invalid username or password"));

        if (!user.isActive()) {
            throw new AuthException("Account is deactivated. Contact your administrator.");
        }

        if (user.isCurrentlyLocked()) {
            throw new AuthException(
                "Account temporarily locked due to failed attempts. Try again later.");
        }

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            user.recordFailedAttempt();
            userRepository.save(user);
            log.warn("Failed login attempt for user '{}' — attempt #{}", 
                user.getUsername(), user.getFailedAttempts());
            throw new AuthException("Invalid username or password");
        }

        // Successful login — reset lockout state
        user.resetFailedAttempts();
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    // ── Register ────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsernameIgnoreCase(req.username())) {
            throw new AuthException("Username '" + req.username() + "' is already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new AuthException("An account with this email already exists");
        }

        Role role = req.role() != null ? req.role() : Role.CLINICIAN;

        User user = User.builder()
            .username(req.username().toLowerCase())
            .email(req.email().toLowerCase())
            .password(passwordEncoder.encode(req.password()))
            .fullName(req.fullName())
            .role(role)
            .facilityId(req.facilityId())
            .facilityName(req.facilityName())
            .build();

        userRepository.save(user);
        log.info("New user registered: {} ({})", user.getUsername(), user.getRole());

        return buildAuthResponse(user);
    }

    // ── Refresh Token ────────────────────────────────────

    @Transactional
    public AuthResponse refresh(RefreshRequest req) {
        String token = req.refreshToken();

        if (!jwtService.isTokenValid(token)) {
            throw new AuthException("Invalid refresh token");
        }
        if (!"REFRESH".equals(jwtService.extractTokenType(token))) {
            throw new AuthException("Token is not a refresh token");
        }

        RefreshToken stored = refreshTokenRepo.findByToken(token)
            .orElseThrow(() -> new AuthException("Refresh token not recognised"));

        if (!stored.isValid()) {
            throw new AuthException("Refresh token has expired or been revoked");
        }

        // Rotate: revoke current, issue new pair
        stored.setRevoked(true);
        refreshTokenRepo.save(stored);

        return buildAuthResponse(stored.getUser());
    }

    // ── Logout ───────────────────────────────────────────

    @Transactional
    public void logout(String username) {
        userRepository.findByUsernameIgnoreCase(username).ifPresent(user -> {
            refreshTokenRepo.revokeAllByUser(user);
            log.info("User '{}' logged out — all refresh tokens revoked", username);
        });
    }

    // ── Change Password ──────────────────────────────────

    @Transactional
    public void changePassword(String username, ChangePasswordRequest req) {
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new AuthException("User not found"));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw new AuthException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.resetFailedAttempts();
        userRepository.save(user);

        // Revoke all refresh tokens so other sessions are terminated
        refreshTokenRepo.revokeAllByUser(user);
        log.info("Password changed for user '{}'", username);
    }

    // ── Private Helpers ──────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Persist the refresh token
        RefreshToken stored = RefreshToken.builder()
            .user(user)
            .token(refreshToken)
            .expiresAt(LocalDateTime.now().plusSeconds(
                jwtService.getRefreshTokenExpiryMs() / 1000))
            .build();
        refreshTokenRepo.save(stored);

        return new AuthResponse(
            accessToken,
            refreshToken,
            900L,   // 15 minutes in seconds
            new AuthResponse.UserPayload(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getFacilityId(),
                user.getFacilityName()
            )
        );
    }
}
