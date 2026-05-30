package com.medic.telemedicine.domain;

public enum SessionStatus {
    /** Session created, join URLs generated, nobody has joined yet */
    CREATED,
    /** At least one participant has joined, waiting for the other */
    WAITING,
    /** Both clinician and patient are in the room */
    ACTIVE,
    /** Session ended normally */
    ENDED,
    /** Cancelled before it started */
    CANCELLED,
    /** Clinician or patient failed to join */
    FAILED
}
