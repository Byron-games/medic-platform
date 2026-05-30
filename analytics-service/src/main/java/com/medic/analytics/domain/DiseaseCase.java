package com.medic.analytics.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "disease_cases")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DiseaseCase {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(nullable = false, length = 100)
    private String region;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(name = "icd10_code", nullable = false, length = 10)
    private String icd10Code;

    @Column(name = "disease_name", nullable = false, length = 200)
    private String diseaseName;

    @Column(name = "case_count", nullable = false)
    @Builder.Default
    private int caseCount = 1;

    @Column(length = 20)
    private String severity;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
