package com.medic.notification.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/**
 * Stub SMS provider — active when no real provider is configured. Logs messages to console instead
 * of sending real SMSes. Safe for local development and CI pipelines.
 */
@Slf4j
@Service
@ConditionalOnExpression("'${africas-talking.api-key:}'.isBlank()")
public class StubSmsProvider implements SmsProvider {

    @Override
    public String send(String phone, String message) {
        String id = "STUB-" + System.currentTimeMillis();
        log.info("╔══ [STUB SMS] ══════════════════════════════════");
        log.info("║  To:      {}", phone);
        log.info("║  Message: {}", message);
        log.info("║  ID:      {}", id);
        log.info("╚═══════════════════════════════════════════════");
        return id;
    }

    @Override
    public String providerName() {
        return "STUB";
    }
}
