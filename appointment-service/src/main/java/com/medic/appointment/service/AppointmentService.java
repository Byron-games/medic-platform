package com.medic.appointment.service;

import com.medic.appointment.domain.Appointment;
import com.medic.appointment.domain.AppointmentStatus;
import com.medic.appointment.domain.AppointmentType;
import com.medic.appointment.dto.*;
import com.medic.appointment.exception.AppointmentNotFoundException;
import com.medic.appointment.exception.ConflictException;
import com.medic.appointment.repository.AppointmentRepository;
import com.medic.appointment.security.RequestContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository repo;
    private final RequestContext         ctx;

    // ── Book ────────────────────────────────────────────

    @Transactional
    public AppointmentResponse book(BookAppointmentRequest req) {
        LocalDateTime end = req.scheduledAt().plusMinutes(
            req.durationMinutes() > 0 ? req.durationMinutes() : 30);

        // Conflict check — same clinician, overlapping time, not cancelled
        if (repo.hasConflict(req.clinicianId(), req.scheduledAt(), end, null)) {
            throw new ConflictException(
                "Clinician " + req.clinicianName() + " already has an appointment " +
                "overlapping " + req.scheduledAt() + ". Please choose a different time.");
        }

        String facilityId   = ctx.getFacilityId()   != null ? ctx.getFacilityId()   : "UNKNOWN";
        String facilityName = ctx.getFacilityName()  != null ? ctx.getFacilityName() : "Unknown";
        Long   bookedBy     = ctx.getUserId()        != null ? ctx.getUserId()       : 0L;

        Appointment appt = Appointment.builder()
            .patientMpiId(req.patientMpiId())
            .clinicianId(req.clinicianId())
            .clinicianName(req.clinicianName())
            .facilityId(facilityId)
            .facilityName(facilityName)
            .appointmentType(req.appointmentType() != null
                ? req.appointmentType() : AppointmentType.IN_PERSON)
            .status(AppointmentStatus.SCHEDULED)
            .scheduledAt(req.scheduledAt())
            .durationMinutes(req.durationMinutes() > 0 ? req.durationMinutes() : 30)
            .reason(req.reason())
            .notes(req.notes())
            .bookedBy(bookedBy)
            .build();

        repo.save(appt);
        log.info("Appointment booked: id={} patient={} clinician={} at={}",
            appt.getId(), req.patientMpiId(), req.clinicianName(), req.scheduledAt());

        return AppointmentResponse.from(appt);
    }

    // ── Get by ID ────────────────────────────────────────

    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        return AppointmentResponse.from(findOrThrow(id));
    }

    // ── List for patient ─────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> listForPatient(String mpiId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("scheduledAt").descending());
        return repo.findByPatientMpiIdOrderByScheduledAtDesc(mpiId, pageable)
            .map(AppointmentResponse::from);
    }

    /** Upcoming only (SCHEDULED or CONFIRMED, in the future) */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> upcomingForPatient(String mpiId) {
        return repo.findUpcomingForPatient(mpiId, LocalDateTime.now())
            .stream().map(AppointmentResponse::from).toList();
    }

    // ── Clinician schedule ───────────────────────────────

    @Transactional(readOnly = true)
    public List<AppointmentResponse> clinicianSchedule(
            Long clinicianId, LocalDateTime from, LocalDateTime to) {
        return repo.findClinicianSchedule(clinicianId, from, to)
            .stream().map(AppointmentResponse::from).toList();
    }

    // ── Facility schedule ────────────────────────────────

    @Transactional(readOnly = true)
    public List<AppointmentResponse> facilitySchedule(
            String facilityId, LocalDateTime from, LocalDateTime to) {
        return repo.findFacilitySchedule(facilityId, from, to)
            .stream().map(AppointmentResponse::from).toList();
    }

    // ── Confirm ──────────────────────────────────────────

    @Transactional
    public AppointmentResponse confirm(Long id) {
        Appointment appt = findOrThrow(id);
        if (appt.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new IllegalStateException(
                "Only SCHEDULED appointments can be confirmed. Current status: " + appt.getStatus());
        }
        appt.setStatus(AppointmentStatus.CONFIRMED);
        repo.save(appt);
        log.info("Appointment confirmed: id={}", id);
        return AppointmentResponse.from(appt);
    }

    // ── Start (mark IN_PROGRESS) ─────────────────────────

    @Transactional
    public AppointmentResponse start(Long id) {
        Appointment appt = findOrThrow(id);
        if (appt.getStatus() != AppointmentStatus.SCHEDULED
                && appt.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot start appointment with status: " + appt.getStatus());
        }
        appt.setStatus(AppointmentStatus.IN_PROGRESS);
        repo.save(appt);
        return AppointmentResponse.from(appt);
    }

    // ── Complete ─────────────────────────────────────────

    @Transactional
    public AppointmentResponse complete(Long id) {
        Appointment appt = findOrThrow(id);
        if (appt.getStatus() != AppointmentStatus.IN_PROGRESS
                && appt.getStatus() != AppointmentStatus.CONFIRMED
                && appt.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new IllegalStateException("Cannot complete appointment with status: " + appt.getStatus());
        }
        appt.setStatus(AppointmentStatus.COMPLETED);
        repo.save(appt);
        log.info("Appointment completed: id={}", id);
        return AppointmentResponse.from(appt);
    }

    // ── No-show ──────────────────────────────────────────

    @Transactional
    public AppointmentResponse markNoShow(Long id) {
        Appointment appt = findOrThrow(id);
        if (!appt.isUpcoming()) {
            throw new IllegalStateException("Cannot mark no-show for status: " + appt.getStatus());
        }
        appt.setStatus(AppointmentStatus.NO_SHOW);
        repo.save(appt);
        log.info("Appointment no-show: id={}", id);
        return AppointmentResponse.from(appt);
    }

    // ── Cancel ───────────────────────────────────────────

    @Transactional
    public AppointmentResponse cancel(Long id, CancelRequest req) {
        Appointment appt = findOrThrow(id);
        if (!appt.isCancellable()) {
            throw new IllegalStateException(
                "Cannot cancel appointment with status: " + appt.getStatus());
        }
        appt.setStatus(AppointmentStatus.CANCELLED);
        appt.setCancelledAt(LocalDateTime.now());
        appt.setCancelledBy(ctx.getUserId());
        appt.setCancellationReason(req != null ? req.reason() : null);
        repo.save(appt);
        log.info("Appointment cancelled: id={} by={} reason={}",
            id, ctx.getUsername(), req != null ? req.reason() : "—");
        return AppointmentResponse.from(appt);
    }

    // ── Reschedule ───────────────────────────────────────

    @Transactional
    public AppointmentResponse reschedule(Long id, RescheduleRequest req) {
        Appointment old = findOrThrow(id);
        if (!old.isCancellable()) {
            throw new IllegalStateException(
                "Cannot reschedule appointment with status: " + old.getStatus());
        }

        int duration = req.newDurationMinutes() != null
            ? req.newDurationMinutes() : old.getDurationMinutes();
        LocalDateTime newEnd = req.newScheduledAt().plusMinutes(duration);

        // Conflict check excluding the current appointment
        if (repo.hasConflict(old.getClinicianId(), req.newScheduledAt(), newEnd, id)) {
            throw new ConflictException(
                "The clinician has a conflicting appointment at the requested time.");
        }

        // Cancel the old one and create a new one (preserves history)
        old.setStatus(AppointmentStatus.RESCHEDULED);
        old.setCancelledAt(LocalDateTime.now());
        old.setCancelledBy(ctx.getUserId());
        old.setCancellationReason("Rescheduled: " + (req.reason() != null ? req.reason() : ""));

        Appointment newAppt = Appointment.builder()
            .patientMpiId(old.getPatientMpiId())
            .clinicianId(old.getClinicianId())
            .clinicianName(old.getClinicianName())
            .facilityId(old.getFacilityId())
            .facilityName(old.getFacilityName())
            .appointmentType(old.getAppointmentType())
            .status(AppointmentStatus.SCHEDULED)
            .scheduledAt(req.newScheduledAt())
            .durationMinutes(duration)
            .reason(old.getReason())
            .notes(req.reason() != null ? "Rescheduled from #" + id + ": " + req.reason() : old.getNotes())
            .bookedBy(ctx.getUserId())
            .build();

        repo.save(newAppt);
        old.setRescheduledToId(newAppt.getId());
        repo.save(old);

        log.info("Appointment rescheduled: old={} new={} by={}", id, newAppt.getId(), ctx.getUsername());
        return AppointmentResponse.from(newAppt);
    }

    // ── Stats ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public long countTotal(String mpiId) {
        return repo.countByPatientMpiId(mpiId);
    }

    @Transactional(readOnly = true)
    public long countUpcoming(String mpiId) {
        return repo.countByPatientMpiIdAndStatus(mpiId, AppointmentStatus.SCHEDULED)
             + repo.countByPatientMpiIdAndStatus(mpiId, AppointmentStatus.CONFIRMED);
    }

    // ── Private ──────────────────────────────────────────

    private Appointment findOrThrow(Long id) {
        return repo.findById(id)
            .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found: " + id));
    }
}
