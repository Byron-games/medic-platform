package com.medic.auth.domain;

public enum AccountStatus {
    /** Waiting for REGISTRAR approval */
    PENDING,
    /** Fully active */
    ACTIVE,
    /** Suspended by admin */
    SUSPENDED
}
