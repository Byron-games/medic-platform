package com.medic.auth.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.medic.auth.domain.Facility;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {
    List<Facility> findByActiveTrueOrderByRegionAscNameAsc();

    List<Facility> findByRegionAndActiveTrueOrderByNameAsc(String region);

    Optional<Facility> findByFacilityId(String facilityId);
}
