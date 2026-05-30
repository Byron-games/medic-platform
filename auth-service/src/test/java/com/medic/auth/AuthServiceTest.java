package com.medic.auth;

import com.medic.auth.domain.Role;
import com.medic.auth.domain.User;
import com.medic.auth.dto.LoginRequest;
import com.medic.auth.dto.RegisterRequest;
import com.medic.auth.exception.AuthException;
import com.medic.auth.repository.RefreshTokenRepository;
import com.medic.auth.repository.UserRepository;
import com.medic.auth.security.JwtService;
import com.medic.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository       userRepository;
    @Mock RefreshTokenRepository refreshTokenRepo;
    @Mock JwtService           jwtService;
    @Mock PasswordEncoder      passwordEncoder;

    @InjectMocks AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .username("testclinician")
            .email("test@medic.health")
            .password("$2a$12$hashedpassword")
            .fullName("Dr. Test User")
            .role(Role.CLINICIAN)
            .facilityId("FAC-001")
            .facilityName("Yaoundé General Hospital")
            .build();
    }

    @Test
    void login_withValidCredentials_shouldReturnTokens() {
        when(userRepository.findByUsernameIgnoreCase("testclinician"))
            .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", testUser.getPassword()))
            .thenReturn(true);
        when(jwtService.generateAccessToken(testUser)).thenReturn("access.token.here");
        when(jwtService.generateRefreshToken(testUser)).thenReturn("refresh.token.here");
        when(jwtService.getRefreshTokenExpiryMs()).thenReturn(604800000L);
        when(refreshTokenRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        var response = authService.login(new LoginRequest("testclinician", "password123"));

        assertThat(response.accessToken()).isEqualTo("access.token.here");
        assertThat(response.user().username()).isEqualTo("testclinician");
        assertThat(response.user().role()).isEqualTo("CLINICIAN");
    }

    @Test
    void login_withWrongPassword_shouldThrowAuthException() {
        when(userRepository.findByUsernameIgnoreCase("testclinician"))
            .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(testUser);

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("testclinician", "wrongpassword")))
            .isInstanceOf(AuthException.class)
            .hasMessageContaining("Invalid username or password");
    }

    @Test
    void login_withUnknownUser_shouldThrowAuthException() {
        when(userRepository.findByUsernameIgnoreCase("nobody"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("nobody", "anything")))
            .isInstanceOf(AuthException.class);
    }

    @Test
    void register_withDuplicateUsername_shouldThrowAuthException() {
        when(userRepository.existsByUsernameIgnoreCase("taken")).thenReturn(true);

        var req = new RegisterRequest("taken", "new@email.com",
            "password123", "New User", Role.CLINICIAN, "FAC-001", "Test Hospital");

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(AuthException.class)
            .hasMessageContaining("already taken");
    }

    @Test
    void login_withLockedAccount_shouldThrowAuthException() {
        testUser.recordFailedAttempt();
        testUser.recordFailedAttempt();
        testUser.recordFailedAttempt();
        testUser.recordFailedAttempt();
        testUser.recordFailedAttempt(); // 5th attempt — locks the account

        when(userRepository.findByUsernameIgnoreCase("testclinician"))
            .thenReturn(Optional.of(testUser));

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("testclinician", "anything")))
            .isInstanceOf(AuthException.class)
            .hasMessageContaining("locked");
    }
}
