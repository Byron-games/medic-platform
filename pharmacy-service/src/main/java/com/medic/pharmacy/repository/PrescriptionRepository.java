package com.medic.pharmacy.repository;

import com.medic.pharmacy.domain.Prescription;
import com.medic.pharmacy.domain.PrescriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByRxCode(String rxCode);

    boolean existsByRxCode(String rxCode);

    Page<Prescription> findByPatientMpiIdOrderByIssuedAtDesc(
        String patientMpiId, Pageable pageable);

    Page<Prescription> findByFacilityIdOrderByIssuedAtDesc(
        String facilityId, Pageable pageable);

    Page<Prescription> findByStatusOrderByIssuedAtDesc(
        PrescriptionStatus status, Pageable pageable);

    /** Active prescriptions for a patient (ISSUED or PARTIALLY_DISPENSED) */
    @Query("SELECT p FROM Prescription p WHERE p.patientMpiId = :mpiId " +
           "AND p.status IN ('ISSUED', 'PARTIALLY_DISPENSED') " +
           "ORDER BY p.issuedAt DESC")
    List<Prescription> findActiveForPatient(@Param("mpiId") String mpiId);

    /** Prescriptions expiring within the next N hours */
    @Query("SELECT p FROM Prescription p WHERE p.status = 'ISSUED' " +
           "AND p.expiresAt IS NOT NULL " +
           "AND p.expiresAt BETWEEN :now AND :threshold " +
           "ORDER BY p.expiresAt ASC")
    List<Prescription> findExpiringSoon(
        @Param("now")       LocalDateTime now,
        @Param("threshold") LocalDateTime threshold);

    long countByPatientMpiIdAndStatus(String patientMpiId, PrescriptionStatus status);
}
