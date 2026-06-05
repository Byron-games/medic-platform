package com.medic.emr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.emr.domain.MedicalRecord;
import com.medic.emr.domain.RecordType;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RecordSummary(
    Long          id,
    String        patientMpiId,
    RecordType    recordType,
    String        facilityId,
    String        facilityName,
    String        clinicianName,
    LocalDateTime visitDate,
    String        chiefComplaint,
    String[]      icd10Codes,
    boolean       networkShared
) {
    public static RecordSummary from(MedicalRecord r) {
        return new RecordSummary(
            r.getId(), r.getPatientMpiId(), r.getRecordType(),
            r.getFacilityId(), r.getFacilityName(), r.getClinicianName(),
            r.getVisitDate(), r.getChiefComplaint(),
            r.getIcd10Codes(), r.isNetworkShared()
        );
    }
}
