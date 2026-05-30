package com.medic.telemedicine.repository;

import com.medic.telemedicine.domain.SessionStatus;
import com.medic.telemedicine.domain.TelemedicineSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TelemedicineSessionRepository extends JpaRepository<TelemedicineSession, Long> {

    Optional<TelemedicineSession> findBySessionCode(String sessionCode);

    Page<TelemedicineSession> findByPatientMpiIdOrderByCreatedAtDesc(
        String patientMpiId, Pageable pageable);

    Page<TelemedicineSession> findByClinicianIdOrderByCreatedAtDesc(
        Long clinicianId, Pageable pageable);

    @Query("SELECT s FROM TelemedicineSession s WHERE s.status IN :statuses " +
           "ORDER BY s.createdAt DESC")
    List<TelemedicineSession> findByStatuses(@Param("statuses") List<SessionStatus> statuses);

    boolean existsBySessionCode(String sessionCode);

    Optional<TelemedicineSession> findByAppointmentId(Long appointmentId);
}
