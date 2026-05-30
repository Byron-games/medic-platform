package com.medic.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Username is required") @Size(min = 3, max = 50) @Pattern(
                regexp = "^[a-zA-Z0-9._-]+$",
                message = "Username may only contain letters, numbers, dots, hyphens and underscores") String username,

        @NotBlank(message = "Password is required") @Size(min = 8, max = 72) String password) {
}
