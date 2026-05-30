package com.medic.notification.repository;

import com.medic.notification.domain.Notification;
import com.medic.notification.domain.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientPhoneOrderByCreatedAtDesc(String phone, Pageable pageable);

    List<Notification> findByStatusAndAttemptsLessThanOrderByCreatedAtAsc(
        NotificationStatus status, int maxAttempts);

    @Query("SELECT n FROM Notification n WHERE n.status = 'FAILED' AND n.attempts < 3")
    List<Notification> findRetryable();

    long countByReferenceIdAndReferenceType(String referenceId, String referenceType);
}
