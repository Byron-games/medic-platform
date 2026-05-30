package com.medic.appointment.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_mpi_id", nullable = false, length = 20)
    private String patientMpiId;

    @Column(name = "clinician_id", nullable = false)
    private Long clinicianId;

    @Column(name = "clinician_name", nullable = false, length = 100)
    private String clinicianName;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(name = "facility_name", nullable = false, length = 100)
    private String facilityName;

    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_type", nullable = false, length = 20)
    @Builder.Default
    private AppointmentType appointmentType = AppointmentType.IN_PERSON;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private int durationMinutes = 30;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Set when status changes to CANCELLED */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by")
    private Long cancelledBy;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    /** Set when appointment is rescheduled — points to the new appointment */
    @Column(name = "rescheduled_to_id")
    private Long rescheduledToId;

    @Column(name = "booked_by", nullable = false)
    private Long bookedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** Convenience — returns end time of this appointment slot */
    @Transient
    public LocalDateTime getEndTime() {
        return scheduledAt.plusMinutes(durationMinutes);
    }

    @Transient
    public boolean isUpcoming() {
        return status == AppointmentStatus.SCHEDULED
            || status == AppointmentStatus.CONFIRMED;
    }

    @Transient
    public boolean isCancellable() {
        return status == AppointmentStatus.SCHEDULED
            || status == AppointmentStatus.CONFIRMED;
    }
}
