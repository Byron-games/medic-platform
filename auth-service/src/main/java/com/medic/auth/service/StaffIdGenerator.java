package com.medic.auth.service;

import java.time.Year;
import org.springframework.stereotype.Component;
import com.medic.auth.domain.Role;
import com.medic.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;

/**
 * Generates staff IDs in the format: {FACILITY_CODE}-{ROLE_CODE}-{YEAR}-{SEQUENCE}
 *
 * Examples: YGH-DOC-2026-0001 (Yaoundé General Hospital, Doctor) BGH-NRS-2026-0003 (Bamenda General
 * Hospital, Nurse) FAC001-PHM-2026-0001 (generic facility code)
 */
@Component
@RequiredArgsConstructor
public class StaffIdGenerator {

    private final UserRepository userRepository;

    public String generate(String facilityId, Role role) {
        String facilityCode = buildFacilityCode(facilityId);
        String roleCode = roleCode(role);
        String year = String.valueOf(Year.now().getValue());
        int sequence = nextSequence(facilityId, role, year);

        return String.format("%s-%s-%s-%04d", facilityCode, roleCode, year, sequence);
    }

    private String buildFacilityCode(String facilityId) {
        if (facilityId == null || facilityId.isBlank())
            return "MED";
        // If facilityId already looks like a code (FAC-001), use first part
        String[] parts = facilityId.toUpperCase().replaceAll("[^A-Z0-9-]", "").split("-");
        if (parts.length >= 2 && parts[0].length() <= 5) {
            return parts[0] + (parts.length > 1 ? parts[1] : "");
        }
        // Otherwise take first 6 chars
        return facilityId.toUpperCase().replaceAll("[^A-Z0-9]", "").substring(0,
                Math.min(6, facilityId.length()));
    }

    private String roleCode(Role role) {
        return switch (role) {
            case ADMIN -> "ADM";
            case DOCTOR -> "DOC";
            case NURSE -> "NRS";
            case MIDWIFE -> "MWF";
            case LAB_TECHNICIAN -> "LAB";
            case RADIOLOGIST -> "RAD";
            case PHARMACIST -> "PHM";
            case RECEPTIONIST -> "RCP";
            case ANALYST -> "ANL";
            case FACILITY_ADMIN -> "FAD";
            case REGISTRAR -> "REG";
            case PENDING -> "PND";
        };
    }

    private int nextSequence(String facilityId, Role role, String year) {
        // Count existing users at this facility with this role in this year
        long count = userRepository.countByFacilityIdAndRoleAndStaffIdContaining(facilityId, role,
                "-" + year + "-");
        return (int) count + 1;
    }
}
