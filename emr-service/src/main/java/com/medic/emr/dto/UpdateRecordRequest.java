package com.medic.emr.dto;

import com.medic.emr.domain.RecordType;

/** All fields optional — PATCH semantics */
public record UpdateRecordRequest(
    RecordType recordType,
    String     chiefComplaint,
    String     subjective,
    String     objective,
    String     assessment,
    String     plan,
    String[]   icd10Codes,
    Boolean    networkShared
) {}
