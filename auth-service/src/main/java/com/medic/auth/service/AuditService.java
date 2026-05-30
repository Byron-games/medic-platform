package com.medic.auth.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.medic.auth.domain.AuditLog;
import com.medic.auth.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repo;

    @Async
    public void log(String eventType, String username, Long userId, boolean success, String detail,
            HttpServletRequest request) {
        String ip = extractIp(request);
        String ua = request.getHeader("User-Agent");

        repo.save(AuditLog.builder().eventType(eventType).username(username).userId(userId)
                .success(success).detail(detail).ipAddress(ip)
                .userAgent(ua != null && ua.length() > 255 ? ua.substring(0, 255) : ua).build());
    }

    private String extractIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank())
            return forwarded.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
