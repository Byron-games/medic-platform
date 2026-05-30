package com.medic.auth.domain;

public enum Role {
    /** Full system access — only one or two per deployment */
    ADMIN,

    // ── Clinical ────────────────────────────────────────────
    /** MD/GP — prescribe, EMR full, appointments, telemedicine */
    DOCTOR,
    /** Registered nurse — EMR, appointments, NO prescribing */
    NURSE,
    /** Midwife — maternity EMR, appointments, NO prescribing */
    MIDWIFE,
    /** Laboratory technician — create LAB_RESULT records only */
    LAB_TECHNICIAN,
    /** Radiologist — create LAB_RESULT/imaging records only */
    RADIOLOGIST,

    // ── Non-clinical ─────────────────────────────────────────
    /**
     * Dispenses prescriptions — can VIEW patient basic info, CANNOT book appointments, CANNOT start
     * telemedicine, CANNOT create EMR records.
     */
    PHARMACIST,
    /**
     * Books and manages appointments, registers patients, CANNOT access clinical records or
     * prescriptions.
     */
    RECEPTIONIST,
    /**
     * Inputs disease data, views surveillance analytics, CANNOT access individual patient records.
     */
    ANALYST,
    /** Manages facility users, settings — NO clinical access */
    FACILITY_ADMIN,
    /** Approves/rejects new registrations at their facility */
    REGISTRAR,

    // ── States ───────────────────────────────────────────────
    /** Awaiting REGISTRAR approval — minimal read-only access */
    PENDING
}
