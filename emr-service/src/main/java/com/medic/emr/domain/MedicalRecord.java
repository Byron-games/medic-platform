package com.medic.emr.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medical_records")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** References Patient Identity Service — not a FK (cross-service boundary) */
    @Column(name = "patient_mpi_id", nullable = false, length = 20)
    private String patientMpiId;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_type", nullable = false, length = 50)
    @Builder.Default
    private RecordType recordType = RecordType.SOAP;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(name = "facility_name", nullable = false, length = 100)
    private String facilityName;

    @Column(name = "clinician_id", nullable = false)
    private Long clinicianId;

    @Column(name = "clinician_name", nullable = false, length = 100)
    private String clinicianName;

    @Column(name = "visit_date", nullable = false)
    private LocalDateTime visitDate;

    // ── SOAP note fields ────────────────────────────────

    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    /** Subjective: patient-reported symptoms */
    @Column(columnDefinition = "TEXT")
    private String subjective;

    /** Objective: clinician observations and examination findings */
    @Column(columnDefinition = "TEXT")
    private String objective;

    /** Assessment: diagnoses and clinical impression */
    @Column(columnDefinition = "TEXT")
    private String assessment;

    /** Plan: treatment, referrals, follow-up */
    @Column(columnDefinition = "TEXT")
    private String plan;

    /** ICD-10 diagnosis codes — stored as a Postgres text array */
    @Column(name = "icd10_codes", columnDefinition = "TEXT[]")
    private String[] icd10Codes;

    /**
     * When true, this record is shared across the M.E.D.I.C. network
     * so other facilities and the analytics service can see it.
     */
    @Column(name = "network_shared", nullable = false)
    @Builder.Default
    private boolean networkShared = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "record", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VitalSigns> vitalSigns = new ArrayList<>();
}
