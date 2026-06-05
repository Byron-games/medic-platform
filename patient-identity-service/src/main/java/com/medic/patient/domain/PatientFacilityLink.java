package com.medic.patient.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "patient_facility_links")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientFacilityLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_mpi_id", nullable = false, length = 20)
    private String patientMpiId;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(name = "facility_name", nullable = false, length = 100)
    private String facilityName;

    @Column(name = "linked_by")
    private Long linkedBy;

    @Column(name = "linked_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime linkedAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
