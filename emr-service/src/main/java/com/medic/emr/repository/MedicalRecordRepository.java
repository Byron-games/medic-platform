package com.medic.emr.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.medic.emr.domain.MedicalRecord;
import com.medic.emr.domain.RecordType;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    /** All records for a patient, newest first */
    Page<MedicalRecord> findByPatientMpiIdOrderByVisitDateDesc(String patientMpiId,
            Pageable pageable);

    /** Records by patient filtered by type */
    Page<MedicalRecord> findByPatientMpiIdAndRecordTypeOrderByVisitDateDesc(String patientMpiId,
            RecordType recordType, Pageable pageable);

    /** Records authored by a specific clinician */
    Page<MedicalRecord> findByClinicianIdOrderByVisitDateDesc(Long clinicianId, Pageable pageable);

    /** Records at a specific facility */
    Page<MedicalRecord> findByFacilityIdOrderByVisitDateDesc(String facilityId, Pageable pageable);

    /** Network-shared records within a date range — used by analytics */
    @Query("SELECT r FROM MedicalRecord r WHERE r.networkShared = true "
            + "AND r.visitDate BETWEEN :from AND :to ORDER BY r.visitDate DESC")
    List<MedicalRecord> findSharedInRange(@Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /** Count of records per patient */
    long countByPatientMpiId(String patientMpiId);

    /** Recent records for a patient (timeline view) */
    @Query("SELECT r FROM MedicalRecord r WHERE r.patientMpiId = :mpiId "
            + "ORDER BY r.visitDate DESC")
    List<MedicalRecord> findRecentByPatient(@Param("mpiId") String mpiId, Pageable pageable);
}
