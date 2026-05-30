package com.medic.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.medic.analytics.domain.DiseaseCase;
import com.medic.analytics.domain.OutbreakAlert;
import com.medic.analytics.dto.DashboardSummary;
import com.medic.analytics.dto.DiseaseCaseResponse;
import com.medic.analytics.dto.ReportCaseRequest;
import com.medic.analytics.repository.DiseaseCaseRepository;
import com.medic.analytics.repository.OutbreakAlertRepository;
import com.medic.analytics.service.AnalyticsService;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    DiseaseCaseRepository caseRepo;
    @Mock
    OutbreakAlertRepository alertRepo;

    @InjectMocks
    AnalyticsService service;

    @Test
    void reportCase_shouldPersistAndReturnResponse() {
        DiseaseCase saved = DiseaseCase.builder().id(1L).reportDate(LocalDate.now())
                .region("Centre").facilityId("FAC-001").icd10Code("B54")
                .diseaseName("Malaria, unspecified").caseCount(1).build();

        when(caseRepo.save(any())).thenReturn(saved);
        when(caseRepo.diseaseByRegion(eq("B54"), any(), any())).thenReturn(List.<Object[]>of());
        when(alertRepo.findByIcd10CodeAndRegionAndActiveTrue("B54", "Centre"))
                .thenReturn(List.of());

        ReportCaseRequest req = new ReportCaseRequest("Centre", "FAC-001", "B54",
                "Malaria, unspecified", LocalDate.now(), 1, "MILD");

        DiseaseCaseResponse response = service.reportCase(req);

        assertThat(response.icd10Code()).isEqualTo("B54");
        assertThat(response.region()).isEqualTo("Centre");
        verify(caseRepo).save(any());
    }

    @Test
    void reportCase_whenThresholdReached_shouldCreateOutbreakAlert() {
        DiseaseCase saved = DiseaseCase.builder().id(1L).reportDate(LocalDate.now())
                .region("Littoral").facilityId("FAC-002").icd10Code("B54")
                .diseaseName("Malaria, unspecified").caseCount(3).build();

        when(caseRepo.save(any())).thenReturn(saved);

        // Return 6 cases (above threshold of 5 for malaria)
        Object[] row = new Object[] {"Littoral", "B54", "Malaria, unspecified", 6L};
        when(caseRepo.diseaseByRegion(eq("B54"), any(), any())).thenReturn(List.<Object[]>of(row));
        when(alertRepo.findByIcd10CodeAndRegionAndActiveTrue("B54", "Littoral"))
                .thenReturn(List.of()); // No existing alert
        when(alertRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ReportCaseRequest req = new ReportCaseRequest("Littoral", "FAC-002", "B54",
                "Malaria, unspecified", LocalDate.now(), 3, null);

        service.reportCase(req);

        // Should create outbreak alert since 6 > threshold of 5
        verify(alertRepo).save(argThat(alert -> alert.getIcd10Code().equals("B54")
                && alert.getRegion().equals("Littoral") && alert.isActive()));
    }

    @Test
    void reportCase_whenAlertAlreadyExists_shouldNotCreateDuplicate() {
        DiseaseCase saved = DiseaseCase.builder().id(1L).reportDate(LocalDate.now())
                .region("Centre").facilityId("FAC-001").icd10Code("A00").diseaseName("Cholera")
                .caseCount(1).build();

        when(caseRepo.save(any())).thenReturn(saved);

        Object[] row = new Object[] {"Centre", "A00", "Cholera", 5L};
        when(caseRepo.diseaseByRegion(eq("A00"), any(), any())).thenReturn(List.<Object[]>of(row));

        // Alert already exists
        OutbreakAlert existing = OutbreakAlert.builder().id(1L).icd10Code("A00").region("Centre")
                .active(true).build();
        when(alertRepo.findByIcd10CodeAndRegionAndActiveTrue("A00", "Centre"))
                .thenReturn(List.of(existing));

        ReportCaseRequest req = new ReportCaseRequest("Centre", "FAC-001", "A00", "Cholera",
                LocalDate.now(), 1, "SEVERE");

        service.reportCase(req);

        // Should NOT create another alert
        verify(alertRepo, never()).save(any());
    }

    @Test
    void resolveAlert_shouldSetInactiveAndResolvedAt() {
        OutbreakAlert alert = OutbreakAlert.builder().id(1L).icd10Code("B54").diseaseName("Malaria")
                .region("Nord").active(true).triggeredAt(LocalDateTime.now().minusDays(3)).build();

        when(alertRepo.findById(1L)).thenReturn(Optional.of(alert));
        when(alertRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        service.resolveAlert(1L);

        assertThat(alert.isActive()).isFalse();
        assertThat(alert.getResolvedAt()).isNotNull();
        verify(alertRepo).save(alert);
    }

    @Test
    void getDashboardSummary_shouldReturnStructuredData() {
        when(caseRepo.topDiseases(any(), any()))
                .thenReturn(List.<Object[]>of(new Object[] {"Malaria, unspecified", "B54", 42L},
                        new Object[] {"Acute respiratory infection", "J22", 28L}));
        when(caseRepo.casesByRegion(any(), any())).thenReturn(
                List.<Object[]>of(new Object[] {"Centre", 35L}, new Object[] {"Littoral", 22L}));
        when(alertRepo.findByActiveTrueOrderByTriggeredAtDesc()).thenReturn(List.of());

        DashboardSummary summary = service.getDashboardSummary();

        assertThat(summary.topDiseases()).hasSize(2);
        assertThat(summary.topDiseases().get(0).diseaseName()).isEqualTo("Malaria, unspecified");
        assertThat(summary.casesByRegion()).hasSize(2);
        assertThat(summary.activeAlertCount()).isEqualTo(0);
    }

    @Test
    void malariaThreshold_shouldBe5Cases() {
        DiseaseCase saved = DiseaseCase.builder().id(1L).reportDate(LocalDate.now())
                .region("Adamaoua").facilityId("FAC-003").icd10Code("B54")
                .diseaseName("Malaria, unspecified").caseCount(1).build();

        when(caseRepo.save(any())).thenReturn(saved);

        Object[] row = new Object[] {"Adamaoua", "B54", "Malaria, unspecified", 4L};
        when(caseRepo.diseaseByRegion(eq("B54"), any(), any())).thenReturn(List.<Object[]>of(row));
        when(alertRepo.findByIcd10CodeAndRegionAndActiveTrue(anyString(), anyString()))
                .thenReturn(List.of());

        ReportCaseRequest req = new ReportCaseRequest("Adamaoua", "FAC-003", "B54",
                "Malaria, unspecified", LocalDate.now(), 1, null);

        service.reportCase(req);

        // 4 < 5 threshold — no alert should be created
        verify(alertRepo, never()).save(any());
    }
}
