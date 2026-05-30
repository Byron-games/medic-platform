package com.medic.pharmacy.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medic.pharmacy.domain.DrugCatalog;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DrugCatalogResponse(
    Long     id,
    String   genericName,
    String[] brandNames,
    String   drugClass,
    String   atcCode,
    String[] dosageForms,
    String[] standardDoses,
    String   contraindications,
    String[] commonInteractions,
    boolean  requiresPrescription,
    boolean  availableInCameroon
) {
    public static DrugCatalogResponse from(DrugCatalog d) {
        return new DrugCatalogResponse(
            d.getId(), d.getGenericName(), d.getBrandNames(),
            d.getDrugClass(), d.getAtcCode(), d.getDosageForms(),
            d.getStandardDoses(), d.getContraindications(),
            d.getCommonInteractions(), d.isRequiresPrescription(),
            d.isAvailableInCameroon()
        );
    }
}
