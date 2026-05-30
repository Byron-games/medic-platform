package com.medic.patient.repository;

import com.medic.patient.domain.PatientFacilityLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientFacilityLinkRepository extends JpaRepository<PatientFacilityLink, Long> {

    Optional<PatientFacilityLink> findByPatientMpiIdAndFacilityId(String mpiId, String facilityId);

    boolean existsByPatientMpiIdAndFacilityId(String mpiId, String facilityId);
}
