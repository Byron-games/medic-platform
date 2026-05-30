package com.medic.appointment.repository;

import com.medic.appointment.domain.Appointment;
import com.medic.appointment.domain.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Page<Appointment> findByPatientMpiIdOrderByScheduledAtDesc(
        String patientMpiId, Pageable pageable);

    Page<Appointment> findByClinicianIdOrderByScheduledAtAsc(
        Long clinicianId, Pageable pageable);

    Page<Appointment> findByFacilityIdOrderByScheduledAtAsc(
        String facilityId, Pageable pageable);

    /** Upcoming appointments for a patient */
    @Query("SELECT a FROM Appointment a WHERE a.patientMpiId = :mpiId " +
           "AND a.scheduledAt >= :from " +
           "AND a.status IN ('SCHEDULED', 'CONFIRMED') " +
           "ORDER BY a.scheduledAt ASC")
    List<Appointment> findUpcomingForPatient(
        @Param("mpiId") String mpiId,
        @Param("from")  LocalDateTime from);

    /** Clinician schedule for a date range — used to detect conflicts */
    @Query("SELECT a FROM Appointment a WHERE a.clinicianId = :clinicianId " +
           "AND a.scheduledAt BETWEEN :from AND :to " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "ORDER BY a.scheduledAt ASC")
    List<Appointment> findClinicianSchedule(
        @Param("clinicianId") Long clinicianId,
        @Param("from")        LocalDateTime from,
        @Param("to")          LocalDateTime to);

    /** All appointments at a facility on a given day */
    @Query("SELECT a FROM Appointment a WHERE a.facilityId = :facilityId " +
           "AND a.scheduledAt BETWEEN :from AND :to " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "ORDER BY a.scheduledAt ASC")
    List<Appointment> findFacilitySchedule(
        @Param("facilityId") String facilityId,
        @Param("from")       LocalDateTime from,
        @Param("to")         LocalDateTime to);

    /** Conflict check: does this clinician have an overlapping appointment? */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
           "WHERE a.clinicianId = :clinicianId " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND a.scheduledAt < :end " +
           "AND FUNCTION('TIMESTAMPADD', MINUTE, a.durationMinutes, a.scheduledAt) > :start " +
           "AND (:excludeId IS NULL OR a.id <> :excludeId)")
    boolean hasConflict(
        @Param("clinicianId") Long clinicianId,
        @Param("start")       LocalDateTime start,
        @Param("end")         LocalDateTime end,
        @Param("excludeId")   Long excludeId);

    long countByPatientMpiId(String patientMpiId);

    long countByPatientMpiIdAndStatus(String patientMpiId, AppointmentStatus status);
}
