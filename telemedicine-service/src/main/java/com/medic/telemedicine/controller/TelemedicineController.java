package com.medic.telemedicine.controller;

import com.medic.telemedicine.dto.CreateSessionRequest;
import com.medic.telemedicine.dto.SessionResponse;
import com.medic.telemedicine.service.TelemedicineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.List;

@RestController
@RequestMapping("/api/v1/telemedicine")
@RequiredArgsConstructor
@Tag(name = "Telemedicine", description = "Jitsi video session management with low-bandwidth support")
public class TelemedicineController {

    private final TelemedicineService service;

    @PostMapping("/sessions")
    @Operation(summary = "Create a new telemedicine session and generate Jitsi join URLs")
    public ResponseEntity<SessionResponse> create(
            @Valid @RequestBody CreateSessionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get a session by ID")
    public ResponseEntity<SessionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/sessions/code/{code}")
    @Operation(summary = "Get a session by session code")
    public ResponseEntity<SessionResponse> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(service.getByCode(code));
    }

    @GetMapping("/sessions/active")
    @Operation(summary = "List all active/waiting/created sessions")
    public ResponseEntity<List<SessionResponse>> getActive() {
        return ResponseEntity.ok(service.getActiveSessions());
    }

    @GetMapping("/sessions/patient/{mpiId}")
    @Operation(summary = "List all sessions for a patient")
    public ResponseEntity<Page<SessionResponse>> listForPatient(
            @PathVariable String mpiId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listForPatient(mpiId, page, size));
    }

    @GetMapping("/sessions/clinician/{clinicianId}")
    @Operation(summary = "List all sessions for a clinician")
    public ResponseEntity<Page<SessionResponse>> listForClinician(
            @PathVariable Long clinicianId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listForClinician(clinicianId, page, size));
    }

    @PatchMapping("/sessions/{id}/start")
    @Operation(summary = "Mark session as active (clinician has entered the room)")
    public ResponseEntity<SessionResponse> start(@PathVariable Long id) {
        return ResponseEntity.ok(service.start(id));
    }

    @PatchMapping("/sessions/{id}/end")
    @Operation(summary = "End a session and record duration")
    public ResponseEntity<SessionResponse> end(@PathVariable Long id) {
        return ResponseEntity.ok(service.end(id));
    }

    @PatchMapping("/sessions/{id}/cancel")
    @Operation(summary = "Cancel a session that hasn't started yet")
    public ResponseEntity<SessionResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    @PatchMapping("/sessions/{id}/toggle-bandwidth")
    @Operation(summary = "Toggle low-bandwidth mode and regenerate join URLs")
    public ResponseEntity<SessionResponse> toggleBandwidth(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleLowBandwidth(id));
    }

    /**
     * Public endpoint — patient clicks this link from their SMS.
     * Marks session as WAITING and redirects to the Jitsi room URL.
     * No authentication required.
     */
    @GetMapping("/join/{code}")
    @Operation(summary = "Patient join redirect — called from SMS link (public, no auth)")
    public RedirectView patientJoin(@PathVariable String code) {
        String jitsiUrl = service.patientJoin(code);
        RedirectView redirect = new RedirectView(jitsiUrl);
        redirect.setHttp10Compatible(false);
        return redirect;
    }
}
