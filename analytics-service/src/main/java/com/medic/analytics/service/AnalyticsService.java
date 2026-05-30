package com.medic.analytics.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.medic.analytics.domain.DiseaseCase;
import com.medic.analytics.domain.OutbreakAlert;
import com.medic.analytics.dto.AlertSummary;
import com.medic.analytics.dto.DashboardSummary;
import com.medic.analytics.dto.DiseaseCaseResponse;
import com.medic.analytics.dto.DiseaseCount;
import com.medic.analytics.dto.RegionCount;
import com.medic.analytics.dto.ReportCaseRequest;
import com.medic.analytics.repository.DiseaseCaseRepository;
import com.medic.analytics.repository.OutbreakAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final DiseaseCaseRepository caseRepo;
    private final OutbreakAlertRepository alertRepo;

    // ── Report a disease case ────────────────────────────

    @CacheEvict(value = "analytics-dashboard", key = "'global'")
    @Transactional
    public DiseaseCaseResponse reportCase(ReportCaseRequest req) {
        DiseaseCase dc = DiseaseCase.builder()
                .reportDate(req.reportDate() != null ? req.reportDate() : LocalDate.now())
                .region(req.region()).facilityId(req.facilityId())
                .icd10Code(req.icd10Code().toUpperCase()).diseaseName(req.diseaseName())
                .caseCount(req.caseCount() > 0 ? req.caseCount() : 1).severity(req.severity())
                .build();

        caseRepo.save(dc);

        // Check if this triggers an outbreak alert (threshold: 5 cases in same region/disease)
        checkOutbreakThreshold(dc.getIcd10Code(), dc.getDiseaseName(), dc.getRegion());

        log.info("Disease case reported: {} ({}) in {} - {} cases", dc.getDiseaseName(),
                dc.getIcd10Code(), dc.getRegion(), dc.getCaseCount());

        return DiseaseCaseResponse.from(dc);
    }

    // ── Dashboard summary ────────────────────────────────

    @Cacheable(value = "analytics-dashboard", key = "'global'")
    @Transactional(readOnly = true)
    public DashboardSummary getDashboardSummary() {
        LocalDate today = LocalDate.now();
        LocalDate last30 = today.minusDays(30);
        LocalDate last7 = today.minusDays(7);

        List<Object[]> topDiseases = caseRepo.topDiseases(last30, today);
        List<Object[]> byRegion = caseRepo.casesByRegion(last30, today);
        List<OutbreakAlert> alerts = alertRepo.findByActiveTrueOrderByTriggeredAtDesc();

        // Top 5 diseases last 30 days
        List<DiseaseCount> top5 =
                topDiseases
                        .stream().limit(5).map(row -> new DiseaseCount((String) row[0],
                                (String) row[1], ((Number) row[2]).longValue()))
                        .collect(Collectors.toList());

        // Cases by region
        List<RegionCount> regions = byRegion.stream()
                .map(row -> new RegionCount((String) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        // Total cases last 7 days
        List<Object[]> weekly = caseRepo.topDiseases(last7, today);
        long totalWeekly = weekly.stream().mapToLong(row -> ((Number) row[2]).longValue()).sum();

        return new DashboardSummary(top5, regions, alerts.stream().map(AlertSummary::from).toList(),
                totalWeekly, (long) alerts.size());
    }

    // ── Active outbreak alerts ───────────────────────────

    @Transactional(readOnly = true)
    public List<AlertSummary> getActiveAlerts() {
        return alertRepo.findByActiveTrueOrderByTriggeredAtDesc().stream().map(AlertSummary::from)
                .toList();
    }

    // ── Disease trend for a specific ICD-10 code ─────────

    @Transactional(readOnly = true)
    public List<DiseaseCaseResponse> getCasesInRange(LocalDate from, LocalDate to) {
        return caseRepo.findInDateRange(from, to).stream().map(DiseaseCaseResponse::from).toList();
    }

    // ── Resolve an alert ─────────────────────────────────

    @Transactional
    public void resolveAlert(Long alertId) {
        alertRepo.findById(alertId).ifPresent(alert -> {
            alert.setActive(false);
            alert.setResolvedAt(java.time.LocalDateTime.now());
            alertRepo.save(alert);
            log.info("Outbreak alert resolved: id={} disease={} region={}", alertId,
                    alert.getDiseaseName(), alert.getRegion());
        });
    }

    // ── Private: outbreak detection ──────────────────────

    private void checkOutbreakThreshold(String icd10Code, String diseaseName, String region) {
        // Count cases for this disease+region in last 7 days
        LocalDate weekAgo = LocalDate.now().minusDays(7);
        List<Object[]> counts = caseRepo.diseaseByRegion(icd10Code, weekAgo, LocalDate.now());

        long totalRegionCases = counts.stream().filter(row -> region.equals(row[0]))
                .mapToLong(row -> ((Number) row[3]).longValue()).sum();

        int threshold = getThreshold(icd10Code);
        boolean alertExists =
                !alertRepo.findByIcd10CodeAndRegionAndActiveTrue(icd10Code, region).isEmpty();

        if (totalRegionCases >= threshold && !alertExists) {
            String level = totalRegionCases >= threshold * 3 ? "CRITICAL"
                    : totalRegionCases >= threshold * 2 ? "WARNING" : "WARNING";

            OutbreakAlert alert = OutbreakAlert.builder().icd10Code(icd10Code)
                    .diseaseName(diseaseName).region(region).caseCount((int) totalRegionCases)
                    .threshold(threshold).alertLevel(level).build();

            alertRepo.save(alert);
            log.warn("OUTBREAK ALERT: {} ({}) in {} — {} cases (threshold: {})", diseaseName,
                    icd10Code, region, totalRegionCases, threshold);
        }
    }

    /** Disease-specific outbreak thresholds (cases in 7 days) */
    private int getThreshold(String icd10Code) {
        return switch (icd10Code.toUpperCase()) {
            case "B54", "B50", "B51", "B52", "B53" -> 5; // Malaria — 5 cases/week
            case "A00", "A01", "A02" -> 3; // Cholera — 3 cases/week
            case "A33" -> 1; // Tetanus — any case
            case "B05" -> 5; // Measles
            case "A90", "A91" -> 3; // Dengue
            default -> 10; // General threshold
        };
    }
}
