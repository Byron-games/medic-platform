package com.medic.ussd;

import com.medic.ussd.domain.UssdSession;
import com.medic.ussd.repository.UssdSessionRepository;
import com.medic.ussd.service.UssdMenuEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UssdMenuEngineTest {

    @Mock UssdSessionRepository repo;
    @InjectMocks UssdMenuEngine engine;

    private UssdSession newSession;

    @BeforeEach
    void setUp() {
        newSession = UssdSession.builder()
            .sessionId("sess-001")
            .phoneNumber("+237677000000")
            .currentMenu("MAIN")
            .language("EN")
            .inputHistory(new String[0])
            .build();

        when(repo.findBySessionId(anyString())).thenReturn(Optional.empty());
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void emptyText_shouldReturnMainMenuCON() {
        String response = engine.process("sess-001", "+237677000000", "", "*384#");

        assertThat(response).startsWith("CON");
        assertThat(response).containsIgnoringCase("appointment");
        assertThat(response).containsIgnoringCase("prescription");
    }

    @Test
    void selectAppointments_shouldReturnAppointmentSubMenu() {
        String response = engine.process("sess-001", "+237677000000", "1", "*384#");

        assertThat(response).startsWith("CON");
        assertThat(response).containsIgnoringCase("appointment");
        assertThat(response).contains("0");  // back option
    }

    @Test
    void selectPrescriptions_shouldReturnPrescriptionSubMenu() {
        String response = engine.process("sess-001", "+237677000000", "2", "*384#");

        assertThat(response).startsWith("CON");
        assertThat(response).containsIgnoringCase("prescription");
    }

    @Test
    void selectExit_shouldReturnEND() {
        String response = engine.process("sess-001", "+237677000000", "0", "*384#");

        assertThat(response).startsWith("END");
        assertThat(response).containsIgnoringCase("thank");
    }

    @Test
    void selectNextAppointment_shouldReturnEND() {
        String response = engine.process("sess-001", "+237677000000", "1*1", "*384#");

        assertThat(response).startsWith("END");
        assertThat(response).containsIgnoringCase("appointment");
    }

    @Test
    void selectLanguageFrench_menuShouldSwitchToFrench() {
        // Navigate to language menu then select FR
        String response = engine.process("sess-001", "+237677000000", "4*2", "*384#");

        assertThat(response).startsWith("CON");
        // After selecting French, main menu should be in French
        assertThat(response).containsIgnoringCase("rendez-vous");
    }

    @Test
    void selectFindClinic_shouldShowFacilities() {
        String response = engine.process("sess-001", "+237677000000", "3", "*384#");

        assertThat(response).startsWith("CON");
        assertThat(response).containsIgnoringCase("hospital");
    }

    @Test
    void selectSpecificClinic_shouldReturnContactInfo() {
        String response = engine.process("sess-001", "+237677000000", "3*1", "*384#");

        assertThat(response).startsWith("END");
        assertThat(response).contains("+237");  // Cameroonian phone number
    }

    @Test
    void existingSession_shouldLoadFromRepo() {
        UssdSession existing = UssdSession.builder()
            .sessionId("existing-sess")
            .phoneNumber("+237677000001")
            .currentMenu("MAIN")
            .language("FR")
            .inputHistory(new String[0])
            .build();

        when(repo.findBySessionId("existing-sess")).thenReturn(Optional.of(existing));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        String response = engine.process("existing-sess", "+237677000001", "1", "*384#");

        assertThat(response).startsWith("CON");
        // Should be in French since session language is FR
        assertThat(response).containsIgnoringCase("rendez-vous");
    }
}
