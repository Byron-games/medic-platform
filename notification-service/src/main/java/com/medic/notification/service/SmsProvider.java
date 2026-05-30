package com.medic.notification.service;

/**
 * Strategy interface for SMS providers.
 * Phase 1: Africa's Talking (primary for Cameroon) + stub fallback.
 * Phase 2: Add Twilio for international numbers.
 */
public interface SmsProvider {
    /**
     * Send an SMS message.
     * @return provider's message ID on success
     * @throws SmsException on delivery failure
     */
    String send(String phone, String message) throws SmsException;

    String providerName();
}
