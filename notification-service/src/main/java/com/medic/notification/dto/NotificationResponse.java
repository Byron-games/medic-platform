package com.medic.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.notification.domain.Notification;
import com.medic.notification.domain.NotificationStatus;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationResponse(
    Long               id,
    String             recipientPhone,
    String             recipientName,
    String             messageType,
    String             message,
    String             language,
    String             provider,
    NotificationStatus status,
    int                attempts,
    LocalDateTime      sentAt,
    String             errorMessage,
    String             referenceId,
    String             referenceType,
    LocalDateTime      createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
            n.getId(), n.getRecipientPhone(), n.getRecipientName(),
            n.getMessageType(), n.getMessage(), n.getLanguage(), n.getProvider(),
            n.getStatus(), n.getAttempts(), n.getSentAt(), n.getErrorMessage(),
            n.getReferenceId(), n.getReferenceType(), n.getCreatedAt()
        );
    }
}
