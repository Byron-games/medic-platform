package com.medic.pharmacy.domain;

public enum PrescriptionStatus {
    /** Newly issued by clinician — awaiting dispensing */
    ISSUED,
    /** Some but not all medications dispensed */
    PARTIALLY_DISPENSED,
    /** All medications dispensed */
    DISPENSED,
    /** Prescription expired before being dispensed */
    EXPIRED,
    /** Cancelled by clinician or pharmacist */
    CANCELLED
}
