package com.medic.notification.controller;

import com.medic.notification.dto.NotificationResponse;
import com.medic.notification.dto.SendNotificationRequest;
import com.medic.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "SMS delivery via Africa's Talking with EN/FR templates")
public class NotificationController {

    private final NotificationService service;

    @PostMapping
    @Operation(summary = "Send an SMS notification immediately")
    public ResponseEntity<NotificationResponse> send(
            @Valid @RequestBody SendNotificationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.send(req));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get notification status by ID")
    public ResponseEntity<NotificationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/phone/{phone}")
    @Operation(summary = "Get notification history for a phone number")
    public ResponseEntity<Page<NotificationResponse>> historyFor(
            @PathVariable String phone,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.historyFor(phone, page, size));
    }
}
