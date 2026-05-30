package com.medic.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReportCaseRequest(
    @NotBlank String region,
    @NotBlank String facilityId,
    @NotBlank String icd10Code,
    @NotBlank String diseaseName,
    @NotNull  LocalDate reportDate,
    int    caseCount,
    String severity
) {}
