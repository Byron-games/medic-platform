package com.medic.auth.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.medic.auth.domain.AccountStatus;
import com.medic.auth.domain.Facility;
import com.medic.auth.domain.RefreshToken;
import com.medic.auth.domain.Role;
import com.medic.auth.domain.User;
import com.medic.auth.dto.AuthResponse;
import com.medic.auth.dto.ChangePasswordRequest;
import com.medic.auth.dto.CreateAdminRequest;
import com.medic.auth.dto.FacilityResponse;
import com.medic.auth.dto.LoginRequest;
import com.medic.auth.dto.RefreshRequest;
import com.medic.auth.dto.RegisterRequest;
import com.medic.auth.dto.UpdateProfileRequest;
import com.medic.auth.dto.UserSummary;
import com.medic.auth.exception.AuthException;
import com.medic.auth.repository.FacilityRepository;
import com.medic.auth.repository.RefreshTokenRepository;
import com.medic.auth.repository.UserRepository;
import com.medic.auth.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final StaffIdGenerator staffIdGenerator;
    private final FacilityRepository facilityRepository;
    private final AuditService auditService;

    // ── Login ───────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest req, HttpServletRequest request) {
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
            auditService.log("LOGIN_FAILED", req.username(), null, false, "Invalid credentials",
                    request);
            log.warn("Failed login attempt for user '{}' — attempt #{}", user.getUsername(),
                    user.getFailedAttempts());
            throw new AuthException("Invalid username or password");
        }

        user.resetFailedAttempts();
        userRepository.save(user);

        auditService.log("LOGIN", user.getUsername(), user.getId(), true,
                "Login from " + user.getFacilityId(), request);

        return buildAuthResponse(user);
    }

    // ── Register ────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest req, HttpServletRequest request) {
        if (userRepository.existsByUsernameIgnoreCase(req.username())) {
            throw new AuthException("Username '" + req.username() + "' is already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new AuthException("An account with this email already exists");
        }

        Role requestedRole = req.role() != null ? req.role() : Role.PENDING;
        Role effectiveRole = Role.PENDING;
        AccountStatus accountStatus =
                (requestedRole == Role.ADMIN) ? AccountStatus.ACTIVE : AccountStatus.PENDING;

        String generatedStaffId = staffIdGenerator.generate(req.facilityId(),
                req.role() != null ? req.role() : Role.PENDING);

        User user = User.builder().username(req.username().toLowerCase())
                .email(req.email().toLowerCase()).password(passwordEncoder.encode(req.password()))
                .fullName(req.fullName()).staffId(generatedStaffId).role(effectiveRole)
                .requestedRole(requestedRole).facilityId(req.facilityId())
                .facilityName(req.facilityName()).accountStatus(accountStatus).build();

        userRepository.save(user);

        auditService.log("REGISTER", user.getUsername(), user.getId(), true,
                "Role: " + requestedRole + " | Facility: " + user.getFacilityId(), request);

        log.info("New user registered: {} (effective role: {}, requested: {}, staffId: {})",
                user.getUsername(), user.getRole(), user.getRequestedRole(), generatedStaffId);

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
    public void changePassword(String username, ChangePasswordRequest req,
            HttpServletRequest request) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("User not found"));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw new AuthException("Current password is incorrect");
        }
        if (req.newPassword().length() < 8) {
            throw new AuthException("New password must be at least 8 characters");
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.resetFailedAttempts();
        userRepository.save(user);

        refreshTokenRepo.revokeAllByUser(user);

        auditService.log("PASSWORD_CHANGE", username, user.getId(), true, null, request);

        log.info("Password changed for user '{}'", username);
    }

    // ── Approval Methods (Registrar/Admin) ───────────────

    @Transactional
    public void approveUser(Long userId, String registrarUsername, HttpServletRequest request) {
        User registrar = userRepository.findByUsernameIgnoreCase(registrarUsername)
                .orElseThrow(() -> new AuthException("Registrar not found"));

        if (registrar.getRole() != Role.REGISTRAR && registrar.getRole() != Role.ADMIN) {
            throw new AuthException("Only a REGISTRAR or ADMIN can approve users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));

        Role grantedRole = user.getRequestedRole() != null ? user.getRequestedRole() : Role.NURSE;

        user.setRole(grantedRole);
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        auditService.log("USER_APPROVED", user.getUsername(), user.getId(), true,
                "Approved by: " + registrarUsername, request);

        log.info("User {} approved by {} — granted role {}", user.getUsername(), registrarUsername,
                grantedRole);
    }

    @Transactional
    public void rejectUser(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));
        user.setAccountStatus(AccountStatus.SUSPENDED);
        userRepository.save(user);
        log.info("User {} registration rejected. Reason: {}", user.getUsername(), reason);
    }

    @Transactional(readOnly = true)
    public List<UserSummary> getPendingUsers(String registrarUsername) {
        User registrar = userRepository.findByUsernameIgnoreCase(registrarUsername)
                .orElseThrow(() -> new AuthException("Registrar not found"));

        return userRepository
                .findByFacilityIdAndAccountStatus(registrar.getFacilityId(), AccountStatus.PENDING)
                .stream().map(UserSummary::from).toList();
    }

    // ── Facility Methods (with caching) ─────────────────────

    @Cacheable("facilities")
    @Transactional(readOnly = true)
    public List<FacilityResponse> getFacilities() {
        return facilityRepository.findByActiveTrueOrderByRegionAscNameAsc().stream()
                .map(FacilityResponse::from).toList();
    }

    @CacheEvict(value = "facilities", allEntries = true)
    @Transactional
    public Facility addFacility(Facility facility) {
        Facility saved = facilityRepository.save(facility);
        log.info("New facility added: {}", saved.getName());
        return saved;
    }

    @CacheEvict(value = "facilities", allEntries = true)
    @Transactional
    public void updateFacility(Facility facility) {
        facilityRepository.save(facility);
        log.info("Facility updated: {}", facility.getName());
    }

    @CacheEvict(value = "facilities", allEntries = true)
    @Transactional
    public void deleteFacility(String facilityId) {
        // Use the business (string) ID to find the facility first,
        // then delete by its primary key (Long)
        Facility facility = facilityRepository.findByFacilityId(facilityId)
                .orElseThrow(() -> new AuthException("Facility not found: " + facilityId));
        facilityRepository.delete(facility);
        log.info("Facility deleted: {}", facilityId);
    }

    // ── Admin Management ─────────────────────────────────

    @Transactional
    public UserSummary createAdmin(String callerUsername, CreateAdminRequest req) {
        if (userRepository.existsByUsernameIgnoreCase(req.username())) {
            throw new AuthException("Username already exists: " + req.username());
        }
        String staffId = staffIdGenerator.generate(req.facilityId(), Role.ADMIN);
        User admin = User.builder().username(req.username().toLowerCase())
                .email(req.email().toLowerCase()).password(passwordEncoder.encode(req.password()))
                .fullName(req.fullName()).role(Role.ADMIN).requestedRole(Role.ADMIN)
                .accountStatus(AccountStatus.ACTIVE).facilityId(req.facilityId())
                .facilityName(req.facilityName()).staffId(staffId).build();
        User saved = userRepository.save(admin);
        log.info("Super-admin {} created new admin: {}", callerUsername, saved.getUsername());
        return UserSummary.from(saved);
    }

    @Transactional
    public void removeAdmin(String callerUsername, String targetUsername, String mode) {
        User target = userRepository.findByUsernameIgnoreCase(targetUsername)
                .orElseThrow(() -> new AuthException("User not found: " + targetUsername));
        if (target.getRole() != Role.ADMIN) {
            throw new AuthException("Target user is not an administrator");
        }
        if ("DELETE".equalsIgnoreCase(mode)) {
            userRepository.delete(target);
            log.warn("Super-admin {} DELETED admin account: {}", callerUsername, targetUsername);
        } else {
            target.setAccountStatus(AccountStatus.SUSPENDED);
            userRepository.save(target);
            log.info("Super-admin {} SUSPENDED admin account: {}", callerUsername, targetUsername);
        }
    }

    // ── Profile Management ───────────────────────────────

    @Transactional
    public UserSummary updateProfile(String username, UpdateProfileRequest req) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("User not found"));
        if (req.fullName() != null)
            user.setFullName(req.fullName());
        if (req.email() != null)
            user.setEmail(req.email().toLowerCase());
        // phoneNumber field must exist in User entity – add if needed
        // if (req.phoneNumber() != null) user.setPhoneNumber(req.phoneNumber());
        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", username);
        return UserSummary.from(saved);
    }

    // ── Private Helpers ──────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        RefreshToken stored = RefreshToken.builder().user(user).token(refreshToken).expiresAt(
                LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpiryMs() / 1000))
                .build();
        refreshTokenRepo.save(stored);

        return new AuthResponse(accessToken, refreshToken, 900L,
                new AuthResponse.UserPayload(user.getId(), user.getUsername(), user.getFullName(),
                        user.getEmail(), user.getRole().name(), user.getFacilityId(),
                        user.getFacilityName()));
    }
}
