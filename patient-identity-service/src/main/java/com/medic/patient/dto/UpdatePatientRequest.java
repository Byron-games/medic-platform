package com.medic.patient.dto;

import com.medic.patient.domain.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** All fields optional — only non-null values are applied (PATCH semantics) */
public record UpdatePatientRequest(
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,
                     LocalDate dateOfBirth,
                     Gender    gender,
                     String    nationalId,
                     String    bloodType,
                     String    phoneNumber,
    @Email           String    email,
                     String    address,
                     String    region,
                     String    country,
                     String    primaryFacilityId
) {}
