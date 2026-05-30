package com.medic.analytics.dto;

import com.medic.analytics.domain.OutbreakAlert;
import java.time.LocalDateTime;

public record AlertSummary(
    Long id, String icd10Code, String diseaseName, String region,
    int caseCount, int threshold, String alertLevel,
    boolean active, LocalDateTime triggeredAt
) {
    public static AlertSummary from(OutbreakAlert a) {
        return new AlertSummary(a.getId(), a.getIcd10Code(), a.getDiseaseName(),
            a.getRegion(), a.getCaseCount(), a.getThreshold(), a.getAlertLevel(),
            a.isActive(), a.getTriggeredAt());
    }
}
