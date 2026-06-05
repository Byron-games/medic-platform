package com.medic.patient.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Generates unique Master Patient Index (MPI) identifiers.
 *
 * Format: MPI-YYYYMMDD-XXXXX
 *   MPI      = fixed prefix
 *   YYYYMMDD = registration date
 *   XXXXX    = 5 alphanumeric characters (no 0/O/I/1 ambiguity)
 *
 * Example: MPI-20260520-K3R9T
 */
@Component
public class MpiIdGenerator {

    // Exclude visually ambiguous characters: 0, O, I, 1
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int SUFFIX_LEN = 5;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    public String generate() {
        String date   = LocalDate.now().format(DATE_FMT);
        String suffix = randomSuffix();
        return "MPI-" + date + "-" + suffix;
    }

    private String randomSuffix() {
        StringBuilder sb = new StringBuilder(SUFFIX_LEN);
        for (int i = 0; i < SUFFIX_LEN; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
