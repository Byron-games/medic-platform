package com.medic.appointment.repository;

import com.medic.appointment.domain.ClinicianSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicianSlotRepository extends JpaRepository<ClinicianSlot, Long> {

    List<ClinicianSlot> findByClinicianIdAndActiveTrue(Long clinicianId);

    List<ClinicianSlot> findByClinicianIdAndFacilityIdAndActiveTrue(
        Long clinicianId, String facilityId);

    List<ClinicianSlot> findByClinicianIdAndDayOfWeekAndActiveTrue(
        Long clinicianId, int dayOfWeek);
}
