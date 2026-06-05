package com.medic.emr.domain;

/**
 * Clinical record types supported by M.E.D.I.C. EMR.
 * SOAP is the default for outpatient consultations.
 */
public enum RecordType {
    /** Subjective / Objective / Assessment / Plan — standard outpatient note */
    SOAP,
    /** Inpatient admission note */
    ADMISSION,
    /** Inpatient discharge summary */
    DISCHARGE,
    /** Emergency department visit */
    EMERGENCY,
    /** Follow-up consultation */
    FOLLOW_UP,
    /** Procedure or surgical note */
    PROCEDURE,
    /** Lab or imaging result */
    LAB_RESULT,
    /** Referral letter to another facility or specialist */
    REFERRAL
}
