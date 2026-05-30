package com.medic.telemedicine;

import com.medic.telemedicine.domain.SessionStatus;
import com.medic.telemedicine.domain.TelemedicineSession;
import com.medic.telemedicine.dto.CreateSessionRequest;
import com.medic.telemedicine.dto.SessionResponse;
import com.medic.telemedicine.exception.SessionNotFoundException;
import com.medic.telemedicine.repository.TelemedicineSessionRepository;
import com.medic.telemedicine.security.RequestContext;
import com.medic.telemedicine.service.JitsiUrlBuilder;
import com.medic.telemedicine.service.SessionCodeGenerator;
import com.medic.telemedicine.service.TelemedicineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TelemedicineServiceTest {

    @Mock TelemedicineSessionRepository repo;
    @Mock SessionCodeGenerator          codeGenerator;
    @Mock JitsiUrlBuilder               jitsiUrlBuilder;
    @Mock RequestContext                ctx;

    @InjectMocks TelemedicineService service;

    private TelemedicineSession existingSession;

    @BeforeEach
    void setUp() {
        existingSession = TelemedicineSession.builder()
            .id(1L)
            .sessionCode("TELE-20260521-ABCDE")
            .patientMpiId("MPI-20260520-ABCDE")
            .clinicianId(42L)
            .clinicianName("Dr. Smith")
            .facilityId("FAC-001")
            .status(SessionStatus.CREATED)
            .platform("JITSI")
            .roomName("medic-abc123")
            .clinicianJoinUrl("https://meet.jit.si/medic-abc123")
            .patientJoinUrl("https://meet.jit.si/medic-abc123#patient")
            .lowBandwidthMode(false)
            .build();
    }

    @Test
    void create_shouldGenerateSessionWithJitsiUrls() {
        when(codeGenerator.generate()).thenReturn("TELE-20260521-ABCDE");
        when(repo.existsBySessionCode("TELE-20260521-ABCDE")).thenReturn(false);
        when(ctx.getFacilityId()).thenReturn("FAC-001");
        when(jitsiUrlBuilder.clinicianUrl(anyString(), anyString(), anyBoolean()))
            .thenReturn("https://meet.jit.si/medic-room");
        when(jitsiUrlBuilder.patientUrl(anyString(), anyString(), anyBoolean()))
            .thenReturn("https://meet.jit.si/medic-room#patient");
        when(repo.save(any())).thenAnswer(i -> {
            TelemedicineSession s = i.getArgument(0);
            return TelemedicineSession.builder()
                .id(1L).sessionCode(s.getSessionCode())
                .patientMpiId(s.getPatientMpiId()).clinicianId(s.getClinicianId())
                .clinicianName(s.getClinicianName()).facilityId(s.getFacilityId())
                .status(s.getStatus()).platform(s.getPlatform())
                .roomName(s.getRoomName()).clinicianJoinUrl(s.getClinicianJoinUrl())
                .patientJoinUrl(s.getPatientJoinUrl())
                .lowBandwidthMode(s.isLowBandwidthMode()).build();
        });

        CreateSessionRequest req = new CreateSessionRequest(
            "MPI-20260520-ABCDE", 42L, "Dr. Smith", null, null, false);

        SessionResponse response = service.create(req);

        assertThat(response.sessionCode()).isEqualTo("TELE-20260521-ABCDE");
        assertThat(response.clinicianJoinUrl()).contains("meet.jit.si");
        assertThat(response.patientJoinUrl()).contains("meet.jit.si");
        assertThat(response.status()).isEqualTo(SessionStatus.CREATED);
        assertThat(response.platform()).isEqualTo("JITSI");
    }

    @Test
    void create_lowBandwidthMode_shouldPassFlagToUrlBuilder() {
        when(codeGenerator.generate()).thenReturn("TELE-20260521-LOWBW");
        when(repo.existsBySessionCode(any())).thenReturn(false);
        when(ctx.getFacilityId()).thenReturn("FAC-002");
        when(jitsiUrlBuilder.clinicianUrl(anyString(), anyString(), eq(true)))
            .thenReturn("https://meet.jit.si/room?lowbw=true");
        when(jitsiUrlBuilder.patientUrl(anyString(), anyString(), eq(true)))
            .thenReturn("https://meet.jit.si/room?lowbw=true#patient");
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        CreateSessionRequest req = new CreateSessionRequest(
            "MPI-20260520-RURAL", 10L, "Dr. Rural", null, null, true);

        SessionResponse response = service.create(req);
        assertThat(response.lowBandwidthMode()).isTrue();

        verify(jitsiUrlBuilder).clinicianUrl(anyString(), eq("Dr. Rural"), eq(true));
        verify(jitsiUrlBuilder).patientUrl(anyString(), anyString(), eq(true));
    }

    @Test
    void start_createdSession_shouldSetActive() {
        when(repo.findById(1L)).thenReturn(Optional.of(existingSession));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        SessionResponse response = service.start(1L);
        assertThat(response.status()).isEqualTo(SessionStatus.ACTIVE);
        assertThat(response.startedAt()).isNotNull();
    }

    @Test
    void end_activeSession_shouldCalculateDuration() {
        existingSession.setStatus(SessionStatus.ACTIVE);
        existingSession.setStartedAt(java.time.LocalDateTime.now().minusMinutes(15));
        when(repo.findById(1L)).thenReturn(Optional.of(existingSession));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        SessionResponse response = service.end(1L);

        assertThat(response.status()).isEqualTo(SessionStatus.ENDED);
        assertThat(response.durationSeconds()).isGreaterThan(800); // ~15 min = 900s
        assertThat(response.endedAt()).isNotNull();
    }

    @Test
    void end_alreadyEnded_shouldThrowIllegalState() {
        existingSession.setStatus(SessionStatus.ENDED);
        when(repo.findById(1L)).thenReturn(Optional.of(existingSession));

        assertThatThrownBy(() -> service.end(1L))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("already");
    }

    @Test
    void getByCode_notFound_shouldThrowSessionNotFound() {
        when(repo.findBySessionCode("INVALID")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getByCode("INVALID"))
            .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void patientJoin_createdSession_shouldSetWaiting() {
        when(repo.findBySessionCode("TELE-20260521-ABCDE"))
            .thenReturn(Optional.of(existingSession));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        String url = service.patientJoin("TELE-20260521-ABCDE");

        assertThat(existingSession.getStatus()).isEqualTo(SessionStatus.WAITING);
        assertThat(url).isEqualTo(existingSession.getPatientJoinUrl());
    }

    @Test
    void sessionCodeGenerator_shouldMatchFormat() {
        SessionCodeGenerator gen = new SessionCodeGenerator();
        String code = gen.generate();
        assertThat(code).matches("TELE-\\d{8}-[A-Z2-9]{5}");
        assertThat(code).hasSize(19);
    }
}
