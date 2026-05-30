package com.medic.auth.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.medic.auth.domain.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUsernameOrderByOccurredAtDesc(String username, Pageable pageable);

    Page<AuditLog> findByEventTypeOrderByOccurredAtDesc(String eventType, Pageable pageable);
}
