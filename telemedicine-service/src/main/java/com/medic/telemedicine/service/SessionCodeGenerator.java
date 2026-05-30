package com.medic.telemedicine.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Generates unique telemedicine session codes.
 *
 * Format: TELE-YYYYMMDD-XXXXX
 * Example: TELE-20260521-K9R3T
 *
 * This code is shared with the patient via SMS so they can
 * join from a feature phone browser or be read over the phone.
 * Characters are chosen to avoid visual ambiguity (no 0/O/I/1).
 */
@Component
public class SessionCodeGenerator {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int    SUFFIX_LEN = 5;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    public String generate() {
        String date   = LocalDate.now().format(DATE_FMT);
        String suffix = randomSuffix();
        return "TELE-" + date + "-" + suffix;
    }

    private String randomSuffix() {
        StringBuilder sb = new StringBuilder(SUFFIX_LEN);
        for (int i = 0; i < SUFFIX_LEN; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
