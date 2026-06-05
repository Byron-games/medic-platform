package com.medic.patient.dto;

import com.medic.patient.domain.Gender;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record CreatePatientRequest(

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    String firstName,

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    String lastName,

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    LocalDate dateOfBirth,

    @NotNull(message = "Gender is required")
    Gender gender,

    String nationalId,
    String bloodType,
    String phoneNumber,

    @Email(message = "Invalid email format")
    String email,

    String address,
    String region,
    String country,
    String primaryFacilityId,

    /** When true, registers even if a potential duplicate is found */
    boolean forceCreate
) {}
