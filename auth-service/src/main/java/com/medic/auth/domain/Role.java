package com.medic.auth.domain;

/**
 * System roles in the M.E.D.I.C. platform.
 * Roles are stored as strings in the DB and propagated in the JWT.
 */
public enum Role {
    /** Full platform access — system administrator */
    ADMIN,
    /** Doctors, nurses, clinical staff — access to EMR, prescriptions, appointments */
    CLINICIAN,
    /** Facility-level admin — manage staff and settings for one facility */
    FACILITY_ADMIN,
    /** Dispensary staff — read prescriptions, mark as dispensed */
    PHARMACY,
    /** Read-only access to analytics and surveillance data */
    ANALYST
}
