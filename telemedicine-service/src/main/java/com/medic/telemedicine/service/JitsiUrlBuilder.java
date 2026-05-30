package com.medic.telemedicine.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Constructs Jitsi Meet join URLs for clinicians and patients.
 *
 * Low-bandwidth mode appends URL fragment config to hint Jitsi to:
 *   - Start with video off (startWithVideoMuted=true)
 *   - Cap resolution to 240 (constraints)
 *   - Disable screenshare (disableScreensharing=true)
 *   - Enable audio-only toggle (enableAudioOnlyMode=true)
 *
 * These are client-side hints — Jitsi applies them in the browser,
 * so no server-side Jitsi configuration is required for Phase 1.
 *
 * In Phase 2, when we run our own Jitsi instance, we can add
 * prosody-based JWT authentication for the moderator (clinician) role.
 */
@Component
public class JitsiUrlBuilder {

    @Value("${jitsi.server-url:https://meet.jit.si}")
    private String jitsiServerUrl;

    @Value("${app.base-url:http://localhost:8084}")
    private String appBaseUrl;

    /**
     * URL for the clinician — starts with mic/camera on, moderator role.
     */
    public String clinicianUrl(String roomName, String clinicianName, boolean lowBandwidth) {
        String base = jitsiServerUrl + "/" + encode(roomName)
            + "#userInfo.displayName=" + encode(clinicianName)
            + "&config.prejoinPageEnabled=false"
            + "&config.startWithAudioMuted=false"
            + "&config.startWithVideoMuted=false";

        if (lowBandwidth) {
            base += lowBandwidthParams();
        }
        return base;
    }

    /**
     * URL for the patient — starts muted, no moderator privileges.
     * Simpler UI hints to reduce confusion for non-technical users.
     */
    public String patientUrl(String roomName, String sessionCode, boolean lowBandwidth) {
        String displayName = "Patient";
        String base = jitsiServerUrl + "/" + encode(roomName)
            + "#userInfo.displayName=" + encode(displayName)
            + "&config.prejoinPageEnabled=true"
            + "&config.startWithAudioMuted=true"
            + "&config.startWithVideoMuted=true"
            + "&config.toolbarButtons=[\"microphone\",\"camera\",\"hangup\"]";

        if (lowBandwidth) {
            base += lowBandwidthParams();
        }
        return base;
    }

    /**
     * Short redirect URL sent to patient via SMS.
     * Format: https://api.medic.health/api/v1/telemedicine/join/TELE-20260521-K9R3T
     * This redirects to the full Jitsi URL so the SMS stays short.
     */
    public String patientSmsUrl(String sessionCode) {
        return appBaseUrl + "/api/v1/telemedicine/join/" + sessionCode;
    }

    private String lowBandwidthParams() {
        return "&config.resolution=240"
            + "&config.constraints.video.height.max=240"
            + "&config.constraints.video.height.ideal=240"
            + "&config.disableScreensharing=true"
            + "&config.enableAudioOnlyMode=true"
            + "&config.channelLastN=4";   // limit active video tiles to 4
    }

    private String encode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
