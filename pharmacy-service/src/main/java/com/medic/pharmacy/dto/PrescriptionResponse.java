package com.medic.pharmacy.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.pharmacy.domain.Prescription;
import com.medic.pharmacy.domain.PrescriptionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PrescriptionResponse(
    Long                    id,
    String                  rxCode,
    String                  patientMpiId,
    Long                    clinicianId,
    String                  clinicianName,
    String                  facilityId,
    PrescriptionStatus      status,
    List<Map<String, Object>> medications,
    List<Map<String, Object>> interactionWarnings,
    boolean                 hasInteractions,
    String                  notes,
    LocalDateTime           issuedAt,
    LocalDateTime           expiresAt,
    LocalDateTime           dispensedAt,
    Long                    dispensedBy,
    boolean                 expired,
    LocalDateTime           createdAt
) {
    public static PrescriptionResponse from(Prescription p) {
        boolean hasInteractions = p.getInteractionWarnings() != null
            && !p.getInteractionWarnings().isEmpty();
        return new PrescriptionResponse(
            p.getId(), p.getRxCode(), p.getPatientMpiId(),
            p.getClinicianId(), p.getClinicianName(), p.getFacilityId(),
            p.getStatus(), p.getMedications(), p.getInteractionWarnings(),
            hasInteractions, p.getNotes(),
            p.getIssuedAt(), p.getExpiresAt(), p.getDispensedAt(),
            p.getDispensedBy(), p.isExpired(), p.getCreatedAt()
        );
    }
}
