package com.medic.emr.service;

import java.time.LocalDate;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * Fire-and-forget client — notifies analytics service when a diagnosis with an ICD-10 code is
 * recorded in the EMR. Failures are swallowed so they never break the clinical workflow.
 */
@Slf4j
@Component
public class AnalyticsNotifier {

    @Value("${services.analytics-url:http://analytics-service:8086}")
    private String analyticsUrl;

    private final RestTemplate rest = new RestTemplate();

    public void notifyDiagnosis(String icd10Code, String diseaseName, String region,
            String facilityId) {
        if (icd10Code == null || icd10Code.isBlank())
            return;
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of("icd10Code", icd10Code.toUpperCase(), "diseaseName",
                    diseaseName != null ? diseaseName : "Unspecified", "region",
                    region != null ? region : "Unknown", "facilityId",
                    facilityId != null ? facilityId : "UNKNOWN", "reportDate",
                    LocalDate.now().toString(), "caseCount", 1);
            rest.postForEntity(analyticsUrl + "/api/v1/analytics/cases", new HttpEntity<>(body, h),
                    String.class);
            log.debug("Analytics notified: {} - {}", icd10Code, diseaseName);
        } catch (Exception e) {
            log.warn("Analytics notification failed (non-critical): {}", e.getMessage());
        }
    }
}
