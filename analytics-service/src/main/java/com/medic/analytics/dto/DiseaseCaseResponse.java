package com.medic.analytics.dto;

import com.medic.analytics.domain.DiseaseCase;
import java.time.LocalDate;

public record DiseaseCaseResponse(
    Long id, LocalDate reportDate, String region, String facilityId,
    String icd10Code, String diseaseName, int caseCount, String severity
) {
    public static DiseaseCaseResponse from(DiseaseCase d) {
        return new DiseaseCaseResponse(d.getId(), d.getReportDate(), d.getRegion(),
            d.getFacilityId(), d.getIcd10Code(), d.getDiseaseName(), d.getCaseCount(), d.getSeverity());
    }
}
