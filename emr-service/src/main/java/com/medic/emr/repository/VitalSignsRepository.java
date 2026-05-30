package com.medic.emr.repository;

import com.medic.emr.domain.VitalSigns;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VitalSignsRepository extends JpaRepository<VitalSigns, Long> {

    List<VitalSigns> findByRecordIdOrderByRecordedAtDesc(Long recordId);

    Optional<VitalSigns> findFirstByRecordIdOrderByRecordedAtDesc(Long recordId);
}
