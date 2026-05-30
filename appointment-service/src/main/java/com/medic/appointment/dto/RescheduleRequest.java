package com.medic.appointment.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record RescheduleRequest(
    @NotNull @Future LocalDateTime newScheduledAt,
    Integer newDurationMinutes,
    String reason
) {}
