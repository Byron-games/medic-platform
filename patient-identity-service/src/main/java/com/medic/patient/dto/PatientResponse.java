package com.medic.patient.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.patient.domain.Gender;
import com.medic.patient.domain.Patient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PatientResponse(
    Long          id,
    String        mpiId,
    String        nationalId,
    String        firstName,
    String        lastName,
    String        fullName,
    LocalDate     dateOfBirth,
    int           age,
    Gender        gender,
    String        bloodType,
    String        phoneNumber,
    String        email,
    String        address,
    String        region,
    String        country,
    String        primaryFacilityId,
    boolean       active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static PatientResponse from(Patient p) {
        int age = Period.between(p.getDateOfBirth(), LocalDate.now()).getYears();
        return new PatientResponse(
            p.getId(), p.getMpiId(), p.getNationalId(),
            p.getFirstName(), p.getLastName(), p.getFullName(),
            p.getDateOfBirth(), age, p.getGender(), p.getBloodType(),
            p.getPhoneNumber(), p.getEmail(), p.getAddress(),
            p.getRegion(), p.getCountry(), p.getPrimaryFacilityId(),
            p.isActive(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
