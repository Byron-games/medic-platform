package com.medic.auth.dto;

import com.medic.auth.domain.Role;
import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Email                   String email,
    @NotBlank @Size(min = 8, max = 72) String password,
    @NotBlank @Size(max = 100)         String fullName,
                                       Role   role,
                                       String facilityId,
                                       String facilityName
) {}
