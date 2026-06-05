package com.medic.emr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vital_signs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VitalSigns {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    private MedicalRecord record;

    @Column(name = "recorded_at", nullable = false)
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();

    /** Body temperature in Celsius */
    @Column(name = "temperature_c", precision = 4, scale = 1)
    private BigDecimal temperatureC;

    /** Heart rate in beats per minute */
    @Column(name = "pulse_bpm")
    private Integer pulseBpm;

    @Column(name = "respiratory_rate")
    private Integer respiratoryRate;

    /** Systolic blood pressure (mmHg) */
    @Column(name = "systolic_bp")
    private Integer systolicBp;

    /** Diastolic blood pressure (mmHg) */
    @Column(name = "diastolic_bp")
    private Integer diastolicBp;

    /** Oxygen saturation percentage (SpO2) */
    @Column(name = "oxygen_sat_pct", precision = 5, scale = 2)
    private BigDecimal oxygenSatPct;

    @Column(name = "weight_kg", precision = 6, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "height_cm", precision = 5, scale = 1)
    private BigDecimal heightCm;

    /** BMI — calculated and stored for analytics */
    @Column(precision = 5, scale = 2)
    private BigDecimal bmi;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
