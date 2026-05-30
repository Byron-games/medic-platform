package com.medic.pharmacy.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medic.pharmacy.domain.Prescription;
import com.medic.pharmacy.domain.PrescriptionStatus;
import com.medic.pharmacy.dto.DispenseRequest;
import com.medic.pharmacy.dto.DrugCatalogResponse;
import com.medic.pharmacy.dto.InteractionWarning;
import com.medic.pharmacy.dto.IssuePrescriptionRequest;
import com.medic.pharmacy.dto.MedicationItem;
import com.medic.pharmacy.dto.PrescriptionResponse;
import com.medic.pharmacy.exception.PrescriptionNotFoundException;
import com.medic.pharmacy.repository.DrugCatalogRepository;
import com.medic.pharmacy.repository.PrescriptionRepository;
import com.medic.pharmacy.security.RequestContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyService {

    private final PrescriptionRepository prescriptionRepo;
    private final DrugCatalogRepository drugCatalogRepo;
    private final DrugInteractionChecker interactionChecker;
    private final RxCodeGenerator rxCodeGenerator;
    private final RequestContext ctx;
    private final ObjectMapper objectMapper;

    // ── Issue prescription ───────────────────────────────

    @Transactional
    public PrescriptionResponse issue(IssuePrescriptionRequest req) {
        // Check for drug interactions
        List<InteractionWarning> warnings = interactionChecker.check(req.medications());

        if (!warnings.isEmpty() && !req.forceIssue()) {
            throw new DrugInteractionException("Drug interaction(s) detected: "
                    + warnings.stream().map(w -> w.drug1() + " + " + w.drug2())
                            .collect(Collectors.joining(", "))
                    + ". Set forceIssue=true to proceed and record the warnings.");
        }

        String rxCode = generateUniqueRxCode();

        // Convert MedicationItem list → List<Map> for JSONB storage
        List<Map<String, Object>> medsJson = req.medications().stream()
                .map(m -> objectMapper.convertValue(m, new TypeReference<Map<String, Object>>() {}))
                .toList();

        List<Map<String, Object>> warningsJson = warnings.stream()
                .map(w -> objectMapper.convertValue(w, new TypeReference<Map<String, Object>>() {}))
                .toList();

        Prescription prescription =
                Prescription.builder().rxCode(rxCode).patientMpiId(req.patientMpiId())
                        .clinicianId(ctx.getUserId() != null ? ctx.getUserId() : 0L)
                        .clinicianName(ctx.getUsername() != null ? ctx.getUsername() : "Unknown")
                        .facilityId(ctx.getFacilityId() != null ? ctx.getFacilityId() : "UNKNOWN")
                        .status(PrescriptionStatus.ISSUED).medications(medsJson)
                        .interactionWarnings(warningsJson.isEmpty() ? null : warningsJson)
                        .notes(req.notes()).expiresAt(req.expiresAt() != null ? req.expiresAt()
                                : LocalDateTime.now().plusDays(30))
                        .build();

        prescriptionRepo.save(prescription);

        log.info("Prescription issued: rx={} patient={} drugs={} interactions={}", rxCode,
                req.patientMpiId(), req.medications().size(), warnings.size());

        return PrescriptionResponse.from(prescription);
    }

    // ── Get by ID ────────────────────────────────────────

    @Transactional(readOnly = true)
    public PrescriptionResponse getById(Long id) {
        return PrescriptionResponse.from(findOrThrow(id));
    }

    // ── Get by RX code ───────────────────────────────────

    @Transactional(readOnly = true)
    public PrescriptionResponse getByRxCode(String rxCode) {
        Prescription p = prescriptionRepo.findByRxCode(rxCode)
                .orElseThrow(() -> new PrescriptionNotFoundException(
                        "Prescription not found for code: " + rxCode));
        return PrescriptionResponse.from(p);
    }

    // ── List for patient ─────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PrescriptionResponse> listForPatient(String mpiId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return prescriptionRepo.findByPatientMpiIdOrderByIssuedAtDesc(mpiId, pageable)
                .map(PrescriptionResponse::from);
    }

    // ── Active prescriptions for patient ─────────────────

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> activeForPatient(String mpiId) {
        return prescriptionRepo.findActiveForPatient(mpiId).stream().map(PrescriptionResponse::from)
                .toList();
    }

    // ── List for facility ────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PrescriptionResponse> listForFacility(String facilityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return prescriptionRepo.findByFacilityIdOrderByIssuedAtDesc(facilityId, pageable)
                .map(PrescriptionResponse::from);
    }

    // ── Current facility helper ──────────────────────────

    public String getCurrentFacilityId() {
        return ctx.getFacilityId() != null ? ctx.getFacilityId() : "FAC-001";
    }

    // ── Dispense ─────────────────────────────────────────

    @Transactional
    public PrescriptionResponse dispense(Long id, DispenseRequest req) {
        Prescription prescription = findOrThrow(id);

        if (!prescription.isDispensable()) {
            throw new IllegalStateException(
                    "Cannot dispense prescription with status: " + prescription.getStatus());
        }

        if (prescription.isExpired()) {
            throw new IllegalStateException(
                    "Prescription " + prescription.getRxCode() + " has expired");
        }

        // Mark as fully dispensed (partial dispensing tracked in dispensing_log)
        prescription.setStatus(PrescriptionStatus.DISPENSED);
        prescription.setDispensedAt(LocalDateTime.now());
        prescription.setDispensedBy(ctx.getUserId());
        prescriptionRepo.save(prescription);

        log.info("Prescription dispensed: rx={} by={} drug={}", prescription.getRxCode(),
                ctx.getUsername(), req.medicationName());

        return PrescriptionResponse.from(prescription);
    }

    // ── Cancel ───────────────────────────────────────────

    @Transactional
    public PrescriptionResponse cancel(Long id) {
        Prescription prescription = findOrThrow(id);

        if (prescription.getStatus() == PrescriptionStatus.DISPENSED) {
            throw new IllegalStateException("Cannot cancel a dispensed prescription");
        }

        prescription.setStatus(PrescriptionStatus.CANCELLED);
        prescriptionRepo.save(prescription);

        log.info("Prescription cancelled: rx={} by={}", prescription.getRxCode(),
                ctx.getUsername());
        return PrescriptionResponse.from(prescription);
    }

    // ── Drug catalog search ──────────────────────────────

    @Transactional(readOnly = true)
    public List<DrugCatalogResponse> searchDrugs(String term) {
        return drugCatalogRepo.searchByName(term).stream().map(DrugCatalogResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<DrugCatalogResponse> listAllDrugs() {
        return drugCatalogRepo.findByAvailableInCameroonTrueOrderByGenericName().stream()
                .map(DrugCatalogResponse::from).toList();
    }

    // ── Interaction check (standalone) ───────────────────

    public List<InteractionWarning> checkInteractions(List<MedicationItem> medications) {
        return interactionChecker.check(medications);
    }

    // ── Private helpers ──────────────────────────────────

    private Prescription findOrThrow(Long id) {
        return prescriptionRepo.findById(id).orElseThrow(
                () -> new PrescriptionNotFoundException("Prescription not found: " + id));
    }

    private String generateUniqueRxCode() {
        for (int i = 0; i < 5; i++) {
            String code = rxCodeGenerator.generate();
            if (!prescriptionRepo.existsByRxCode(code))
                return code;
        }
        throw new IllegalStateException("Failed to generate unique Rx code");
    }
}
