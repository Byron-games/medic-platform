package com.medic.pharmacy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medic.pharmacy.domain.Prescription;
import com.medic.pharmacy.domain.PrescriptionStatus;
import com.medic.pharmacy.dto.*;
import com.medic.pharmacy.exception.PrescriptionNotFoundException;
import com.medic.pharmacy.repository.DrugCatalogRepository;
import com.medic.pharmacy.repository.PrescriptionRepository;
import com.medic.pharmacy.security.RequestContext;
import com.medic.pharmacy.service.DrugInteractionChecker;
import com.medic.pharmacy.service.DrugInteractionException;
import com.medic.pharmacy.service.PharmacyService;
import com.medic.pharmacy.service.RxCodeGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PharmacyServiceTest {

    @Mock PrescriptionRepository  prescriptionRepo;
    @Mock DrugCatalogRepository   drugCatalogRepo;
    @Mock DrugInteractionChecker  interactionChecker;
    @Mock RxCodeGenerator         rxCodeGenerator;
    @Mock RequestContext          ctx;

    @InjectMocks PharmacyService service;

    // Real ObjectMapper — no mocking needed
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void injectObjectMapper() throws Exception {
        var field = PharmacyService.class.getDeclaredField("objectMapper");
        field.setAccessible(true);
        field.set(service, objectMapper);
    }

    private List<MedicationItem> singleDrug() {
        return List.of(new MedicationItem(
            "Paracetamol", "500mg", "twice daily", "5 days", "10 tablets", "Take with food"
        ));
    }

    private List<MedicationItem> twoDrugs() {
        return List.of(
            new MedicationItem("Amoxicillin", "500mg", "three times daily", "7 days", "21 capsules", null),
            new MedicationItem("Warfarin",    "5mg",   "once daily",        "30 days","30 tablets", "Monitor INR")
        );
    }

    @Test
    void issue_withNoInteractions_shouldCreatePrescription() {
        when(interactionChecker.check(any())).thenReturn(List.of());
        when(rxCodeGenerator.generate()).thenReturn("RX-20260521-ABCDE");
        when(prescriptionRepo.existsByRxCode("RX-20260521-ABCDE")).thenReturn(false);
        when(ctx.getUserId()).thenReturn(1L);
        when(ctx.getUsername()).thenReturn("dr.smith");
        when(ctx.getFacilityId()).thenReturn("FAC-001");
        when(prescriptionRepo.save(any())).thenAnswer(i -> {
            Prescription p = i.getArgument(0);
            Prescription saved = Prescription.builder()
                .id(1L).rxCode(p.getRxCode()).patientMpiId(p.getPatientMpiId())
                .clinicianId(p.getClinicianId()).clinicianName(p.getClinicianName())
                .facilityId(p.getFacilityId()).status(p.getStatus())
                .medications(p.getMedications()).interactionWarnings(p.getInteractionWarnings())
                .notes(p.getNotes()).issuedAt(LocalDateTime.now())
                .expiresAt(p.getExpiresAt()).build();
            return saved;
        });

        IssuePrescriptionRequest req = new IssuePrescriptionRequest(
            "MPI-20260520-ABCDE", singleDrug(), "Take with plenty of water", null, false
        );

        PrescriptionResponse response = service.issue(req);

        assertThat(response.rxCode()).isEqualTo("RX-20260521-ABCDE");
        assertThat(response.patientMpiId()).isEqualTo("MPI-20260520-ABCDE");
        assertThat(response.status()).isEqualTo(PrescriptionStatus.ISSUED);
        assertThat(response.hasInteractions()).isFalse();
        verify(prescriptionRepo).save(any());
    }

    @Test
    void issue_withInteractions_withoutForceIssue_shouldThrow() {
        when(interactionChecker.check(any())).thenReturn(List.of(
            new InteractionWarning("Amoxicillin", "Warfarin", "MODERATE",
                "Amoxicillin may enhance the anticoagulant effect of Warfarin")
        ));

        IssuePrescriptionRequest req = new IssuePrescriptionRequest(
            "MPI-20260520-ABCDE", twoDrugs(), null, null, false
        );

        assertThatThrownBy(() -> service.issue(req))
            .isInstanceOf(DrugInteractionException.class)
            .hasMessageContaining("Amoxicillin")
            .hasMessageContaining("Warfarin")
            .hasMessageContaining("forceIssue=true");
    }

    @Test
    void issue_withInteractions_withForceIssue_shouldSucceedAndRecordWarnings() {
        InteractionWarning warning = new InteractionWarning(
            "Amoxicillin", "Warfarin", "MODERATE", "Monitor INR closely");
        when(interactionChecker.check(any())).thenReturn(List.of(warning));
        when(rxCodeGenerator.generate()).thenReturn("RX-20260521-FORCE");
        when(prescriptionRepo.existsByRxCode("RX-20260521-FORCE")).thenReturn(false);
        when(ctx.getUserId()).thenReturn(1L);
        when(ctx.getUsername()).thenReturn("dr.smith");
        when(ctx.getFacilityId()).thenReturn("FAC-001");
        when(prescriptionRepo.save(any())).thenAnswer(i -> {
            Prescription p = i.getArgument(0);
            return Prescription.builder()
                .id(2L).rxCode(p.getRxCode()).patientMpiId(p.getPatientMpiId())
                .clinicianId(p.getClinicianId()).clinicianName(p.getClinicianName())
                .facilityId(p.getFacilityId()).status(p.getStatus())
                .medications(p.getMedications())
                .interactionWarnings(p.getInteractionWarnings())
                .issuedAt(LocalDateTime.now()).expiresAt(p.getExpiresAt()).build();
        });

        IssuePrescriptionRequest req = new IssuePrescriptionRequest(
            "MPI-20260520-ABCDE", twoDrugs(), null, null, true
        );

        PrescriptionResponse response = service.issue(req);

        assertThat(response.hasInteractions()).isTrue();
        assertThat(response.interactionWarnings()).isNotEmpty();
    }

    @Test
    void dispense_issuedPrescription_shouldMarkDispensed() {
        Prescription prescription = Prescription.builder()
            .id(1L).rxCode("RX-20260521-ABCDE")
            .patientMpiId("MPI-20260520-ABCDE")
            .clinicianId(1L).clinicianName("dr.smith").facilityId("FAC-001")
            .status(PrescriptionStatus.ISSUED)
            .medications(List.of(Map.of("name", "Paracetamol", "dosage", "500mg")))
            .issuedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(30))
            .build();

        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(prescription));
        when(ctx.getUserId()).thenReturn(5L);
        when(ctx.getUsername()).thenReturn("pharmacist.joe");
        when(prescriptionRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        PrescriptionResponse response = service.dispense(1L,
            new DispenseRequest("Paracetamol", "10 tablets", "BATCH-001", "2027-06-01", null));

        assertThat(response.status()).isEqualTo(PrescriptionStatus.DISPENSED);
        assertThat(response.dispensedBy()).isEqualTo(5L);
        assertThat(response.dispensedAt()).isNotNull();
    }

    @Test
    void dispense_expiredPrescription_shouldThrow() {
        Prescription prescription = Prescription.builder()
            .id(1L).rxCode("RX-20260101-EXPRD")
            .patientMpiId("MPI-20260520-ABCDE")
            .clinicianId(1L).clinicianName("dr.smith").facilityId("FAC-001")
            .status(PrescriptionStatus.ISSUED)
            .medications(List.of(Map.of("name", "Amoxicillin")))
            .issuedAt(LocalDateTime.now().minusDays(45))
            .expiresAt(LocalDateTime.now().minusDays(15))   // expired
            .build();

        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(prescription));

        assertThatThrownBy(() -> service.dispense(1L,
            new DispenseRequest("Amoxicillin", null, null, null, null)))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("expired");
    }

    @Test
    void getById_notFound_shouldThrow() {
        when(prescriptionRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(999L))
            .isInstanceOf(PrescriptionNotFoundException.class);
    }

    @Test
    void rxCodeGenerator_shouldMatchFormat() {
        RxCodeGenerator gen = new RxCodeGenerator();
        String code = gen.generate();
        assertThat(code).matches("RX-\\d{8}-[A-Z2-9]{5}");
        assertThat(code).hasSize(17);
    }

    @Test
    void cancel_dispensedPrescription_shouldThrow() {
        Prescription prescription = Prescription.builder()
            .id(1L).rxCode("RX-20260521-DISP")
            .patientMpiId("MPI-20260520-ABCDE")
            .status(PrescriptionStatus.DISPENSED)
            .medications(List.of()).issuedAt(LocalDateTime.now()).build();

        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(prescription));

        assertThatThrownBy(() -> service.cancel(1L))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("dispensed");
    }
}
