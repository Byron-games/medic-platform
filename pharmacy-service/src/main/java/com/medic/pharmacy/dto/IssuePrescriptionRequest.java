package com.medic.pharmacy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDateTime;
import java.util.List;

public record IssuePrescriptionRequest(

    @NotBlank(message = "Patient MPI ID is required")
    String patientMpiId,

    @NotEmpty(message = "At least one medication is required")
    @Valid
    List<MedicationItem> medications,

    String notes,

    /**
     * Prescription validity — defaults to 30 days if null.
     * Short expiry (e.g. 7 days) for controlled substances.
     */
    LocalDateTime expiresAt,

    /**
     * When true, issues the prescription even if drug interactions are detected.
     * The interaction warnings are still recorded on the prescription.
     */
    boolean forceIssue
) {}
