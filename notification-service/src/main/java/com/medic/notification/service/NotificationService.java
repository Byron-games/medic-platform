package com.medic.notification.service;

import com.medic.notification.domain.Notification;
import com.medic.notification.domain.NotificationStatus;
import com.medic.notification.dto.NotificationResponse;
import com.medic.notification.dto.SendNotificationRequest;
import com.medic.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@EnableAsync
@EnableScheduling
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;
    private final SmsProvider            smsProvider;

    // ── Message templates ────────────────────────────────

    private static final Map<String, String> TEMPLATES_EN = Map.of(
        "APPOINTMENT_REMINDER",
            "M.E.D.I.C. Reminder: You have an appointment on %s at %s. Reply STOP to opt out.",
        "PRESCRIPTION_READY",
            "M.E.D.I.C.: Your prescription (Rx: %s) is ready for collection at %s.",
        "TELEMEDICINE_INVITE",
            "M.E.D.I.C.: Your video consultation is ready. Join using code: %s or visit %s",
        "APPOINTMENT_CONFIRMED",
            "M.E.D.I.C.: Your appointment has been confirmed for %s.",
        "APPOINTMENT_CANCELLED",
            "M.E.D.I.C.: Your appointment on %s has been cancelled. Contact us to reschedule."
    );

    private static final Map<String, String> TEMPLATES_FR = Map.of(
        "APPOINTMENT_REMINDER",
            "M.E.D.I.C. Rappel: Vous avez un rendez-vous le %s à %s. Répondez STOP pour vous désabonner.",
        "PRESCRIPTION_READY",
            "M.E.D.I.C.: Votre ordonnance (Rx: %s) est prête à être collectée à %s.",
        "TELEMEDICINE_INVITE",
            "M.E.D.I.C.: Votre consultation vidéo est prête. Rejoignez avec le code: %s ou visitez %s",
        "APPOINTMENT_CONFIRMED",
            "M.E.D.I.C.: Votre rendez-vous a été confirmé pour le %s.",
        "APPOINTMENT_CANCELLED",
            "M.E.D.I.C.: Votre rendez-vous du %s a été annulé. Contactez-nous pour reprogrammer."
    );

    // ── Send ─────────────────────────────────────────────

    @Transactional
    public NotificationResponse send(SendNotificationRequest req) {
        Notification notification = Notification.builder()
            .recipientPhone(req.recipientPhone())
            .recipientName(req.recipientName())
            .messageType(req.messageType())
            .message(req.message())
            .language(req.language() != null ? req.language() : "EN")
            .provider(smsProvider.providerName())
            .status(NotificationStatus.PENDING)
            .referenceId(req.referenceId())
            .referenceType(req.referenceType())
            .build();

        repo.save(notification);

        // Send asynchronously so the API returns immediately
        sendAsync(notification.getId());

        return NotificationResponse.from(notification);
    }

    // ── Template helper ──────────────────────────────────

    @Transactional
    public NotificationResponse sendFromTemplate(
            String phone, String recipientName, String messageType,
            String language, String referenceId, String referenceType,
            Object... templateArgs) {

        Map<String, String> templates = "FR".equalsIgnoreCase(language)
            ? TEMPLATES_FR : TEMPLATES_EN;

        String template = templates.getOrDefault(messageType,
            "M.E.D.I.C.: You have a new notification.");
        String message = templateArgs.length > 0
            ? String.format(template, templateArgs) : template;

        return send(new SendNotificationRequest(
            phone, recipientName, messageType, message,
            language, referenceId, referenceType));
    }

    // ── Async delivery ───────────────────────────────────

    @Async
    @Transactional
    public void sendAsync(Long notificationId) {
        Notification notification = repo.findById(notificationId).orElse(null);
        if (notification == null) return;

        deliver(notification);
    }

    // ── Retry job — runs every 5 minutes ────────────────

    @Scheduled(fixedDelay = 300_000)
    @Transactional
    public void retryFailed() {
        List<Notification> retryable = repo.findRetryable();
        if (!retryable.isEmpty()) {
            log.info("Retrying {} failed notification(s)", retryable.size());
            retryable.forEach(this::deliver);
        }
    }

    // ── Get by ID ────────────────────────────────────────

    @Transactional(readOnly = true)
    public NotificationResponse getById(Long id) {
        return repo.findById(id)
            .map(NotificationResponse::from)
            .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
    }

    // ── History for a phone number ───────────────────────

    @Transactional(readOnly = true)
    public Page<NotificationResponse> historyFor(String phone, int page, int size) {
        return repo.findByRecipientPhoneOrderByCreatedAtDesc(
            phone, PageRequest.of(page, size)).map(NotificationResponse::from);
    }

    // ── Private delivery logic ───────────────────────────

    private void deliver(Notification notification) {
        notification.setStatus(NotificationStatus.SENDING);
        notification.setAttempts(notification.getAttempts() + 1);
        notification.setLastAttemptAt(LocalDateTime.now());
        repo.save(notification);

        try {
            String referenceId = smsProvider.send(
                notification.getRecipientPhone(), notification.getMessage());
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            notification.setReferenceId(referenceId);
            log.info("SMS sent: id={} phone={} type={} provider={}",
                notification.getId(), notification.getRecipientPhone(),
                notification.getMessageType(), smsProvider.providerName());
        } catch (SmsException e) {
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            log.warn("SMS failed: id={} phone={} attempt={} error={}",
                notification.getId(), notification.getRecipientPhone(),
                notification.getAttempts(), e.getMessage());
        }
        repo.save(notification);
    }
}
