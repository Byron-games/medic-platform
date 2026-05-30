package com.medic.ussd.service;

import com.medic.ussd.domain.UssdSession;
import com.medic.ussd.repository.UssdSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;

/**
 * USSD Menu Engine for M.E.D.I.C.
 *
 * Africa's Talking USSD gateway sends:
 *   - sessionId   : unique per call
 *   - phoneNumber : caller's MSISDN
 *   - text        : all inputs joined by * (e.g. "1*2*3")
 *   - serviceCode : registered USSD code (e.g. *384#)
 *
 * Response format:
 *   CON <text>  — continue session (show menu)
 *   END <text>  — end session (final message)
 *
 * Menu tree (EN):
 *   MAIN:       1. My Appointments  2. My Prescriptions  3. Find Facility  4. Language  0. Exit
 *   APPT:       1. Next appointment 2. All appointments  0. Back
 *   PRESCR:     1. Active prescriptions  2. Collect reminder  0. Back
 *   LANGUAGE:   1. English  2. Français  0. Back
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UssdMenuEngine {

    private final UssdSessionRepository sessionRepo;

    @Transactional
    public String process(String sessionId, String phoneNumber, String text, String serviceCode) {

        // Get or create session
        UssdSession session = sessionRepo.findBySessionId(sessionId).orElseGet(() -> {
            UssdSession s = UssdSession.builder()
                .sessionId(sessionId)
                .phoneNumber(phoneNumber)
                .currentMenu("MAIN")
                .language("EN")
                .build();
            return sessionRepo.save(s);
        });

        log.debug("USSD: session={} phone={} text='{}' menu={}",
            sessionId, phoneNumber, text, session.getCurrentMenu());

        // Parse the full input chain
        String[] inputs = text == null || text.isEmpty() ? new String[0] : text.split("\\*");

        // The current input is the last element
        String currentInput = inputs.length > 0 ? inputs[inputs.length - 1].trim() : "";

        // Update input history
        List<String> history = new ArrayList<>(List.of(session.getInputHistory()));
        if (!currentInput.isEmpty()) history.add(currentInput);
        session.setInputHistory(history.toArray(new String[0]));

        boolean isFR = "FR".equals(session.getLanguage());

        // Route based on full input path
        String response = routeMenu(session, inputs, isFR);

        sessionRepo.save(session);
        return response;
    }

    private String routeMenu(UssdSession session, String[] inputs, boolean fr) {
        int depth = inputs.length;

        // Depth 0 or empty = main menu
        if (depth == 0 || (depth == 1 && inputs[0].isEmpty())) {
            return con(mainMenu(fr));
        }

        String first = inputs[0];

        // Language toggle — depth 1 = "4", depth 2 = language choice
        if ("4".equals(first)) {
            if (depth == 1) {
                return con(fr
                    ? "Choisissez votre langue:\n1. English\n2. Français\n0. Retour"
                    : "Choose your language:\n1. English\n2. Français\n0. Back");
            }
            if (depth == 2) {
                if ("1".equals(inputs[1])) { session.setLanguage("EN"); fr = false; }
                if ("2".equals(inputs[1])) { session.setLanguage("FR"); fr = true; }
                if ("0".equals(inputs[1])) { return con(mainMenu(fr)); }
                return con((fr ? "Langue définie sur " : "Language set to ")
                    + (fr ? "Français" : "English") + ".\n\n" + mainMenu(fr));
            }
        }

        // Exit
        if ("0".equals(first)) {
            session.setStatus("ENDED");
            return end(fr
                ? "Merci d'utiliser M.E.D.I.C. Au revoir!"
                : "Thank you for using M.E.D.I.C. Goodbye!");
        }

        // Appointments — option 1
        if ("1".equals(first)) {
            if (depth == 1) {
                return con(fr
                    ? "Mes Rendez-vous:\n1. Prochain rendez-vous\n2. Tous les rendez-vous\n0. Retour"
                    : "My Appointments:\n1. Next appointment\n2. All appointments\n0. Back");
            }
            if (depth == 2) {
                if ("0".equals(inputs[1])) return con(mainMenu(fr));
                if ("1".equals(inputs[1])) {
                    // In production this would call the appointment service
                    return end(fr
                        ? "Votre prochain rendez-vous:\nAucun rendez-vous prévu.\nVisitez notre clinique ou appelez le +237 000 000."
                        : "Your next appointment:\nNo upcoming appointments.\nVisit our clinic or call +237 000 000.");
                }
                if ("2".equals(inputs[1])) {
                    return end(fr
                        ? "Consultez vos rendez-vous sur l'application M.E.D.I.C. ou appelez votre clinique."
                        : "View all appointments on the M.E.D.I.C. app or call your clinic.");
                }
            }
        }

        // Prescriptions — option 2
        if ("2".equals(first)) {
            if (depth == 1) {
                return con(fr
                    ? "Mes Ordonnances:\n1. Ordonnances actives\n2. Rappel de collecte\n0. Retour"
                    : "My Prescriptions:\n1. Active prescriptions\n2. Collection reminder\n0. Back");
            }
            if (depth == 2) {
                if ("0".equals(inputs[1])) return con(mainMenu(fr));
                if ("1".equals(inputs[1])) {
                    return end(fr
                        ? "Ordonnances actives:\nConsultez l'application M.E.D.I.C. ou présentez-vous à la pharmacie avec votre code Rx."
                        : "Active prescriptions:\nVisit the M.E.D.I.C. app or present your Rx code at the pharmacy.");
                }
                if ("2".equals(inputs[1])) {
                    return end(fr
                        ? "Votre pharmacie vous contactera par SMS lorsque votre ordonnance sera prête."
                        : "Your pharmacy will contact you by SMS when your prescription is ready.");
                }
            }
        }

        // Find facility — option 3
        if ("3".equals(first)) {
            if (depth == 1) {
                return con(fr
                    ? "Trouver une clinique:\n1. Hôpital Central Yaoundé\n2. Hôpital Général Douala\n3. CHUY\n0. Retour"
                    : "Find a clinic:\n1. Yaounde Central Hospital\n2. Douala General Hospital\n3. CHUY\n0. Back");
            }
            if (depth == 2) {
                if ("0".equals(inputs[1])) return con(mainMenu(fr));
                String[] facilities = {
                    fr ? "Hôpital Central Yaoundé\nTél: +237 222 230 462\nAv. Henri Dunant, Yaoundé"
                       : "Yaounde Central Hospital\nTel: +237 222 230 462\nAv. Henri Dunant, Yaoundé",
                    fr ? "Hôpital Général Douala\nTél: +237 233 420 000\nBoul. de la Liberté, Douala"
                       : "Douala General Hospital\nTel: +237 233 420 000\nBoul. de la Liberté, Douala",
                    fr ? "CHUY Yaoundé\nTél: +237 222 312 333\nRue Joseph Mballa Elounden"
                       : "CHUY Yaoundé\nTel: +237 222 312 333\nRue Joseph Mballa Elounden"
                };
                int idx = Integer.parseInt(inputs[1]) - 1;
                if (idx >= 0 && idx < facilities.length) {
                    return end(facilities[idx]);
                }
            }
        }

        // Default: back to main
        return con(mainMenu(fr));
    }

    private String mainMenu(boolean fr) {
        return fr
            ? "M.E.D.I.C. Santé\n1. Mes rendez-vous\n2. Mes ordonnances\n3. Trouver clinique\n4. Langue\n0. Quitter"
            : "M.E.D.I.C. Health\n1. My appointments\n2. My prescriptions\n3. Find a clinic\n4. Language\n0. Exit";
    }

    private String con(String text)  { return "CON " + text; }
    private String end(String text)  { return "END " + text; }
}
