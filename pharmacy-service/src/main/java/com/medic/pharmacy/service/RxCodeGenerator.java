package com.medic.pharmacy.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Generates unique prescription (Rx) codes.
 *
 * Format: RX-YYYYMMDD-NNNNN
 * Example: RX-20260521-K9R3T
 *
 * The code is printed on the prescription label
 * and used by pharmacy staff to look up the record.
 */
@Component
public class RxCodeGenerator {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int    SUFFIX_LEN = 5;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    public String generate() {
        String date   = LocalDate.now().format(DATE_FMT);
        String suffix = randomSuffix();
        return "RX-" + date + "-" + suffix;
    }

    private String randomSuffix() {
        StringBuilder sb = new StringBuilder(SUFFIX_LEN);
        for (int i = 0; i < SUFFIX_LEN; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
