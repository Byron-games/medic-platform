package com.medic.appointment.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * Defines when a clinician is available at a specific facility.
 * day_of_week follows ISO: 1=Monday … 7=Sunday.
 */
@Entity
@Table(name = "clinician_slots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicianSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinician_id", nullable = false)
    private Long clinicianId;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek;   // 1=MON, 7=SUN

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "slot_minutes", nullable = false)
    @Builder.Default
    private int slotMinutes = 30;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
