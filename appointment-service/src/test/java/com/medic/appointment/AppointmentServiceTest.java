package com.medic.appointment;

import com.medic.appointment.domain.Appointment;
import com.medic.appointment.domain.AppointmentStatus;
import com.medic.appointment.domain.AppointmentType;
import com.medic.appointment.dto.*;
import com.medic.appointment.exception.AppointmentNotFoundException;
import com.medic.appointment.exception.ConflictException;
import com.medic.appointment.repository.AppointmentRepository;
import com.medic.appointment.security.RequestContext;
import com.medic.appointment.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock AppointmentRepository repo;
    @Mock RequestContext         ctx;

    @InjectMocks AppointmentService service;

    private Appointment existingAppt;
    private LocalDateTime futureTime;

    @BeforeEach
    void setUp() {
        futureTime = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0);

        existingAppt = Appointment.builder()
            .id(1L)
            .patientMpiId("MPI-20260520-ABCDE")
            .clinicianId(42L)
            .clinicianName("Dr. Smith")
            .facilityId("FAC-001")
            .facilityName("Yaoundé General")
            .appointmentType(AppointmentType.IN_PERSON)
            .status(AppointmentStatus.SCHEDULED)
            .scheduledAt(futureTime)
            .durationMinutes(30)
            .reason("Follow-up malaria")
            .bookedBy(1L)
            .build();
    }

    @Test
    void book_withNoConflict_shouldCreateAppointment() {
        when(repo.hasConflict(anyLong(), any(), any(), any())).thenReturn(false);
        when(ctx.getFacilityId()).thenReturn("FAC-001");
        when(ctx.getFacilityName()).thenReturn("Yaoundé General");
        when(ctx.getUserId()).thenReturn(1L);
        when(repo.save(any())).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            return Appointment.builder()
                .id(1L).patientMpiId(a.getPatientMpiId())
                .clinicianId(a.getClinicianId()).clinicianName(a.getClinicianName())
                .facilityId(a.getFacilityId()).facilityName(a.getFacilityName())
                .appointmentType(a.getAppointmentType()).status(a.getStatus())
                .scheduledAt(a.getScheduledAt()).durationMinutes(a.getDurationMinutes())
                .reason(a.getReason()).bookedBy(a.getBookedBy()).build();
        });

        BookAppointmentRequest req = new BookAppointmentRequest(
            "MPI-20260520-ABCDE", 42L, "Dr. Smith",
            AppointmentType.IN_PERSON, futureTime, 30,
            "Malaria follow-up", null
        );

        AppointmentResponse response = service.book(req);

        assertThat(response.patientMpiId()).isEqualTo("MPI-20260520-ABCDE");
        assertThat(response.clinicianName()).isEqualTo("Dr. Smith");
        assertThat(response.status()).isEqualTo(AppointmentStatus.SCHEDULED);
        verify(repo).save(any());
    }

    @Test
    void book_withConflict_shouldThrowConflictException() {
        when(repo.hasConflict(eq(42L), any(), any(), any())).thenReturn(true);

        BookAppointmentRequest req = new BookAppointmentRequest(
            "MPI-20260520-ABCDE", 42L, "Dr. Smith",
            AppointmentType.IN_PERSON, futureTime, 30,
            "Follow-up", null
        );

        assertThatThrownBy(() -> service.book(req))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("Dr. Smith");
    }

    @Test
    void confirm_scheduledAppointment_shouldSetConfirmed() {
        when(repo.findById(1L)).thenReturn(Optional.of(existingAppt));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        AppointmentResponse response = service.confirm(1L);

        assertThat(response.status()).isEqualTo(AppointmentStatus.CONFIRMED);
    }

    @Test
    void confirm_alreadyCompleted_shouldThrowIllegalState() {
        existingAppt.setStatus(AppointmentStatus.COMPLETED);
        when(repo.findById(1L)).thenReturn(Optional.of(existingAppt));

        assertThatThrownBy(() -> service.confirm(1L))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("COMPLETED");
    }

    @Test
    void cancel_scheduledAppointment_shouldSetCancelled() {
        when(repo.findById(1L)).thenReturn(Optional.of(existingAppt));
        when(ctx.getUserId()).thenReturn(1L);
        when(ctx.getUsername()).thenReturn("dr.smith");
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        AppointmentResponse response = service.cancel(1L, new CancelRequest("Patient request"));

        assertThat(response.status()).isEqualTo(AppointmentStatus.CANCELLED);
        assertThat(response.cancellationReason()).isEqualTo("Patient request");
    }

    @Test
    void cancel_completedAppointment_shouldThrowIllegalState() {
        existingAppt.setStatus(AppointmentStatus.COMPLETED);
        when(repo.findById(1L)).thenReturn(Optional.of(existingAppt));

        assertThatThrownBy(() -> service.cancel(1L, null))
            .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void reschedule_withNoConflict_shouldCreateNewAppointment() {
        when(repo.findById(1L)).thenReturn(Optional.of(existingAppt));
        LocalDateTime newTime = futureTime.plusDays(1);
        when(repo.hasConflict(eq(42L), eq(newTime), any(), eq(1L))).thenReturn(false);
        when(ctx.getUserId()).thenReturn(1L);
        when(ctx.getUsername()).thenReturn("receptionist");
        when(repo.save(any())).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            if (a.getId() == null) {
                return Appointment.builder().id(99L)
                    .patientMpiId(a.getPatientMpiId()).clinicianId(a.getClinicianId())
                    .clinicianName(a.getClinicianName()).facilityId(a.getFacilityId())
                    .facilityName(a.getFacilityName()).appointmentType(a.getAppointmentType())
                    .status(AppointmentStatus.SCHEDULED).scheduledAt(a.getScheduledAt())
                    .durationMinutes(a.getDurationMinutes()).reason(a.getReason())
                    .bookedBy(a.getBookedBy()).build();
            }
            return a;
        });

        AppointmentResponse newAppt = service.reschedule(1L,
            new RescheduleRequest(newTime, null, "Patient request"));

        assertThat(newAppt.scheduledAt()).isEqualTo(newTime);
        assertThat(newAppt.status()).isEqualTo(AppointmentStatus.SCHEDULED);
    }

    @Test
    void getById_notFound_shouldThrow() {
        when(repo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(999L))
            .isInstanceOf(AppointmentNotFoundException.class);
    }
}
