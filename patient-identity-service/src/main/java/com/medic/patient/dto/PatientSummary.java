package com.medic.patient.dto;

import com.medic.patient.domain.Gender;
import com.medic.patient.domain.Patient;

import java.time.LocalDate;
import java.time.Period;

/** Lightweight projection used in search results and paginated list endpoints */
public record PatientSummary(
    String    mpiId,
    String    fullName,
    String    firstName,
    String    lastName,
    LocalDate dateOfBirth,
    int       age,
    Gender    gender,
    String    phoneNumber,
    String    nationalId,
    String    primaryFacilityId
) {
    public static PatientSummary from(Patient p) {
        int age = Period.between(p.getDateOfBirth(), LocalDate.now()).getYears();
        return new PatientSummary(
            p.getMpiId(), p.getFullName(), p.getFirstName(), p.getLastName(),
            p.getDateOfBirth(), age, p.getGender(),
            p.getPhoneNumber(), p.getNationalId(), p.getPrimaryFacilityId()
        );
    }
}
