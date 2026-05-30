package com.medic.analytics.repository;

import com.medic.analytics.domain.OutbreakAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutbreakAlertRepository extends JpaRepository<OutbreakAlert, Long> {
    List<OutbreakAlert> findByActiveTrueOrderByTriggeredAtDesc();
    List<OutbreakAlert> findByIcd10CodeAndRegionAndActiveTrue(String icd10Code, String region);
}
