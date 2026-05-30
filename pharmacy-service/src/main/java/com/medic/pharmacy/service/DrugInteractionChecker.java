package com.medic.pharmacy.service;

import com.medic.pharmacy.domain.DrugCatalog;
import com.medic.pharmacy.dto.InteractionWarning;
import com.medic.pharmacy.dto.MedicationItem;
import com.medic.pharmacy.repository.DrugCatalogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Checks for drug-drug interactions within a prescription.
 *
 * Algorithm:
 * 1. For each medication, look it up in the local drug catalog.
 * 2. For each pair (A, B) of medications, check if B is in A's commonInteractions list.
 * 3. Return all found interaction pairs with severity.
 *
 * This is a Phase 1 implementation using the local catalog.
 * Phase 2 will integrate with an external drug interaction API
 * (e.g. DrugBank, RxNorm, or OpenFDA).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DrugInteractionChecker {

    private final DrugCatalogRepository drugCatalogRepo;

    public List<InteractionWarning> check(List<MedicationItem> medications) {
        List<InteractionWarning> warnings = new ArrayList<>();

        if (medications == null || medications.size() < 2) {
            return warnings;
        }

        // Resolve each medication to its catalog entry
        List<DrugCatalog> catalogEntries = medications.stream()
            .map(m -> drugCatalogRepo.findByGenericNameIgnoreCase(m.name()).orElse(null))
            .toList();

        // Check each pair
        for (int i = 0; i < medications.size(); i++) {
            for (int j = i + 1; j < medications.size(); j++) {
                DrugCatalog drugA = catalogEntries.get(i);
                DrugCatalog drugB = catalogEntries.get(j);

                if (drugA == null || drugB == null) continue;

                String nameA = medications.get(i).name().toLowerCase();
                String nameB = medications.get(j).name().toLowerCase();

                boolean aInteractsWithB = hasInteraction(drugA, nameB);
                boolean bInteractsWithA = hasInteraction(drugB, nameA);

                if (aInteractsWithB || bInteractsWithA) {
                    warnings.add(new InteractionWarning(
                        medications.get(i).name(),
                        medications.get(j).name(),
                        "MODERATE",
                        "Potential interaction between " + medications.get(i).name()
                            + " and " + medications.get(j).name()
                            + ". Review dosing and monitor the patient."
                    ));
                    log.warn("Drug interaction detected: {} + {}",
                        medications.get(i).name(), medications.get(j).name());
                }
            }
        }

        return warnings;
    }

    private boolean hasInteraction(DrugCatalog drug, String otherName) {
        if (drug.getCommonInteractions() == null) return false;
        return Arrays.stream(drug.getCommonInteractions())
            .anyMatch(interaction -> interaction.toLowerCase().contains(otherName)
                || otherName.contains(interaction.toLowerCase()));
    }
}
