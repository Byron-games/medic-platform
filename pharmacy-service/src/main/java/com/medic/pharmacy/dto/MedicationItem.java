package com.medic.pharmacy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MedicationItem(
    @NotBlank(message = "Medication name is required")
    String name,

    @NotBlank(message = "Dosage is required")
    String dosage,

    @NotNull(message = "Frequency is required")
    String frequency,        // e.g. "twice daily", "every 8 hours"

    String duration,         // e.g. "5 days", "1 month"

    String quantity,         // e.g. "10 tablets", "1 bottle"

    String instructions      // e.g. "Take with food", "Do not crush"
) {}
