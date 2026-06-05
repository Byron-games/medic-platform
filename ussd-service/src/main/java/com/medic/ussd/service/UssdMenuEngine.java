package com.medic.ussd.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import com.medic.ussd.domain.UssdSession;
import com.medic.ussd.repository.UssdSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UssdMenuEngine {

    private final UssdSessionRepository sessionRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.appointment-url:http://localhost:8083}")
    private String appointmentUrl;

    @Value("${services.pharmacy-url:http://localhost:8085}")
    private String pharmacyUrl;

    @Value("${services.patient-url:http://localhost:8081}")
    private String patientUrl;

    @Value("${services.analytics-url:http://localhost:8086}")
    private String analyticsUrl;

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ── Entry point ───────────────────────────────────────

    @Transactional
    public String process(String sessionId, String phoneNumber, String text, String serviceCode) {

        UssdSession session = sessionRepo.findBySessionId(sessionId).orElseGet(() -> {
            log.info("New USSD session: {} phone={}", sessionId, phoneNumber);
            return sessionRepo.save(UssdSession.builder().sessionId(sessionId)
                    .phoneNumber(phoneNumber).currentMenu("MAIN").language("EN")
                    .inputHistory(new String[0]).sessionData(new HashMap<>()).build());
        });

        String[] inputs = (text == null || text.isBlank()) ? new String[0] : text.split("\\*", -1);

        // Append latest input to history
        if (inputs.length > 0) {
            List<String> hist = new ArrayList<>(List.of(session.getInputHistory()));
            String last = inputs[inputs.length - 1].trim();
            if (!last.isEmpty())
                hist.add(last);
            session.setInputHistory(hist.toArray(new String[0]));
        }

        log.debug("USSD process: session={} phone={} inputs=[{}] lang={}", sessionId, phoneNumber,
                String.join(",", inputs), session.getLanguage());

        boolean fr = "FR".equals(session.getLanguage());
        String response = route(session, inputs, fr, phoneNumber);

        sessionRepo.save(session);
        return response;
    }

    // ── Router ────────────────────────────────────────────

    private String route(UssdSession session, String[] inputs, boolean fr, String phone) {
        int depth = inputs.length;

        // Root — show main menu
        if (depth == 0 || (depth == 1 && inputs[0].isBlank())) {
            return con(mainMenu(fr));
        }

        String L1 = inputs[0].trim();

        return switch (L1) {
            case "1" -> handleAppointments(session, inputs, fr, phone);
            case "2" -> handlePrescriptions(session, inputs, fr, phone);
            case "3" -> handlePatientInfo(session, inputs, fr, phone);
            case "4" -> handleHealthTips(session, inputs, fr);
            case "5" -> handleFindHospital(session, inputs, fr);
            case "6" -> handleEmergency(session, inputs, fr);
            case "7" -> handleLanguage(session, inputs, fr);
            case "0" -> {
                session.setStatus("ENDED");
                yield end(fr ? "Merci d'utiliser M.E.D.I.C. Restez en bonne santé!"
                        : "Thank you for using M.E.D.I.C. Stay healthy!");
            }
            default -> con(mainMenu(fr));
        };
    }

    // ── Main menu ─────────────────────────────────────────

    private String mainMenu(boolean fr) {
        return fr ? "M.E.D.I.C. Santé Cameroun\n" + "1. Mes Rendez-vous\n" + "2. Mes Ordonnances\n"
                + "3. Mon Dossier Médical\n" + "4. Conseils Santé\n" + "5. Trouver un Hôpital\n"
                + "6. Urgence / SOS\n" + "7. Langue\n" + "0. Quitter"
                : "M.E.D.I.C. Health Cameroon\n" + "1. My Appointments\n" + "2. My Prescriptions\n"
                        + "3. My Medical Record\n" + "4. Health Tips\n" + "5. Find a Hospital\n"
                        + "6. Emergency / SOS\n" + "7. Language\n" + "0. Exit";
    }

    // ── 1. Appointments ───────────────────────────────────

    private String handleAppointments(UssdSession session, String[] inputs, boolean fr,
            String phone) {
        int depth = inputs.length;

        if (depth == 1) {
            return con(fr
                    ? "Mes Rendez-vous:\n1. Prochain RDV\n2. Tous mes RDV\n3. Annuler un RDV\n0. Retour"
                    : "My Appointments:\n1. Next appointment\n2. All appointments\n3. Cancel appointment\n0. Back");
        }

        String L2 = inputs[1].trim();

        if ("0".equals(L2))
            return con(mainMenu(fr));

        if ("1".equals(L2)) {
            String result = fetchNextAppointment(phone, fr);
            return end(result);
        }

        if ("2".equals(L2)) {
            String result = fetchAllAppointments(phone, fr);
            return end(result);
        }

        if ("3".equals(L2)) {
            if (depth == 2) {
                return con(fr
                        ? "Entrez le code de votre rendez-vous\n(ex: APT-20260524-XXXXX)\n0. Retour"
                        : "Enter your appointment code\n(e.g. APT-20260524-XXXXX)\n0. Back");
            }
            if (depth == 3) {
                String code = inputs[2].trim().toUpperCase();
                if ("0".equals(code))
                    return con(mainMenu(fr));
                String result = cancelAppointment(code, fr);
                return end(result);
            }
        }

        return con(mainMenu(fr));
    }

    // ── 2. Prescriptions ──────────────────────────────────

    private String handlePrescriptions(UssdSession session, String[] inputs, boolean fr,
            String phone) {
        int depth = inputs.length;

        if (depth == 1) {
            return con(fr
                    ? "Mes Ordonnances:\n1. Ordonnances actives\n2. Chercher par code Rx\n3. Rappel collecte\n0. Retour"
                    : "My Prescriptions:\n1. Active prescriptions\n2. Look up Rx code\n3. Collection reminder\n0. Back");
        }

        String L2 = inputs[1].trim();

        if ("0".equals(L2))
            return con(mainMenu(fr));

        if ("1".equals(L2)) {
            return end(fetchActivePrescriptions(phone, fr));
        }

        if ("2".equals(L2)) {
            if (depth == 2) {
                return con(fr ? "Entrez votre code Rx\n(ex: RX-20260524-XXXXX)\n0. Retour"
                        : "Enter your Rx code\n(e.g. RX-20260524-XXXXX)\n0. Back");
            }
            if (depth == 3) {
                String rxCode = inputs[2].trim().toUpperCase();
                if ("0".equals(rxCode))
                    return con(mainMenu(fr));
                return end(fetchPrescriptionByCode(rxCode, fr));
            }
        }

        if ("3".equals(L2)) {
            return end(fr
                    ? "Rappel: Présentez votre code Rx à la pharmacie.\n"
                            + "La pharmacie vous contactera par SMS quand votre\n"
                            + "ordonnance est prête à être collectée."
                    : "Reminder: Present your Rx code at the pharmacy.\n"
                            + "The pharmacy will contact you by SMS when your\n"
                            + "prescription is ready for collection.");
        }

        return con(mainMenu(fr));
    }

    // ── 3. Patient info / Medical record ──────────────────

    private String handlePatientInfo(UssdSession session, String[] inputs, boolean fr,
            String phone) {
        int depth = inputs.length;

        if (depth == 1) {
            return con(fr
                    ? "Mon Dossier:\n1. Vérifier mon MPI\n2. Mes allergies\n3. Groupe sanguin\n4. Dernière consultation\n0. Retour"
                    : "My Record:\n1. Check my MPI code\n2. My allergies\n3. Blood type\n4. Last consultation\n0. Back");
        }

        String L2 = inputs[1].trim();
        if ("0".equals(L2))
            return con(mainMenu(fr));

        if ("1".equals(L2)) {
            String mpi = fetchMpiByPhone(phone, fr);
            return end(mpi);
        }

        if ("2".equals(L2)) {
            return end(fr
                    ? "Allergies enregistrées:\nConsultez votre médecin ou\nvisitez l'application M.E.D.I.C.\npour voir vos allergies complètes."
                    : "Registered allergies:\nConsult your doctor or\nvisit the M.E.D.I.C. app\nto view your complete allergy list.");
        }

        if ("3".equals(L2)) {
            return end(fetchBloodType(phone, fr));
        }

        if ("4".equals(L2)) {
            return end(fr
                    ? "Dernière consultation:\nConnectez-vous à l'application M.E.D.I.C.\npour voir vos consultations récentes."
                    : "Last consultation:\nLog in to the M.E.D.I.C. app\nto view your recent consultations.");
        }

        return con(mainMenu(fr));
    }

    // ── 4. Health tips ────────────────────────────────────

    private String handleHealthTips(UssdSession session, String[] inputs, boolean fr) {
        int depth = inputs.length;

        if (depth == 1) {
            return con(fr
                    ? "Conseils Santé:\n1. Prévention Paludisme\n2. Nutrition\n3. Maternité\n4. VIH/SIDA\n5. Hypertension\n0. Retour"
                    : "Health Tips:\n1. Malaria Prevention\n2. Nutrition\n3. Maternity\n4. HIV/AIDS\n5. Hypertension\n0. Back");
        }

        String L2 = inputs[1].trim();
        if ("0".equals(L2))
            return con(mainMenu(fr));

        String[] tipsEN = {
                "Malaria Prevention:\n- Sleep under insecticide-treated nets\n- Use mosquito repellent\n- Seek treatment within 24h of fever\n- Clear stagnant water near home",
                "Nutrition:\n- Eat 5 portions of fruit/veg daily\n- Drink 2L of clean water daily\n- Breastfeed exclusively for 6 months\n- Limit salt and fried foods",
                "Maternity:\n- Attend all 8 antenatal visits\n- Take iron and folic acid daily\n- Deliver at a health facility\n- Attend postnatal visits at 6 weeks",
                "HIV/AIDS:\n- Get tested — know your status\n- Use condoms consistently\n- If positive, start ART immediately\n- Prevent mother-to-child transmission",
                "Hypertension:\n- Check BP regularly\n- Reduce salt intake\n- Exercise 30 min/day\n- Take medication as prescribed\n- Avoid tobacco and alcohol",};
        String[] tipsFR = {
                "Prévention Paludisme:\n- Dormir sous moustiquaire imprégnée\n- Utiliser un répulsif anti-moustiques\n- Consulter dans les 24h en cas de fièvre\n- Éliminer les eaux stagnantes",
                "Nutrition:\n- Manger 5 portions fruits/légumes/jour\n- Boire 2L d'eau propre par jour\n- Allaitement exclusif pendant 6 mois\n- Limiter sel et aliments frits",
                "Maternité:\n- Effectuer les 8 visites prénatales\n- Prendre fer et acide folique quotidiennement\n- Accoucher dans un centre de santé\n- Visite postnatale à 6 semaines",
                "VIH/SIDA:\n- Faites-vous dépister — connaissez votre statut\n- Utilisez des préservatifs\n- Si positif, commencer ARV immédiatement\n- Prévenir la transmission mère-enfant",
                "Hypertension:\n- Contrôler la tension régulièrement\n- Réduire la consommation de sel\n- Faire 30 min d'exercice/jour\n- Prendre les médicaments prescrits\n- Éviter tabac et alcool",};

        try {
            int idx = Integer.parseInt(L2) - 1;
            if (idx >= 0 && idx < 5) {
                return end(fr ? tipsFR[idx] : tipsEN[idx]);
            }
        } catch (NumberFormatException ignored) {
        }

        return con(mainMenu(fr));
    }

    // ── 5. Find hospital ──────────────────────────────────

    private String handleFindHospital(UssdSession session, String[] inputs, boolean fr) {
        int depth = inputs.length;

        if (depth == 1) {
            return con(fr
                    ? "Trouver un Hôpital:\n1. Yaoundé\n2. Douala\n3. Bamenda\n4. Bafoussam\n5. Garoua\n6. Maroua\n7. Autres régions\n0. Retour"
                    : "Find a Hospital:\n1. Yaoundé\n2. Douala\n3. Bamenda\n4. Bafoussam\n5. Garoua\n6. Maroua\n7. Other regions\n0. Back");
        }

        String L2 = inputs[1].trim();
        if ("0".equals(L2))
            return con(mainMenu(fr));

        String[][] hospitalsEN = {
                {"Yaoundé Hospitals:", "1. Central Hospital\n   Tel: +237 222 230 462",
                        "2. CHUY (University)\n   Tel: +237 222 312 333",
                        "3. General Hospital\n   Tel: +237 222 230 010",},
                {"Douala Hospitals:", "1. General Hospital\n   Tel: +237 233 420 000",
                        "2. Laquintinie Hospital\n   Tel: +237 233 425 800",},
                {"Bamenda Hospitals:", "1. Regional Hospital\n   Tel: +237 233 362 040",},
                {"Bafoussam Hospitals:", "1. Regional Hospital\n   Tel: +237 233 445 200",},
                {"Garoua Hospitals:", "1. Regional Hospital\n   Tel: +237 222 271 060",},
                {"Maroua Hospitals:", "1. Regional Hospital\n   Tel: +237 222 291 206",},};

        try {
            int cityIdx = Integer.parseInt(L2) - 1;
            if (cityIdx >= 0 && cityIdx < hospitalsEN.length) {
                if (depth == 2) {
                    String[] hospitals = hospitalsEN[cityIdx];
                    StringBuilder menu = new StringBuilder(hospitals[0]).append("\n");
                    for (int i = 1; i < hospitals.length; i++) {
                        menu.append(i).append(". ").append(hospitals[i].split("\n")[0])
                                .append("\n");
                    }
                    menu.append("0. Back");
                    return con(menu.toString());
                }
                if (depth == 3) {
                    String L3 = inputs[2].trim();
                    if ("0".equals(L3))
                        return con(mainMenu(fr));
                    int hospIdx = Integer.parseInt(L3);
                    String[] hospitals = hospitalsEN[cityIdx];
                    if (hospIdx > 0 && hospIdx < hospitals.length) {
                        return end(hospitals[0] + "\n" + hospitals[hospIdx]);
                    }
                }
            }
            if (cityIdx == 6) { // Other regions
                return end(fr
                        ? "Autres hôpitaux régionaux:\n- Bertoua: +237 222 243 043\n- Ebolowa: +237 222 281 239\n- Limbé: +237 233 332 244\n- Ngaoundéré: +237 222 251 341\n- Kribi: +237 233 461 234"
                        : "Other regional hospitals:\n- Bertoua: +237 222 243 043\n- Ebolowa: +237 222 281 239\n- Limbe: +237 233 332 244\n- Ngaoundere: +237 222 251 341\n- Kribi: +237 233 461 234");
            }
        } catch (NumberFormatException ignored) {
        }

        return con(mainMenu(fr));
    }

    // ── 6. Emergency ──────────────────────────────────────

    private String handleEmergency(UssdSession session, String[] inputs, boolean fr) {
        // This is critical — respond immediately
        if (inputs.length == 1) {
            return con(fr
                    ? "URGENCE M.E.D.I.C.:\n1. Appeler SAMU (urgences)\n2. Appeler police\n3. Appeler pompiers\n4. Hôpital le plus proche\n5. Conseils premiers secours\n0. Retour"
                    : "EMERGENCY M.E.D.I.C.:\n1. Call SAMU (medical)\n2. Call Police\n3. Call Fire Brigade\n4. Nearest hospital\n5. First aid advice\n0. Back");
        }

        String L2 = inputs[1].trim();

        return switch (L2) {
            case "1" -> end(fr
                    ? "SAMU Cameroun:\nComposez le 15\nOu: +237 222 222 222\n\nEn cas d'urgence médicale:\n- Restez calme\n- Précisez votre localisation\n- Ne déplacez pas le blessé"
                    : "SAMU Cameroon:\nDial 15\nOr: +237 222 222 222\n\nIn medical emergency:\n- Stay calm\n- Give your location\n- Do not move injured person");
            case "2" -> end(
                    fr ? "Police Cameroun:\nComposez le 17\nBrigade Mobile: +237 222 221 700"
                            : "Police Cameroon:\nDial 17\nMobile Brigade: +237 222 221 700");
            case "3" -> end(fr
                    ? "Pompiers Cameroun:\nComposez le 18\nDouala: +237 233 407 744\nYaoundé: +237 222 231 000"
                    : "Fire Brigade Cameroon:\nDial 18\nDouala: +237 233 407 744\nYaoundé: +237 222 231 000");
            case "4" -> end(fr
                    ? "Hôpitaux d'urgence 24h/24:\nYaoundé: +237 222 230 462\nDouala: +237 233 420 000\nBamenda: +237 233 362 040\n\nPrésentez votre code MPI si disponible."
                    : "24/7 Emergency hospitals:\nYaoundé: +237 222 230 462\nDouala: +237 233 420 000\nBamenda: +237 233 362 040\n\nPresent your MPI code if available.");
            case "5" -> handleFirstAid(inputs, fr);
            case "0" -> con(mainMenu(fr));
            default -> con(mainMenu(fr));
        };
    }

    private String handleFirstAid(String[] inputs, boolean fr) {
        if (inputs.length == 2) {
            return con(fr
                    ? "Premiers Secours:\n1. Arrêt cardiaque (RCP)\n2. Étouffement\n3. Saignement grave\n4. Convulsions\n5. Morsure de serpent\n0. Retour"
                    : "First Aid:\n1. Cardiac arrest (CPR)\n2. Choking\n3. Severe bleeding\n4. Seizures\n5. Snakebite\n0. Back");
        }
        String L3 = inputs[2].trim();
        String[] tipsEN = {
                "CPR:\n1. Call 15 immediately\n2. 30 chest compressions (hard & fast)\n3. 2 rescue breaths\n4. Repeat until help arrives",
                "Choking:\n1. Ask: Are you choking?\n2. Give 5 back blows\n3. Give 5 abdominal thrusts\n4. Repeat until object dislodged\n5. Call 15 if unconscious",
                "Severe bleeding:\n1. Press firmly on wound\n2. Use clean cloth\n3. Keep pressure for 10 min\n4. Do NOT remove cloth\n5. Elevate limb\n6. Call 15",
                "Seizures:\n1. Clear the area\n2. Protect head\n3. Time the seizure\n4. Do NOT restrain\n5. Recovery position after\n6. Call 15 if >5 min",
                "Snakebite:\n1. Keep victim calm & still\n2. Immobilise bitten area\n3. Remove jewellery/watch\n4. Do NOT cut or suck bite\n5. Get to hospital FAST\n6. Note snake description",};
        try {
            int idx = Integer.parseInt(L3) - 1;
            if (idx >= 0 && idx < tipsEN.length)
                return end(tipsEN[idx]);
        } catch (NumberFormatException ignored) {
        }
        return con(mainMenu(fr));
    }

    // ── 7. Language ───────────────────────────────────────

    private String handleLanguage(UssdSession session, String[] inputs, boolean fr) {
        if (inputs.length == 1) {
            return con(fr ? "Choisir la langue:\n1. English\n2. Français\n0. Retour"
                    : "Choose language:\n1. English\n2. Français\n0. Back");
        }
        String L2 = inputs[1].trim();
        if ("1".equals(L2)) {
            session.setLanguage("EN");
            fr = false;
        }
        if ("2".equals(L2)) {
            session.setLanguage("FR");
            fr = true;
        }
        if ("0".equals(L2))
            return con(mainMenu(fr));
        return con((fr ? "Langue: Français\n\n" : "Language: English\n\n") + mainMenu(fr));
    }

    // ── External service calls ────────────────────────────

    private String fetchNextAppointment(String phone, boolean fr) {
        try {
            String url = appointmentUrl + "/api/v1/appointments/patient/phone/"
                    + phone.replace("+", "%2B") + "?status=CONFIRMED&size=1&page=0";
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> content =
                        (List<Map<String, Object>>) resp.getBody().get("content");
                if (content != null && !content.isEmpty()) {
                    Map<String, Object> a = content.get(0);
                    String date = formatDate((String) a.get("scheduledAt"));
                    String doctor = (String) a.get("clinicianName");
                    String facility = (String) a.get("facilityName");
                    String code = (String) a.get("appointmentCode");
                    return fr
                            ? "Prochain rendez-vous:\nDate: " + date + "\nMédecin: " + doctor
                                    + "\nClinique: " + facility + "\nCode: " + code
                                    + "\n\nAppelez le +237 000 000 pour modifier."
                            : "Next appointment:\nDate: " + date + "\nDoctor: " + doctor
                                    + "\nClinic: " + facility + "\nCode: " + code
                                    + "\n\nCall +237 000 000 to reschedule.";
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch appointment: {}", e.getMessage());
        }
        return fr
                ? "Aucun rendez-vous à venir.\nContactez votre clinique\nou visitez l'application M.E.D.I.C."
                : "No upcoming appointments.\nContact your clinic\nor visit the M.E.D.I.C. app.";
    }

    private String fetchAllAppointments(String phone, boolean fr) {
        try {
            String url = appointmentUrl + "/api/v1/appointments/patient/phone/"
                    + phone.replace("+", "%2B") + "?size=5&page=0";
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> content =
                        (List<Map<String, Object>>) resp.getBody().get("content");
                if (content != null && !content.isEmpty()) {
                    StringBuilder sb =
                            new StringBuilder(fr ? "Vos rendez-vous:\n" : "Your appointments:\n");
                    content.forEach(
                            a -> sb.append("- ").append(formatDate((String) a.get("scheduledAt")))
                                    .append(" | ").append(a.get("status")).append("\n"));
                    return sb.toString().trim();
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch appointments: {}", e.getMessage());
        }
        return fr ? "Aucun rendez-vous trouvé." : "No appointments found.";
    }

    private String cancelAppointment(String code, boolean fr) {
        try {
            String url = appointmentUrl + "/api/v1/appointments/code/" + code;
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return fr
                        ? "Annulation non disponible via USSD.\nAppellez votre clinique\nou visitez l'application M.E.D.I.C.\npour annuler le rendez-vous "
                                + code + "."
                        : "Cancellation via USSD not available.\nCall your clinic\nor use the M.E.D.I.C. app\nto cancel appointment "
                                + code + ".";
            }
        } catch (Exception e) {
            log.warn("Appointment lookup failed: {}", e.getMessage());
        }
        return fr ? "Code non trouvé: " + code + "\nVérifiez et réessayez."
                : "Code not found: " + code + "\nPlease verify and try again.";
    }

    private String fetchActivePrescriptions(String phone, boolean fr) {
        try {
            String url = pharmacyUrl + "/api/v1/pharmacy/prescriptions/patient/phone/"
                    + phone.replace("+", "%2B") + "/active";
            @SuppressWarnings("unchecked")
            ResponseEntity<List> resp = restTemplate.getForEntity(url, List.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> list = resp.getBody();
                if (!list.isEmpty()) {
                    StringBuilder sb =
                            new StringBuilder(fr ? "Ordonnances actives (" + list.size() + "):\n"
                                    : "Active prescriptions (" + list.size() + "):\n");
                    list.forEach(rx -> {
                        sb.append("Rx: ").append(rx.get("rxCode")).append(" | ")
                                .append(rx.get("status")).append("\n");
                    });
                    sb.append(fr ? "\nPrésentez le code Rx à la pharmacie."
                            : "\nPresent Rx code at the pharmacy.");
                    return sb.toString();
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch prescriptions: {}", e.getMessage());
        }
        return fr ? "Aucune ordonnance active.\nConsultez votre médecin si nécessaire."
                : "No active prescriptions.\nConsult your doctor if needed.";
    }

    private String fetchPrescriptionByCode(String rxCode, boolean fr) {
        try {
            String url = pharmacyUrl + "/api/v1/pharmacy/prescriptions/rx/" + rxCode;
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map<String, Object> rx = resp.getBody();
                String status = (String) rx.get("status");
                String doctor = (String) rx.get("clinicianName");
                String expires = formatDate((String) rx.get("expiresAt"));
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> meds = (List<Map<String, Object>>) rx.get("medications");
                StringBuilder sb = new StringBuilder();
                sb.append("Rx: ").append(rxCode).append("\n");
                sb.append(fr ? "Statut: " : "Status: ").append(status).append("\n");
                sb.append(fr ? "Médecin: " : "Doctor: ").append(doctor).append("\n");
                sb.append(fr ? "Expire: " : "Expires: ").append(expires).append("\n");
                if (meds != null && !meds.isEmpty()) {
                    sb.append(fr ? "Médicaments:\n" : "Medications:\n");
                    meds.forEach(m -> sb.append("- ").append(m.get("name")).append(" ")
                            .append(m.get("dosage")).append("\n"));
                }
                return sb.toString().trim();
            }
        } catch (Exception e) {
            log.warn("Rx lookup failed for {}: {}", rxCode, e.getMessage());
        }
        return fr ? "Ordonnance non trouvée: " + rxCode + "\nVérifiez le code et réessayez."
                : "Prescription not found: " + rxCode + "\nCheck the code and try again.";
    }

    private String fetchMpiByPhone(String phone, boolean fr) {
        try {
            String url = patientUrl + "/api/v1/patients/phone/" + phone.replace("+", "%2B");
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map<String, Object> p = resp.getBody();
                String mpi = (String) p.get("mpiId");
                String name = p.get("firstName") + " " + p.get("lastName");
                String dob = (String) p.get("dateOfBirth");
                return fr ? "Votre dossier M.E.D.I.C.:\nNom: " + name + "\nCode MPI: " + mpi
                        + "\nDDN: " + dob
                        + "\n\nConservez votre code MPI.\nIl vous identifie dans tout hôpital réseau."
                        : "Your M.E.D.I.C. record:\nName: " + name + "\nMPI code: " + mpi
                                + "\nDOB: " + dob
                                + "\n\nKeep your MPI code safe.\nIt identifies you at any network hospital.";
            }
        } catch (Exception e) {
            log.warn("Patient lookup failed for phone {}: {}", phone, e.getMessage());
        }
        return fr
                ? "Dossier non trouvé pour ce numéro.\nEnregistrez-vous à l'hôpital\nou visitez l'application M.E.D.I.C."
                : "No record found for this number.\nRegister at a hospital\nor visit the M.E.D.I.C. app.";
    }

    private String fetchBloodType(String phone, boolean fr) {
        try {
            String url = patientUrl + "/api/v1/patients/phone/" + phone.replace("+", "%2B");
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map<String, Object> p = resp.getBody();
                String bt = (String) p.get("bloodType");
                if (bt != null && !bt.isBlank()) {
                    return fr ? "Groupe sanguin enregistré: " + bt
                            + "\n\nPortez toujours cette information\nsur vous en cas d'urgence."
                            : "Registered blood type: " + bt
                                    + "\n\nAlways carry this information\nwith you for emergencies.";
                }
            }
        } catch (Exception e) {
            log.warn("Blood type lookup failed: {}", e.getMessage());
        }
        return fr
                ? "Groupe sanguin non enregistré.\nDemandez à votre médecin\nde mettre à jour votre dossier."
                : "Blood type not registered.\nAsk your doctor\nto update your record.";
    }

    // ── Helpers ───────────────────────────────────────────

    private String formatDate(String iso) {
        if (iso == null)
            return "—";
        try {
            LocalDateTime dt = LocalDateTime.parse(iso.replace("Z", "").replaceAll("\\.\\d+$", ""));
            return dt.format(DT_FMT);
        } catch (Exception e) {
            return iso.length() > 10 ? iso.substring(0, 10) : iso;
        }
    }

    private String con(String text) {
        return "CON " + text;
    }

    private String end(String text) {
        return "END " + text;
    }
}
