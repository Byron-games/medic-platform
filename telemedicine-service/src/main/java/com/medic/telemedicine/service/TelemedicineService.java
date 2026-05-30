package com.medic.telemedicine.service;

import com.medic.telemedicine.domain.SessionStatus;
import com.medic.telemedicine.domain.TelemedicineSession;
import com.medic.telemedicine.dto.CreateSessionRequest;
import com.medic.telemedicine.dto.SessionResponse;
import com.medic.telemedicine.exception.SessionNotFoundException;
import com.medic.telemedicine.repository.TelemedicineSessionRepository;
import com.medic.telemedicine.security.RequestContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelemedicineService {

    private final TelemedicineSessionRepository repo;
    private final SessionCodeGenerator          codeGenerator;
    private final JitsiUrlBuilder               jitsiUrlBuilder;
    private final RequestContext                ctx;

    // ── Create session ───────────────────────────────────

    @Transactional
    public SessionResponse create(CreateSessionRequest req) {
        // Generate unique session code (retry on collision)
        String sessionCode = generateUniqueCode();

        // Room name is UUID-based — guaranteed unique, not guessable
        String roomName = "medic-" + UUID.randomUUID().toString().replace("-", "");

        String facilityId = ctx.getFacilityId() != null ? ctx.getFacilityId() : "UNKNOWN";

        // Build join URLs
        String clinicianUrl = jitsiUrlBuilder.clinicianUrl(
            roomName, req.clinicianName(), req.lowBandwidthMode());
        String patientUrl = jitsiUrlBuilder.patientUrl(
            roomName, sessionCode, req.lowBandwidthMode());

        TelemedicineSession session = TelemedicineSession.builder()
            .sessionCode(sessionCode)
            .appointmentId(req.appointmentId())
            .patientMpiId(req.patientMpiId())
            .clinicianId(req.clinicianId())
            .clinicianName(req.clinicianName())
            .facilityId(facilityId)
            .status(SessionStatus.CREATED)
            .platform("JITSI")
            .roomName(roomName)
            .clinicianJoinUrl(clinicianUrl)
            .patientJoinUrl(patientUrl)
            .lowBandwidthMode(req.lowBandwidthMode())
            .scheduledAt(req.scheduledAt())
            .build();

        repo.save(session);

        log.info("Telemedicine session created: code={} patient={} clinician={} lowBw={}",
            sessionCode, req.patientMpiId(), req.clinicianName(), req.lowBandwidthMode());

        return SessionResponse.from(session);
    }

    // ── Get by ID ────────────────────────────────────────

    @Transactional(readOnly = true)
    public SessionResponse getById(Long id) {
        return SessionResponse.from(findOrThrow(id));
    }

    // ── Get by session code ──────────────────────────────

    @Transactional(readOnly = true)
    public SessionResponse getByCode(String code) {
        TelemedicineSession session = repo.findBySessionCode(code)
            .orElseThrow(() -> new SessionNotFoundException(
                "Session not found for code: " + code));
        return SessionResponse.from(session);
    }

    // ── Patient join redirect ────────────────────────────

    /**
     * Called when patient clicks the SMS link.
     * Marks session as WAITING (if still CREATED) and returns the Jitsi URL.
     */
    @Transactional
    public String patientJoin(String code) {
        TelemedicineSession session = repo.findBySessionCode(code)
            .orElseThrow(() -> new SessionNotFoundException(
                "Session code not found: " + code));

        if (session.getStatus() == SessionStatus.CREATED) {
            session.setStatus(SessionStatus.WAITING);
            repo.save(session);
            log.info("Patient joined session: code={}", code);
        }

        return session.getPatientJoinUrl();
    }

    // ── Start (clinician enters room) ────────────────────

    @Transactional
    public SessionResponse start(Long id) {
        TelemedicineSession session = findOrThrow(id);

        if (session.getStatus() == SessionStatus.CANCELLED ||
            session.getStatus() == SessionStatus.ENDED) {
            throw new IllegalStateException(
                "Cannot start a session with status: " + session.getStatus());
        }

        session.setStatus(SessionStatus.ACTIVE);
        session.setStartedAt(LocalDateTime.now());
        repo.save(session);

        log.info("Session started: id={} code={}", id, session.getSessionCode());
        return SessionResponse.from(session);
    }

    // ── End session ──────────────────────────────────────

    @Transactional
    public SessionResponse end(Long id) {
        TelemedicineSession session = findOrThrow(id);

        if (session.getStatus() == SessionStatus.ENDED ||
            session.getStatus() == SessionStatus.CANCELLED) {
            throw new IllegalStateException(
                "Session is already " + session.getStatus());
        }

        LocalDateTime endTime = LocalDateTime.now();
        session.setStatus(SessionStatus.ENDED);
        session.setEndedAt(endTime);

        // Calculate duration if we have a start time
        if (session.getStartedAt() != null) {
            long seconds = java.time.Duration.between(
                session.getStartedAt(), endTime).getSeconds();
            session.setDurationSeconds((int) seconds);
        }

        repo.save(session);
        log.info("Session ended: id={} duration={}s",
            id, session.getDurationSeconds());

        return SessionResponse.from(session);
    }

    // ── Cancel ───────────────────────────────────────────

    @Transactional
    public SessionResponse cancel(Long id) {
        TelemedicineSession session = findOrThrow(id);

        if (session.getStatus() == SessionStatus.ENDED ||
            session.getStatus() == SessionStatus.ACTIVE) {
            throw new IllegalStateException(
                "Cannot cancel a session with status: " + session.getStatus());
        }

        session.setStatus(SessionStatus.CANCELLED);
        repo.save(session);
        log.info("Session cancelled: id={} by={}", id, ctx.getUsername());

        return SessionResponse.from(session);
    }

    // ── Toggle low bandwidth mode ────────────────────────

    @Transactional
    public SessionResponse toggleLowBandwidth(Long id) {
        TelemedicineSession session = findOrThrow(id);

        boolean newMode = !session.isLowBandwidthMode();
        session.setLowBandwidthMode(newMode);

        // Regenerate URLs with the new bandwidth setting
        session.setClinicianJoinUrl(jitsiUrlBuilder.clinicianUrl(
            session.getRoomName(), session.getClinicianName(), newMode));
        session.setPatientJoinUrl(jitsiUrlBuilder.patientUrl(
            session.getRoomName(), session.getSessionCode(), newMode));

        repo.save(session);
        log.info("Session {} low-bandwidth mode: {} → {}",
            id, !newMode, newMode);

        return SessionResponse.from(session);
    }

    // ── List for patient ─────────────────────────────────

    @Transactional(readOnly = true)
    public Page<SessionResponse> listForPatient(String mpiId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repo.findByPatientMpiIdOrderByCreatedAtDesc(mpiId, pageable)
            .map(SessionResponse::from);
    }

    // ── List for clinician ───────────────────────────────

    @Transactional(readOnly = true)
    public Page<SessionResponse> listForClinician(Long clinicianId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repo.findByClinicianIdOrderByCreatedAtDesc(clinicianId, pageable)
            .map(SessionResponse::from);
    }

    // ── Active sessions ──────────────────────────────────

    @Transactional(readOnly = true)
    public List<SessionResponse> getActiveSessions() {
        return repo.findByStatuses(List.of(
            SessionStatus.CREATED, SessionStatus.WAITING, SessionStatus.ACTIVE))
            .stream().map(SessionResponse::from).toList();
    }

    // ── Private helpers ──────────────────────────────────

    private TelemedicineSession findOrThrow(Long id) {
        return repo.findById(id)
            .orElseThrow(() -> new SessionNotFoundException("Session not found: " + id));
    }

    private String generateUniqueCode() {
        for (int i = 0; i < 5; i++) {
            String code = codeGenerator.generate();
            if (!repo.existsBySessionCode(code)) return code;
        }
        throw new IllegalStateException("Failed to generate unique session code");
    }
}
