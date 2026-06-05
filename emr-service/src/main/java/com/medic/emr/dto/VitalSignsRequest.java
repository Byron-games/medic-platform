package com.medic.emr.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public record VitalSignsRequest(

    @DecimalMin("34.0") @DecimalMax("42.0")
    BigDecimal temperatureC,

    @Min(30) @Max(300)
    Integer pulseBpm,

    @Min(5) @Max(60)
    Integer respiratoryRate,

    @Min(50) @Max(300)
    Integer systolicBp,

    @Min(30) @Max(200)
    Integer diastolicBp,

    @DecimalMin("50.0") @DecimalMax("100.0")
    BigDecimal oxygenSatPct,

    @DecimalMin("1.0") @DecimalMax("500.0")
    BigDecimal weightKg,

    @DecimalMin("20.0") @DecimalMax("250.0")
    BigDecimal heightCm,

    String notes
) {}
