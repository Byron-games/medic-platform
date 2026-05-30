package com.medic.auth.dto;

import com.medic.auth.domain.User;

public record UserSummary(Long id, String username, String fullName, String email, String staffId,
        String role, String requestedRole, String accountStatus, String facilityId,
        String facilityName) {
    public static UserSummary from(User u) {
        return new UserSummary(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(),
                u.getStaffId(), u.getRole().name(),
                u.getRequestedRole() != null ? u.getRequestedRole().name() : null,
                u.getAccountStatus().name(), u.getFacilityId(), u.getFacilityName());
    }
}
