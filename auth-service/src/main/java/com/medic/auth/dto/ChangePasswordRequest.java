package com.medic.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required") @Size(min = 8,
                max = 72) String currentPassword,

        @NotBlank(message = "New password is required") @Size(min = 8, max = 72) @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&]).{8,}$",
                message = "Password must contain at least one letter, one number and one special character") String newPassword) {
}
