package com.medic.patient.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
    int           status,
    String        error,
    String        message,
    LocalDateTime timestamp,
    List<String>  details
) {
    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message, LocalDateTime.now(), null);
    }
    public static ApiError of(int status, String error, String message, List<String> details) {
        return new ApiError(status, error, message, LocalDateTime.now(), details);
    }
}
