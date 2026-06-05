package com.medic.emr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.emr.domain.VitalSigns;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record VitalSignsResponse(
    Long          id,
    LocalDateTime recordedAt,
    BigDecimal    temperatureC,
    Integer       pulseBpm,
    Integer       respiratoryRate,
    Integer       systolicBp,
    Integer       diastolicBp,
    BigDecimal    oxygenSatPct,
    BigDecimal    weightKg,
    BigDecimal    heightCm,
    BigDecimal    bmi,
    String        notes
) {
    public static VitalSignsResponse from(VitalSigns v) {
        return new VitalSignsResponse(
            v.getId(), v.getRecordedAt(),
            v.getTemperatureC(), v.getPulseBpm(), v.getRespiratoryRate(),
            v.getSystolicBp(), v.getDiastolicBp(), v.getOxygenSatPct(),
            v.getWeightKg(), v.getHeightCm(), v.getBmi(), v.getNotes()
        );
    }
}
