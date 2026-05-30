package com.medic.pharmacy.dto;

public record InteractionWarning(
    String drug1,
    String drug2,
    String severity,      // MINOR | MODERATE | MAJOR | CONTRAINDICATED
    String description
) {}
