package com.medic.analytics.repository;

import com.medic.analytics.domain.DiseaseCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DiseaseCaseRepository extends JpaRepository<DiseaseCase, Long> {

    @Query("SELECT d FROM DiseaseCase d WHERE d.reportDate BETWEEN :from AND :to " +
           "ORDER BY d.reportDate DESC")
    List<DiseaseCase> findInDateRange(
        @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT d.region, SUM(d.caseCount) as total FROM DiseaseCase d " +
           "WHERE d.reportDate BETWEEN :from AND :to " +
           "GROUP BY d.region ORDER BY total DESC")
    List<Object[]> casesByRegion(
        @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT d.diseaseName, d.icd10Code, SUM(d.caseCount) as total FROM DiseaseCase d " +
           "WHERE d.reportDate BETWEEN :from AND :to " +
           "GROUP BY d.diseaseName, d.icd10Code ORDER BY total DESC")
    List<Object[]> topDiseases(
        @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT d.region, d.icd10Code, d.diseaseName, SUM(d.caseCount) as total " +
           "FROM DiseaseCase d WHERE d.reportDate BETWEEN :from AND :to " +
           "AND d.icd10Code = :icd10Code GROUP BY d.region, d.icd10Code, d.diseaseName")
    List<Object[]> diseaseByRegion(
        @Param("icd10Code") String icd10Code,
        @Param("from") LocalDate from, @Param("to") LocalDate to);
}
