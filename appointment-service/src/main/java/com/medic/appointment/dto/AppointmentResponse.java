package com.medic.appointment.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.appointment.domain.Appointment;
import com.medic.appointment.domain.AppointmentStatus;
import com.medic.appointment.domain.AppointmentType;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AppointmentResponse(
    Long              id,
    String            patientMpiId,
    Long              clinicianId,
    String            clinicianName,
    String            facilityId,
    String            facilityName,
    AppointmentType   appointmentType,
    AppointmentStatus status,
    LocalDateTime     scheduledAt,
    LocalDateTime     endTime,
    int               durationMinutes,
    String            reason,
    String            notes,
    String            cancellationReason,
    Long              rescheduledToId,
    LocalDateTime     createdAt,
    LocalDateTime     updatedAt
) {
    public static AppointmentResponse from(Appointment a) {
        return new AppointmentResponse(
            a.getId(), a.getPatientMpiId(),
            a.getClinicianId(), a.getClinicianName(),
            a.getFacilityId(), a.getFacilityName(),
            a.getAppointmentType(), a.getStatus(),
            a.getScheduledAt(), a.getEndTime(),
            a.getDurationMinutes(), a.getReason(), a.getNotes(),
            a.getCancellationReason(), a.getRescheduledToId(),
            a.getCreatedAt(), a.getUpdatedAt()
        );
    }
}
