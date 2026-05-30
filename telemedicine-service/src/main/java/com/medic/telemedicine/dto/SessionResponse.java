package com.medic.telemedicine.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.telemedicine.domain.SessionStatus;
import com.medic.telemedicine.domain.TelemedicineSession;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SessionResponse(
    Long          id,
    String        sessionCode,
    Long          appointmentId,
    String        patientMpiId,
    Long          clinicianId,
    String        clinicianName,
    String        facilityId,
    SessionStatus status,
    String        platform,
    String        roomName,
    String        clinicianJoinUrl,
    String        patientJoinUrl,
    boolean       lowBandwidthMode,
    LocalDateTime scheduledAt,
    LocalDateTime startedAt,
    LocalDateTime endedAt,
    Integer       durationSeconds,
    LocalDateTime createdAt
) {
    public static SessionResponse from(TelemedicineSession s) {
        return new SessionResponse(
            s.getId(), s.getSessionCode(), s.getAppointmentId(),
            s.getPatientMpiId(), s.getClinicianId(), s.getClinicianName(),
            s.getFacilityId(), s.getStatus(), s.getPlatform(), s.getRoomName(),
            s.getClinicianJoinUrl(), s.getPatientJoinUrl(), s.isLowBandwidthMode(),
            s.getScheduledAt(), s.getStartedAt(), s.getEndedAt(),
            s.getDurationSeconds(), s.getCreatedAt()
        );
    }
}
