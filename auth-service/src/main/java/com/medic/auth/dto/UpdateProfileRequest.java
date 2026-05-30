package com.medic.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100) @Pattern(regexp = "^[\\p{L} .'-]+$",
                message = "Full name contains invalid characters") String fullName,

        @Email @Size(max = 100) String email,

        @Size(min = 7, max = 20) @Pattern(regexp = "^[+\\d\\s()\\-]*$",
                message = "Phone number contains invalid characters") String phoneNumber) {
}
