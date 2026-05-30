package com.medic.analytics.controller;

import com.medic.analytics.dto.*;
import com.medic.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Disease surveillance, outbreak detection, dashboard metrics")
public class AnalyticsController {

    private final AnalyticsService service;

    @PostMapping("/cases")
    @Operation(summary = "Report a new disease case (triggers outbreak detection)")
    public ResponseEntity<DiseaseCaseResponse> reportCase(
            @Valid @RequestBody ReportCaseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.reportCase(req));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get full dashboard summary (top diseases, regions, active alerts)")
    public ResponseEntity<DashboardSummary> getDashboard() {
        return ResponseEntity.ok(service.getDashboardSummary());
    }

    @GetMapping("/alerts")
    @Operation(summary = "Get all active outbreak alerts")
    public ResponseEntity<List<AlertSummary>> getActiveAlerts() {
        return ResponseEntity.ok(service.getActiveAlerts());
    }

    @PatchMapping("/alerts/{id}/resolve")
    @Operation(summary = "Resolve an outbreak alert")
    public ResponseEntity<Void> resolveAlert(@PathVariable Long id) {
        service.resolveAlert(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cases")
    @Operation(summary = "Get disease cases in a date range")
    public ResponseEntity<List<DiseaseCaseResponse>> getCases(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getCasesInRange(from, to));
    }
}
