package com.medic.emr.security;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;

@Component
@RequestScope
@Getter
public class RequestContext {

    private final Long userId;
    private final String username;
    private final String role;
    private final String facilityId;
    private final String facilityName;
    private final String facilityRegion; // <-- added

    public RequestContext(HttpServletRequest request) {
        this.userId = parseLong(request.getHeader("X-User-Id"));
        this.username = header(request, "X-User-Name");
        this.role = header(request, "X-User-Role");
        this.facilityId = header(request, "X-Facility-Id");
        this.facilityName = header(request, "X-Facility-Name");
        this.facilityRegion = header(request, "X-Facility-Region"); // <-- added
    }

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isClinician() {
        return "CLINICIAN".equals(role);
    }

    private String header(HttpServletRequest req, String name) {
        String val = req.getHeader(name);
        return (val != null && !val.isBlank()) ? val : null;
    }

    private Long parseLong(String val) {
        try {
            return val != null ? Long.parseLong(val) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
