package com.medic.auth.dto;

import com.medic.auth.domain.Facility;

public record FacilityResponse(String facilityId, String name, String region, String city,
        String facilityType, String phone) {
    public static FacilityResponse from(Facility f) {
        return new FacilityResponse(f.getFacilityId(), f.getName(), f.getRegion(), f.getCity(),
                f.getFacilityType(), f.getPhone());
    }
}
