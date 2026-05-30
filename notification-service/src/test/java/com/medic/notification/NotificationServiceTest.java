package com.medic.notification;

import com.medic.notification.domain.Notification;
import com.medic.notification.domain.NotificationStatus;
import com.medic.notification.dto.NotificationResponse;
import com.medic.notification.dto.SendNotificationRequest;
import com.medic.notification.repository.NotificationRepository;
import com.medic.notification.service.NotificationService;
import com.medic.notification.service.SmsProvider;
import com.medic.notification.service.SmsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository repo;
    @Mock SmsProvider            smsProvider;

    @InjectMocks NotificationService service;

    private Notification savedNotification;

    @BeforeEach
    void setUp() {
        when(smsProvider.providerName()).thenReturn("STUB");

        savedNotification = Notification.builder()
            .id(1L)
            .recipientPhone("+237677000000")
            .recipientName("Marie Dupont")
            .messageType("APPOINTMENT_REMINDER")
            .message("You have an appointment tomorrow at 10:00")
            .language("EN")
            .provider("STUB")
            .status(NotificationStatus.PENDING)
            .attempts(0)
            .createdAt(LocalDateTime.now())
            .build();

        when(repo.save(any())).thenReturn(savedNotification);
        when(repo.findById(1L)).thenReturn(Optional.of(savedNotification));
    }

    @Test
    void send_shouldPersistNotificationAndReturnPending() {
        SendNotificationRequest req = new SendNotificationRequest(
            "+237677000000", "Marie Dupont",
            "APPOINTMENT_REMINDER",
            "You have an appointment tomorrow at 10:00",
            "EN", "APT-001", "APPOINTMENT"
        );

        NotificationResponse response = service.send(req);

        assertThat(response.recipientPhone()).isEqualTo("+237677000000");
        assertThat(response.messageType()).isEqualTo("APPOINTMENT_REMINDER");
        verify(repo).save(any(Notification.class));
    }

    @Test
    void send_withFrenchLanguage_shouldPersistWithFR() {
        SendNotificationRequest req = new SendNotificationRequest(
            "+237677000001", "Jean Dupont",
            "APPOINTMENT_REMINDER",
            "Vous avez un rendez-vous demain à 10h00",
            "FR", "APT-002", "APPOINTMENT"
        );

        when(repo.save(any())).thenAnswer(i -> {
            Notification n = i.getArgument(0);
            assertThat(n.getLanguage()).isEqualTo("FR");
            return savedNotification;
        });

        service.send(req);
        verify(repo).save(any());
    }

    @Test
    void sendFromTemplate_EN_shouldFormatMessage() {
        when(repo.save(any())).thenAnswer(i -> {
            Notification n = i.getArgument(0);
            // Message should contain the formatted template args
            assertThat(n.getMessage()).contains("Monday 25 May");
            assertThat(n.getMessageType()).isEqualTo("APPOINTMENT_REMINDER");
            return savedNotification;
        });

        service.sendFromTemplate(
            "+237677000000", "Marie", "APPOINTMENT_REMINDER",
            "EN", "APT-003", "APPOINTMENT",
            "Monday 25 May", "10:00 AM"
        );

        verify(repo).save(any());
    }

    @Test
    void sendFromTemplate_FR_shouldUseFrencTemplate() {
        when(repo.save(any())).thenAnswer(i -> {
            Notification n = i.getArgument(0);
            assertThat(n.getMessage()).contains("Rappel");  // French template
            return savedNotification;
        });

        service.sendFromTemplate(
            "+237677000000", "Jean", "APPOINTMENT_REMINDER",
            "FR", "APT-004", "APPOINTMENT",
            "lundi 25 mai", "10h00"
        );
        verify(repo).save(any());
    }

    @Test
    void sendAsync_onSmsSuccess_shouldMarkSent() throws Exception {
        savedNotification.setStatus(NotificationStatus.PENDING);
        when(repo.findById(1L)).thenReturn(Optional.of(savedNotification));
        when(smsProvider.send(anyString(), anyString())).thenReturn("AT-MSG-12345");
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        service.sendAsync(1L);

        verify(smsProvider).send(eq("+237677000000"), anyString());
        assertThat(savedNotification.getStatus()).isEqualTo(NotificationStatus.SENT);
        assertThat(savedNotification.getReferenceId()).isEqualTo("AT-MSG-12345");
    }

    @Test
    void sendAsync_onSmsFailure_shouldMarkFailed() throws Exception {
        savedNotification.setStatus(NotificationStatus.PENDING);
        when(repo.findById(1L)).thenReturn(Optional.of(savedNotification));
        when(smsProvider.send(anyString(), anyString()))
            .thenThrow(new SmsException("Network timeout"));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        service.sendAsync(1L);

        assertThat(savedNotification.getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(savedNotification.getErrorMessage()).contains("Network timeout");
        assertThat(savedNotification.getAttempts()).isEqualTo(1);
    }

    @Test
    void stubProvider_shouldLogAndReturnId() throws Exception {
        com.medic.notification.service.StubSmsProvider stub =
            new com.medic.notification.service.StubSmsProvider();

        String id = stub.send("+237677000000", "Test message");

        assertThat(id).startsWith("STUB-");
        assertThat(stub.providerName()).isEqualTo("STUB");
    }
}
