package com.medic.auth.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.medic.auth.dto.AuthResponse;
import com.medic.auth.dto.ChangePasswordRequest;
import com.medic.auth.dto.CreateAdminRequest;
import com.medic.auth.dto.FacilityResponse;
import com.medic.auth.dto.LoginRequest;
import com.medic.auth.dto.RefreshRequest;
import com.medic.auth.dto.RegisterRequest;
import com.medic.auth.dto.UpdateProfileRequest;
import com.medic.auth.dto.UserSummary;
import com.medic.auth.security.JwtService;
import com.medic.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, registration, and token management")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate a user and receive JWT tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req,
            HttpServletRequest request) {
        return ResponseEntity.ok(authService.login(req, request));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req, request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange a valid refresh token for a new token pair")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke all refresh tokens for the current user",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String username = extractUsername(request);
        if (username == null)
            return ResponseEntity.status(401).build();
        authService.logout(username);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for the authenticated user",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> changePassword(HttpServletRequest request,
            @Valid @RequestBody ChangePasswordRequest req) {
        String username = extractUsername(request);
        if (username == null)
            return ResponseEntity.status(401).build();
        authService.changePassword(username, req, request); // <-- Fixed
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get the profile of the currently authenticated user",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<AuthResponse.UserPayload> me(HttpServletRequest request) {
        String username = extractUsername(request);
        if (username == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity
                .ok(new AuthResponse.UserPayload(null, username, null, null, null, null, null));
    }

    // ────────────────────────── Approval Endpoints ──────────────────────────

    @PatchMapping("/users/{userId}/approve")
    @Operation(summary = "REGISTRAR approves a pending user — grants them their requested role")
    public ResponseEntity<Void> approveUser(@PathVariable Long userId, HttpServletRequest request) {
        String username = extractUsername(request);
        if (username == null)
            return ResponseEntity.status(401).build();
        authService.approveUser(userId, username, request); // <-- Fixed
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{userId}/reject")
    @Operation(summary = "REGISTRAR rejects a pending user")
    public ResponseEntity<Void> rejectUser(@PathVariable Long userId,
            @RequestBody(required = false) String reason) {
        authService.rejectUser(userId, reason);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/facilities")
    @Operation(
            summary = "List all M.E.D.I.C. registered facilities (public — used on registration page)")
    public ResponseEntity<List<FacilityResponse>> getFacilities() {
        return ResponseEntity.ok(authService.getFacilities());
    }

    @GetMapping("/users/pending")
    @Operation(summary = "Get all pending registrations for the REGISTRAR's facility")
    public ResponseEntity<List<UserSummary>> getPendingUsers(HttpServletRequest request) {
        String username = extractUsername(request);
        if (username == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authService.getPendingUsers(username));
    }

    // ────────────────────────── Admin Management ────────────────────────────

    @PostMapping("/admin/create")
    @Operation(summary = "Super-admin creates a facility admin account")
    public ResponseEntity<UserSummary> createAdmin(@Valid @RequestBody CreateAdminRequest req,
            HttpServletRequest request) {
        String callerUsername = extractUsername(request);
        if (callerUsername == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.status(201).body(authService.createAdmin(callerUsername, req));
    }

    @DeleteMapping("/admin/{username}")
    @Operation(summary = "Super-admin suspends or deletes a facility admin")
    public ResponseEntity<Void> deleteAdmin(@PathVariable String username,
            @RequestParam(defaultValue = "SUSPEND") String mode, HttpServletRequest request) {
        String callerUsername = extractUsername(request);
        if (callerUsername == null)
            return ResponseEntity.status(401).build();
        authService.removeAdmin(callerUsername, username, mode);
        return ResponseEntity.noContent().build();
    }

    // ────────────────────────── Profile Management ──────────────────────────

    @PatchMapping("/profile")
    @Operation(summary = "Update the authenticated user's profile")
    public ResponseEntity<UserSummary> updateProfile(@Valid @RequestBody UpdateProfileRequest req,
            HttpServletRequest request) {
        String username = extractUsername(request);
        if (username == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authService.updateProfile(username, req));
    }

    @PatchMapping("/profile/password")
    @Operation(summary = "Change password for the authenticated user")
    public ResponseEntity<Void> changeProfilePassword(@Valid @RequestBody ChangePasswordRequest req,
            HttpServletRequest request) {
        String username = extractUsername(request);
        if (username == null)
            return ResponseEntity.status(401).build();
        authService.changePassword(username, req, request); // <-- Fixed
        return ResponseEntity.noContent().build();
    }

    // ── Helper to extract username from request ────────────────────────────
    private String extractUsername(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username != null)
            return username;

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtService.extractUsername(token);
        }
        return null;
    }
}
