package com.medic.telemedicine.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemedicine_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemedicineSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Short human-readable code shared with the patient.
     * Format: TELE-YYYYMMDD-XXXXX (e.g. TELE-20260521-K3R9T)
     */
    @Column(name = "session_code", unique = true, nullable = false, length = 30)
    private String sessionCode;

    /** Optional link to an Appointment Service appointment */
    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "patient_mpi_id", nullable = false, length = 20)
    private String patientMpiId;

    @Column(name = "clinician_id", nullable = false)
    private Long clinicianId;

    @Column(name = "clinician_name", nullable = false, length = 100)
    private String clinicianName;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.CREATED;

    /** Always JITSI in Phase 1 — placeholder for future providers */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String platform = "JITSI";

    /** Jitsi room name — random UUID-based, never reused */
    @Column(name = "room_name", nullable = false, length = 200)
    private String roomName;

    /** Full Jitsi URL for the clinician (includes moderator token if JWT enabled) */
    @Column(name = "clinician_join_url", columnDefinition = "TEXT")
    private String clinicianJoinUrl;

    /** Simplified URL for the patient (no account required) */
    @Column(name = "patient_join_url", columnDefinition = "TEXT")
    private String patientJoinUrl;

    /**
     * Low-bandwidth mode — when true the frontend hints to Jitsi to:
     * - disable HD video, cap to 240p
     * - disable screen share
     * - prefer audio-only fallback
     * Appropriate for rural Cameroonian connections < 1 Mbps.
     */
    @Column(name = "low_bandwidth_mode", nullable = false)
    @Builder.Default
    private boolean lowBandwidthMode = false;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    /** Actual call duration in seconds (set when session ends) */
    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
