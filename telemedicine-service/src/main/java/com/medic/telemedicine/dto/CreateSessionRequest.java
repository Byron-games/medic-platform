package com.medic.telemedicine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record CreateSessionRequest(

    @NotBlank(message = "Patient MPI ID is required")
    String patientMpiId,

    @NotNull(message = "Clinician ID is required")
    Long clinicianId,

    @NotBlank(message = "Clinician name is required")
    String clinicianName,

    /** Optional — links session to an existing appointment */
    Long appointmentId,

    /** Scheduled start time — null means start immediately */
    LocalDateTime scheduledAt,

    /**
     * Enable low-bandwidth mode for rural / poor-connectivity areas.
     * Caps video to 240p, disables screen share, prefers audio-only fallback.
     */
    boolean lowBandwidthMode
) {}
