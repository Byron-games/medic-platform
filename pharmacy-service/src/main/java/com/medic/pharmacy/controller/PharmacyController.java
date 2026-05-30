package com.medic.pharmacy.controller;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.medic.pharmacy.dto.DispenseRequest;
import com.medic.pharmacy.dto.DrugCatalogResponse;
import com.medic.pharmacy.dto.InteractionWarning;
import com.medic.pharmacy.dto.IssuePrescriptionRequest;
import com.medic.pharmacy.dto.MedicationItem;
import com.medic.pharmacy.dto.PrescriptionResponse;
import com.medic.pharmacy.service.PharmacyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/pharmacy")
@RequiredArgsConstructor
@Tag(name = "Pharmacy",
        description = "e-Prescriptions, drug interaction checks, dispensing workflow")
public class PharmacyController {

    private final PharmacyService service;

    // ── Prescriptions ────────────────────────────────────

    @PostMapping("/prescriptions")
    @Operation(summary = "Issue a new prescription (with automatic interaction check)")
    public ResponseEntity<PrescriptionResponse> issue(
            @Valid @RequestBody IssuePrescriptionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.issue(req));
    }

    @GetMapping("/prescriptions/{id}")
    @Operation(summary = "Get a prescription by ID")
    public ResponseEntity<PrescriptionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/prescriptions/rx/{rxCode}")
    @Operation(summary = "Look up a prescription by Rx code (used at dispensing counter)")
    public ResponseEntity<PrescriptionResponse> getByRxCode(@PathVariable String rxCode) {
        return ResponseEntity.ok(service.getByRxCode(rxCode));
    }

    @GetMapping("/prescriptions/patient/{mpiId}")
    @Operation(summary = "List all prescriptions for a patient")
    public ResponseEntity<Page<PrescriptionResponse>> listForPatient(@PathVariable String mpiId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listForPatient(mpiId, page, size));
    }

    @GetMapping("/prescriptions/patient/{mpiId}/active")
    @Operation(summary = "Get active prescriptions for a patient (ISSUED or PARTIALLY_DISPENSED)")
    public ResponseEntity<List<PrescriptionResponse>> activeForPatient(@PathVariable String mpiId) {
        return ResponseEntity.ok(service.activeForPatient(mpiId));
    }

    @GetMapping("/prescriptions")
    @Operation(summary = "List all prescriptions for the current facility")
    public ResponseEntity<Page<PrescriptionResponse>> listForFacility(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        String facilityId = service.getCurrentFacilityId();
        return ResponseEntity.ok(service.listForFacility(facilityId, page, size));
    }

    @PostMapping("/prescriptions/{id}/dispense")
    @Operation(summary = "Mark a prescription as dispensed")
    public ResponseEntity<PrescriptionResponse> dispense(@PathVariable Long id,
            @Valid @RequestBody DispenseRequest req) {
        return ResponseEntity.ok(service.dispense(id, req));
    }

    @PatchMapping("/prescriptions/{id}/cancel")
    @Operation(summary = "Cancel a prescription")
    public ResponseEntity<PrescriptionResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    // ── Drug interaction check (standalone) ─────────────

    @PostMapping("/interactions/check")
    @Operation(summary = "Check for drug-drug interactions between a list of medications")
    public ResponseEntity<List<InteractionWarning>> checkInteractions(
            @RequestBody List<@Valid MedicationItem> medications) {
        return ResponseEntity.ok(service.checkInteractions(medications));
    }

    // ── Drug catalog ─────────────────────────────────────

    @GetMapping("/drugs")
    @Operation(summary = "List all drugs available in Cameroon formulary")
    public ResponseEntity<List<DrugCatalogResponse>> listDrugs() {
        return ResponseEntity.ok(service.listAllDrugs());
    }

    @GetMapping("/drugs/search")
    @Operation(summary = "Search drug catalog by name")
    public ResponseEntity<List<DrugCatalogResponse>> searchDrugs(@RequestParam String q) {
        return ResponseEntity.ok(service.searchDrugs(q));
    }
}
