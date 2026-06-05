package com.medic.patient.controller;

import com.medic.patient.dto.*;
import com.medic.patient.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
@Tag(name = "Patient Identity (MPI)",
     description = "Master Patient Index — register, search, and manage patients")
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    @Operation(summary = "List all active patients (paginated)")
    public ResponseEntity<Page<PatientSummary>> list(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(patientService.listAll(page, size));
    }

    @GetMapping("/search")
    @Operation(summary = "Search patients by name, national ID, phone or MPI ID")
    public ResponseEntity<Page<PatientSummary>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(patientService.search(q, page, size));
    }

    @GetMapping("/{mpiId}")
    @Operation(summary = "Get full patient record by MPI ID")
    public ResponseEntity<PatientResponse> getByMpiId(@PathVariable String mpiId) {
        return ResponseEntity.ok(patientService.getByMpiId(mpiId));
    }

    @PostMapping
    @Operation(summary = "Register a new patient in the MPI")
    public ResponseEntity<PatientResponse> create(@Valid @RequestBody CreatePatientRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.create(req));
    }

    @PatchMapping("/{mpiId}")
    @Operation(summary = "Update patient demographics (partial update — PATCH semantics)")
    public ResponseEntity<PatientResponse> update(
            @PathVariable String mpiId,
            @Valid @RequestBody UpdatePatientRequest req) {
        return ResponseEntity.ok(patientService.update(mpiId, req));
    }

    @DeleteMapping("/{mpiId}")
    @Operation(summary = "Soft-deactivate a patient record")
    public ResponseEntity<Void> deactivate(@PathVariable String mpiId) {
        patientService.deactivate(mpiId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/facility/{facilityId}")
    @Operation(summary = "List all patients registered at a specific facility")
    public ResponseEntity<Page<PatientSummary>> byFacility(
            @PathVariable String facilityId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(patientService.findByFacility(facilityId, page, size));
    }

    @PostMapping("/{mpiId}/facilities/{facilityId}")
    @Operation(summary = "Link a patient to an additional facility")
    public ResponseEntity<Void> linkFacility(
            @PathVariable String mpiId,
            @PathVariable String facilityId,
            @RequestParam(required = false) String facilityName) {
        patientService.linkToFacility(mpiId, facilityId,
            facilityName != null ? facilityName : facilityId);
        return ResponseEntity.ok().build();
    }
}
