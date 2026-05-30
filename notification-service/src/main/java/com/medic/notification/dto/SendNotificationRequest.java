package com.medic.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SendNotificationRequest(
    @NotBlank(message = "Recipient phone is required")
    @Pattern(regexp = "^\\+?[0-9\\s\\-]{7,20}$", message = "Invalid phone number")
    String recipientPhone,

    String  recipientName,

    @NotBlank(message = "Message type is required")
    String  messageType,

    @NotBlank(message = "Message is required")
    String  message,

    String  language,       // EN | FR — defaults to EN
    String  referenceId,    // e.g. appointment ID, prescription Rx code
    String  referenceType   // APPOINTMENT | PRESCRIPTION | TELEMEDICINE
) {}
