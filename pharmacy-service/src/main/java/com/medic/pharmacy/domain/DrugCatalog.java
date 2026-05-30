package com.medic.pharmacy.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "drug_catalog")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrugCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "generic_name", nullable = false, length = 200)
    private String genericName;

    @Column(name = "brand_names", columnDefinition = "TEXT[]")
    private String[] brandNames;

    @Column(name = "drug_class", length = 100)
    private String drugClass;

    @Column(name = "atc_code", length = 20)
    private String atcCode;

    @Column(name = "dosage_forms", columnDefinition = "TEXT[]")
    private String[] dosageForms;

    @Column(name = "standard_doses", columnDefinition = "TEXT[]")
    private String[] standardDoses;

    @Column(columnDefinition = "TEXT")
    private String contraindications;

    /** Generic names of drugs that interact with this one */
    @Column(name = "common_interactions", columnDefinition = "TEXT[]")
    private String[] commonInteractions;

    @Column(name = "requires_prescription", nullable = false)
    @Builder.Default
    private boolean requiresPrescription = true;

    @Column(name = "available_in_cameroon", nullable = false)
    @Builder.Default
    private boolean availableInCameroon = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
