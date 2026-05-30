package com.medic.appointment.dto;

import com.medic.appointment.domain.AppointmentType;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public record BookAppointmentRequest(

    @NotBlank(message = "Patient MPI ID is required")
    String patientMpiId,

    @NotNull(message = "Clinician ID is required")
    Long clinicianId,

    @NotBlank(message = "Clinician name is required")
    String clinicianName,

    AppointmentType appointmentType,

    @NotNull(message = "Scheduled time is required")
    @Future(message = "Appointment must be scheduled in the future")
    LocalDateTime scheduledAt,

    @Min(value = 10,  message = "Duration must be at least 10 minutes")
    @Max(value = 480, message = "Duration cannot exceed 8 hours")
    int durationMinutes,

    @NotBlank(message = "Reason for appointment is required")
    String reason,

    String notes
) {}
