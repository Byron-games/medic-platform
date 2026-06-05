package com.medic.emr.dto;

import com.medic.emr.domain.RecordType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDateTime;

public record CreateRecordRequest(

    @NotBlank(message = "Patient MPI ID is required")
    String patientMpiId,

    RecordType recordType,   // defaults to SOAP if null

    @NotNull(message = "Visit date is required")
    @PastOrPresent(message = "Visit date cannot be in the future")
    LocalDateTime visitDate,

    @NotBlank(message = "Chief complaint is required")
    String chiefComplaint,

    // SOAP fields — all optional but encouraged
    String subjective,
    String objective,
    String assessment,
    String plan,

    /** ICD-10 diagnosis codes e.g. ["A09", "J06.9"] */
    String[] icd10Codes,

    /** Share this record across the M.E.D.I.C. network */
    boolean networkShared,

    /** Optional vitals to record at the same time */
    @Valid
    VitalSignsRequest vitals
) {}
