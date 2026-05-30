package com.medic.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAdminRequest(@NotBlank @Size(min = 3, max = 50) @Pattern(
                regexp = "^[a-zA-Z0-9._-]+$",
                message = "Username may only contain letters, numbers, dots, hyphens and underscores") String username,

                @NotBlank @Email @Size(max = 100) String email,

                @NotBlank @Size(min = 8, max = 72) @Pattern(
                                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&]).{8,}$",
                                message = "Password must contain at least one letter, one number and one special character") String password,

                @NotBlank @Size(max = 100) @Pattern(regexp = "^[\\p{L} .'-]+$",
                                message = "Full name contains invalid characters") String fullName,

                @Size(max = 50) String facilityId,

                @Size(max = 100) @Pattern(regexp = "^[\\p{L} .'-]+$",
                                message = "Facility name contains invalid characters") String facilityName) {
}
