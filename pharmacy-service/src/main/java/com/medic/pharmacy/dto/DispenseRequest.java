package com.medic.pharmacy.dto;

import jakarta.validation.constraints.NotBlank;

public record DispenseRequest(
    @NotBlank(message = "Medication name is required")
    String medicationName,

    String quantityDispensed,
    String batchNumber,
    String expiryDate,   // ISO date string e.g. "2027-06-01"
    String notes
) {}
