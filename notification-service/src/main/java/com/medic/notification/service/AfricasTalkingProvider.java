package com.medic.notification.service;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * Africa's Talking SMS provider. Active when africas-talking.api-key is set in application.yml.
 *
 * Africa's Talking has excellent Cameroon coverage and competitive pricing. Sandbox mode is free
 * for testing — set username=sandbox and use their simulator at
 * https://simulator.africastalking.com
 *
 * API docs: https://developers.africastalking.com/docs/sms/sending
 */
@Slf4j
@Service
@ConditionalOnExpression("!'${africas-talking.api-key:}'.isBlank()")
public class AfricasTalkingProvider implements SmsProvider {

    private static final String API_URL = "https://api.africastalking.com/version1/messaging";

    @Value("${africas-talking.api-key}")
    private String apiKey;

    @Value("${africas-talking.username:sandbox}")
    private String username;

    @Value("${africas-talking.sender-id:MEDIC}")
    private String senderId;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String send(String phone, String message) throws SmsException {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("apiKey", apiKey);
            headers.set("Accept", "application/json");

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("username", username);
            body.add("to", normalisePhone(phone));
            body.add("message", message);
            body.add("from", senderId);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, request, Map.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new SmsException("Africa's Talking returned: " + response.getStatusCode());
            }

            // Extract message ID from response
            @SuppressWarnings("unchecked")
            Map<String, Object> smsData =
                    (Map<String, Object>) response.getBody().get("SMSMessageData");
            if (smsData != null) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> recipients =
                        (java.util.List<Map<String, Object>>) smsData.get("Recipients");
                if (recipients != null && !recipients.isEmpty()) {
                    String status = (String) recipients.get(0).get("status");
                    if (!"Success".equals(status)) {
                        throw new SmsException("Delivery failed: " + status);
                    }
                    return (String) recipients.get(0).get("messageId");
                }
            }
            return "AT-" + System.currentTimeMillis();

        } catch (SmsException e) {
            throw e;
        } catch (Exception e) {
            throw new SmsException("Africa's Talking request failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String providerName() {
        return "AFRICAS_TALKING";
    }

    /** Normalise to E.164 format; Cameroon numbers start with +237 */
    private String normalisePhone(String phone) {
        String digits = phone.replaceAll("[^0-9+]", "");
        if (digits.startsWith("00"))
            digits = "+" + digits.substring(2);
        if (!digits.startsWith("+") && digits.startsWith("6"))
            digits = "+237" + digits;
        if (!digits.startsWith("+") && digits.startsWith("237"))
            digits = "+" + digits;
        return digits;
    }
}
