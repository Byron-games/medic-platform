package com.medic.patient.repository;

import com.medic.patient.domain.Gender;
import com.medic.patient.domain.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByMpiId(String mpiId);

    Optional<Patient> findByNationalId(String nationalId);

    boolean existsByNationalId(String nationalId);

    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT p FROM Patient p WHERE p.active = true " +
           "AND (LOWER(p.firstName) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "OR p.nationalId LIKE CONCAT('%', :term, '%') " +
           "OR p.phoneNumber LIKE CONCAT('%', :term, '%') " +
           "OR p.mpiId = :term) " +
           "ORDER BY p.lastName, p.firstName")
    Page<Patient> search(@Param("term") String term, Pageable pageable);

    @Query("SELECT p FROM Patient p WHERE p.active = true " +
           "AND LOWER(p.firstName) = LOWER(:firstName) " +
           "AND LOWER(p.lastName) = LOWER(:lastName) " +
           "AND p.dateOfBirth = :dob " +
           "AND p.gender = :gender")
    Optional<Patient> findDuplicate(
        @Param("firstName") String firstName,
        @Param("lastName")  String lastName,
        @Param("dob")       LocalDate dob,
        @Param("gender")    Gender gender
    );

    Page<Patient> findAllByActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Patient p JOIN p.facilityLinks fl " +
           "WHERE fl.facilityId = :facilityId AND fl.active = true AND p.active = true")
    Page<Patient> findByFacilityId(@Param("facilityId") String facilityId, Pageable pageable);
}
