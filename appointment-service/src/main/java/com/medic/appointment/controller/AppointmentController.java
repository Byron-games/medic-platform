package com.medic.appointment.controller;

import com.medic.appointment.dto.*;
import com.medic.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Scheduling, rescheduling, cancellation and status management")
public class AppointmentController {

    private final AppointmentService service;

    @PostMapping
    @Operation(summary = "Book a new appointment")
    public ResponseEntity<AppointmentResponse> book(
            @Valid @RequestBody BookAppointmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.book(req));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an appointment by ID")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/patient/{mpiId}")
    @Operation(summary = "List all appointments for a patient (paginated, newest first)")
    public ResponseEntity<Page<AppointmentResponse>> listForPatient(
            @PathVariable String mpiId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listForPatient(mpiId, page, size));
    }

    @GetMapping("/patient/{mpiId}/upcoming")
    @Operation(summary = "Get upcoming appointments for a patient")
    public ResponseEntity<List<AppointmentResponse>> upcomingForPatient(
            @PathVariable String mpiId) {
        return ResponseEntity.ok(service.upcomingForPatient(mpiId));
    }

    @GetMapping("/clinician/{clinicianId}/schedule")
    @Operation(summary = "Get clinician schedule for a date range")
    public ResponseEntity<List<AppointmentResponse>> clinicianSchedule(
            @PathVariable Long clinicianId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(service.clinicianSchedule(clinicianId, from, to));
    }

    @GetMapping("/facility/{facilityId}/schedule")
    @Operation(summary = "Get all appointments at a facility for a date range")
    public ResponseEntity<List<AppointmentResponse>> facilitySchedule(
            @PathVariable String facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(service.facilitySchedule(facilityId, from, to));
    }

    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Confirm a scheduled appointment")
    public ResponseEntity<AppointmentResponse> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(service.confirm(id));
    }

    @PatchMapping("/{id}/start")
    @Operation(summary = "Mark an appointment as in-progress")
    public ResponseEntity<AppointmentResponse> start(@PathVariable Long id) {
        return ResponseEntity.ok(service.start(id));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Mark an appointment as completed")
    public ResponseEntity<AppointmentResponse> complete(@PathVariable Long id) {
        return ResponseEntity.ok(service.complete(id));
    }

    @PatchMapping("/{id}/no-show")
    @Operation(summary = "Mark a patient as no-show")
    public ResponseEntity<AppointmentResponse> noShow(@PathVariable Long id) {
        return ResponseEntity.ok(service.markNoShow(id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<AppointmentResponse> cancel(
            @PathVariable Long id,
            @RequestBody(required = false) CancelRequest req) {
        return ResponseEntity.ok(service.cancel(id, req));
    }

    @PostMapping("/{id}/reschedule")
    @Operation(summary = "Reschedule an appointment to a new time (creates new appointment)")
    public ResponseEntity<AppointmentResponse> reschedule(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.reschedule(id, req));
    }
}
