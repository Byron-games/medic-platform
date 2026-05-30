package com.medic.ussd.controller;

import com.medic.ussd.service.UssdMenuEngine;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/ussd")
@RequiredArgsConstructor
@Tag(name = "USSD", description = "Africa's Talking USSD gateway webhook — EN/FR feature-phone menus")
public class UssdController {

    private final UssdMenuEngine menuEngine;

    /**
     * Africa's Talking posts USSD events as form data to this endpoint.
     * The response must be plain text starting with CON (continue) or END (terminate).
     * Response must arrive within 5 seconds or the gateway times out.
     */
    @PostMapping(
        consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE,
        produces = MediaType.TEXT_PLAIN_VALUE
    )
    @Operation(summary = "Africa's Talking USSD webhook (receives form-encoded POST, returns plain text)")
    public ResponseEntity<String> handleUssd(
            @RequestParam String sessionId,
            @RequestParam String phoneNumber,
            @RequestParam(required = false, defaultValue = "") String text,
            @RequestParam(required = false, defaultValue = "") String serviceCode) {

        log.info("USSD webhook: session={} phone={} text='{}' service={}",
            sessionId, phoneNumber, text, serviceCode);

        String response = menuEngine.process(sessionId, phoneNumber, text, serviceCode);
        return ResponseEntity.ok(response);
    }

    /**
     * Test endpoint — simulates a USSD request with query params.
     * Useful for integration testing without the Africa's Talking gateway.
     */
    @GetMapping("/test")
    @Operation(summary = "Test USSD menu via GET request (dev only)")
    public ResponseEntity<String> testUssd(
            @RequestParam(defaultValue = "test-session-001") String sessionId,
            @RequestParam(defaultValue = "+237677000000") String phoneNumber,
            @RequestParam(defaultValue = "") String text) {
        String response = menuEngine.process(sessionId, phoneNumber, text, "*384#");
        return ResponseEntity.ok(response);
    }
}
