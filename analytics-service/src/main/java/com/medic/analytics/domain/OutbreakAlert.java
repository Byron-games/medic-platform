package com.medic.analytics.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "outbreak_alerts")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OutbreakAlert {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "icd10_code", nullable = false, length = 10)
    private String icd10Code;

    @Column(name = "disease_name", nullable = false, length = 200)
    private String diseaseName;

    @Column(nullable = false, length = 100)
    private String region;

    @Column(name = "case_count", nullable = false)
    private int caseCount;

    @Column(nullable = false)
    private int threshold;

    @Column(name = "alert_level", nullable = false, length = 20)
    @Builder.Default
    private String alertLevel = "WARNING";   // WARNING | CRITICAL | EPIDEMIC

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "triggered_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime triggeredAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
