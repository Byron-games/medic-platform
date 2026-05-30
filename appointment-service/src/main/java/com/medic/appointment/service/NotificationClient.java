package com.medic.appointment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * HTTP client for calling the Notification Service.
 *
 * Usage — inject and call in AppointmentService:
 *   notificationClient.sendAppointmentReminder(phone, name, dateStr, timeStr, lang);
 *
 * Failures are caught and logged — never propagated.
 * The core appointment workflow must not fail because an SMS failed.
 */
@Slf4j
@Component
public class NotificationClient {

    @Value("${services.notification-url:http://notification-service:8088}")
    private String notificationServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Sends an appointment reminder SMS.
     * Fire-and-forget — does not throw.
     */
    public void sendAppointmentReminder(
            String phone, String recipientName,
            String dateStr, String timeStr,
            String language, String appointmentId) {
        send(Map.of(
            "recipientPhone", phone,
            "recipientName",  recipientName != null ? recipientName : "",
            "messageType",    "APPOINTMENT_REMINDER",
            "message",        buildReminderMessage(dateStr, timeStr, language),
            "language",       language != null ? language : "EN",
            "referenceId",    appointmentId,
            "referenceType",  "APPOINTMENT"
        ));
    }

    /**
     * Notifies patient that their appointment was confirmed.
     */
    public void sendAppointmentConfirmed(
            String phone, String recipientName,
            String dateStr, String language, String appointmentId) {
        String msg = "FR".equalsIgnoreCase(language)
            ? "M.E.D.I.C.: Votre rendez-vous a été confirmé pour le " + dateStr + "."
            : "M.E.D.I.C.: Your appointment has been confirmed for " + dateStr + ".";

        send(Map.of(
            "recipientPhone", phone,
            "recipientName",  recipientName != null ? recipientName : "",
            "messageType",    "APPOINTMENT_CONFIRMED",
            "message",        msg,
            "language",       language != null ? language : "EN",
            "referenceId",    appointmentId,
            "referenceType",  "APPOINTMENT"
        ));
    }

    // ── Private ──────────────────────────────────────────

    private void send(Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            restTemplate.postForEntity(
                notificationServiceUrl + "/api/v1/notifications",
                request,
                String.class
            );
            log.debug("Notification queued for {}", body.get("recipientPhone"));
        } catch (Exception e) {
            // Never fail the core workflow because of a notification error
            log.warn("Failed to send notification to {}: {}",
                body.get("recipientPhone"), e.getMessage());
        }
    }

    private String buildReminderMessage(String dateStr, String timeStr, String language) {
        return "FR".equalsIgnoreCase(language)
            ? "M.E.D.I.C. Rappel: Vous avez un rendez-vous le " + dateStr + " à " + timeStr + ". Répondez STOP pour vous désabonner."
            : "M.E.D.I.C. Reminder: You have an appointment on " + dateStr + " at " + timeStr + ". Reply STOP to opt out.";
    }
}
