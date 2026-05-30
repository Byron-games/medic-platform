package com.medic.pharmacy.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rx_code", unique = true, nullable = false, length = 20)
    private String rxCode;

    @Column(name = "patient_mpi_id", nullable = false, length = 20)
    private String patientMpiId;

    @Column(name = "clinician_id", nullable = false)
    private Long clinicianId;

    @Column(name = "clinician_name", nullable = false, length = 100)
    private String clinicianName;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PrescriptionStatus status = PrescriptionStatus.ISSUED;

    /**
     * Medications stored as JSONB array.
     * Each entry: { name, dosage, frequency, duration, quantity, instructions }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> medications;

    /**
     * Drug interaction warnings detected at issue time.
     * Each entry: { drug1, drug2, severity, description }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interaction_warnings", columnDefinition = "jsonb")
    private List<Map<String, Object>> interactionWarnings;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "issued_at", nullable = false)
    @Builder.Default
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "dispensed_at")
    private LocalDateTime dispensedAt;

    @Column(name = "dispensed_by")
    private Long dispensedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isDispensable() {
        return status == PrescriptionStatus.ISSUED
            || status == PrescriptionStatus.PARTIALLY_DISPENSED;
    }
}
