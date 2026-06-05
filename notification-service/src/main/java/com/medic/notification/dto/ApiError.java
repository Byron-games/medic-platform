package com.medic.notification.dto;

import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(int status, String error, String message, LocalDateTime timestamp,
        List<String> details) {
    // Existing 3-parameter factory method
    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message, LocalDateTime.now(), null);
    }

    // 🚀 ADD THIS NEW 4-PARAMETER OVERLOAD:
    public static ApiError of(int status, String error, String message, List<String> details) {
        return new ApiError(status, error, message, LocalDateTime.now(), details);
    }
}
