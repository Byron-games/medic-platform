package com.medic.emr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.emr.domain.MedicalRecord;
import com.medic.emr.domain.RecordType;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MedicalRecordResponse(
    Long                    id,
    String                  patientMpiId,
    RecordType              recordType,
    String                  facilityId,
    String                  facilityName,
    Long                    clinicianId,
    String                  clinicianName,
    LocalDateTime           visitDate,
    String                  chiefComplaint,
    String                  subjective,
    String                  objective,
    String                  assessment,
    String                  plan,
    String[]                icd10Codes,
    boolean                 networkShared,
    List<VitalSignsResponse> vitals,
    LocalDateTime           createdAt,
    LocalDateTime           updatedAt
) {
    public static MedicalRecordResponse from(MedicalRecord r) {
        List<VitalSignsResponse> vitals = r.getVitalSigns() == null ? List.of()
            : r.getVitalSigns().stream().map(VitalSignsResponse::from).toList();

        return new MedicalRecordResponse(
            r.getId(), r.getPatientMpiId(), r.getRecordType(),
            r.getFacilityId(), r.getFacilityName(),
            r.getClinicianId(), r.getClinicianName(),
            r.getVisitDate(), r.getChiefComplaint(),
            r.getSubjective(), r.getObjective(),
            r.getAssessment(), r.getPlan(),
            r.getIcd10Codes(), r.isNetworkShared(),
            vitals, r.getCreatedAt(), r.getUpdatedAt()
        );
    }
}
