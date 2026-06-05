package com.medic.emr.controller;

import com.medic.emr.domain.RecordType;
import com.medic.emr.dto.*;
import com.medic.emr.service.EmrService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/emr")
@RequiredArgsConstructor
@Tag(name = "EMR", description = "Electronic Medical Records — SOAP notes, vitals, ICD-10 coding")
public class EmrController {

    private final EmrService emrService;

    @GetMapping("/patients/{mpiId}/records")
    @Operation(summary = "List all medical records for a patient")
    public ResponseEntity<Page<RecordSummary>> listForPatient(
            @PathVariable String mpiId,
            @RequestParam(required = false) RecordType type,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(emrService.listForPatient(mpiId, type, page, size));
    }

    @GetMapping("/patients/{mpiId}/timeline")
    @Operation(summary = "Get the last N records for a patient (cross-type timeline)")
    public ResponseEntity<List<RecordSummary>> getTimeline(
            @PathVariable String mpiId,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(emrService.getTimeline(mpiId, limit));
    }

    @GetMapping("/patients/{mpiId}/records/count")
    @Operation(summary = "Get total record count for a patient")
    public ResponseEntity<Long> countForPatient(@PathVariable String mpiId) {
        return ResponseEntity.ok(emrService.countForPatient(mpiId));
    }

    @GetMapping("/records/{id}")
    @Operation(summary = "Get a full medical record by ID")
    public ResponseEntity<MedicalRecordResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(emrService.getById(id));
    }

    @PostMapping("/records")
    @Operation(summary = "Create a new medical record (SOAP note + optional vitals)")
    public ResponseEntity<MedicalRecordResponse> create(
            @Valid @RequestBody CreateRecordRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emrService.create(req));
    }

    @PatchMapping("/records/{id}")
    @Operation(summary = "Update a medical record (PATCH — only the authoring clinician or admin)")
    public ResponseEntity<MedicalRecordResponse> update(
            @PathVariable Long id,
            @RequestBody UpdateRecordRequest req) {
        return ResponseEntity.ok(emrService.update(id, req));
    }

    @GetMapping("/records/{id}/vitals")
    @Operation(summary = "Get all vital sign readings for a record")
    public ResponseEntity<List<VitalSignsResponse>> getVitals(@PathVariable Long id) {
        return ResponseEntity.ok(emrService.getVitals(id));
    }

    @PostMapping("/records/{id}/vitals")
    @Operation(summary = "Add a vital signs reading to an existing record")
    public ResponseEntity<VitalSignsResponse> addVitals(
            @PathVariable Long id,
            @Valid @RequestBody VitalSignsRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emrService.addVitals(id, req));
    }
}
