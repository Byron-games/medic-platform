package com.medic.emr;

import com.medic.emr.domain.MedicalRecord;
import com.medic.emr.domain.RecordType;
import com.medic.emr.domain.VitalSigns;
import com.medic.emr.dto.*;
import com.medic.emr.exception.RecordNotFoundException;
import com.medic.emr.exception.UnauthorisedException;
import com.medic.emr.repository.MedicalRecordRepository;
import com.medic.emr.repository.VitalSignsRepository;
import com.medic.emr.security.RequestContext;
import com.medic.emr.service.EmrService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmrServiceTest {

    @Mock MedicalRecordRepository recordRepo;
    @Mock VitalSignsRepository    vitalsRepo;
    @Mock RequestContext          ctx;

    @InjectMocks EmrService emrService;

    private MedicalRecord existingRecord;

    @BeforeEach
    void setUp() {
        existingRecord = MedicalRecord.builder()
            .id(1L)
            .patientMpiId("MPI-20260520-ABCDE")
            .recordType(RecordType.SOAP)
            .facilityId("FAC-001")
            .facilityName("Yaoundé General")
            .clinicianId(42L)
            .clinicianName("dr.smith")
            .visitDate(LocalDateTime.now().minusHours(2))
            .chiefComplaint("Fever and headache")
            .vitalSigns(new ArrayList<>())
            .build();
    }

    @Test
    void create_withValidRequest_shouldReturnRecord() {
        when(ctx.getUsername()).thenReturn("dr.smith");
        when(ctx.getUserId()).thenReturn(42L);
        when(ctx.getFacilityId()).thenReturn("FAC-001");
        when(ctx.getFacilityName()).thenReturn("Yaoundé General");
        when(recordRepo.save(any())).thenAnswer(i -> {
            MedicalRecord r = i.getArgument(0);
            r = MedicalRecord.builder()
                .id(1L).patientMpiId(r.getPatientMpiId())
                .recordType(r.getRecordType()).facilityId(r.getFacilityId())
                .facilityName(r.getFacilityName()).clinicianId(r.getClinicianId())
                .clinicianName(r.getClinicianName()).visitDate(r.getVisitDate())
                .chiefComplaint(r.getChiefComplaint()).vitalSigns(new ArrayList<>())
                .build();
            return r;
        });

        CreateRecordRequest req = new CreateRecordRequest(
            "MPI-20260520-ABCDE", RecordType.SOAP,
            LocalDateTime.now().minusHours(1),
            "Headache and fever for 2 days",
            "Patient reports severe headache, temperature 38.5°C",
            "Temp 38.5°C, HR 92bpm, BP 118/76",
            "Acute febrile illness — possible malaria",
            "Rapid malaria test, Artemether-Lumefantrine if positive",
            new String[]{"R50.9"}, false, null
        );

        MedicalRecordResponse response = emrService.create(req);

        assertThat(response.patientMpiId()).isEqualTo("MPI-20260520-ABCDE");
        assertThat(response.clinicianName()).isEqualTo("dr.smith");
        assertThat(response.recordType()).isEqualTo(RecordType.SOAP);
    }

    @Test
    void create_withVitals_shouldCalculateBmi() {
        when(ctx.getUsername()).thenReturn("dr.smith");
        when(ctx.getUserId()).thenReturn(42L);
        when(ctx.getFacilityId()).thenReturn("FAC-001");
        when(ctx.getFacilityName()).thenReturn("Yaoundé General");
        when(recordRepo.save(any())).thenAnswer(i -> {
            MedicalRecord r = i.getArgument(0);
            r = MedicalRecord.builder().id(1L)
                .patientMpiId(r.getPatientMpiId()).recordType(r.getRecordType())
                .facilityId(r.getFacilityId()).facilityName(r.getFacilityName())
                .clinicianId(r.getClinicianId()).clinicianName(r.getClinicianName())
                .visitDate(r.getVisitDate()).chiefComplaint(r.getChiefComplaint())
                .vitalSigns(new ArrayList<>()).build();
            return r;
        });
        when(vitalsRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        VitalSignsRequest vitals = new VitalSignsRequest(
            new BigDecimal("37.2"), 72, 16, 120, 80,
            new BigDecimal("98.5"),
            new BigDecimal("70.0"),   // 70kg
            new BigDecimal("175.0"),  // 175cm → BMI = 70 / 1.75² = 22.86
            null
        );

        CreateRecordRequest req = new CreateRecordRequest(
            "MPI-20260520-ABCDE", null, LocalDateTime.now(),
            "Routine check-up", null, null, null, null, null, false, vitals
        );

        MedicalRecordResponse response = emrService.create(req);
        assertThat(response).isNotNull();
        verify(vitalsRepo).save(argThat(v ->
            v.getBmi() != null && v.getBmi().compareTo(new BigDecimal("22.86")) == 0
        ));
    }

    @Test
    void getById_withMissingRecord_shouldThrowNotFound() {
        when(recordRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> emrService.getById(999L))
            .isInstanceOf(RecordNotFoundException.class)
            .hasMessageContaining("999");
    }

    @Test
    void update_byNonAuthor_shouldThrowForbidden() {
        when(recordRepo.findById(1L)).thenReturn(Optional.of(existingRecord));
        when(ctx.isAdmin()).thenReturn(false);
        when(ctx.getUserId()).thenReturn(99L); // different clinician

        UpdateRecordRequest req = new UpdateRecordRequest(
            null, "Updated complaint", null, null, null, null, null, null);

        assertThatThrownBy(() -> emrService.update(1L, req))
            .isInstanceOf(UnauthorisedException.class)
            .hasMessageContaining("authoring clinician");
    }

    @Test
    void update_byOriginalAuthor_shouldSucceed() {
        when(recordRepo.findById(1L)).thenReturn(Optional.of(existingRecord));
        when(ctx.isAdmin()).thenReturn(false);
        when(ctx.getUserId()).thenReturn(42L); // same as clinicianId
        when(ctx.getUsername()).thenReturn("dr.smith");
        when(recordRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        UpdateRecordRequest req = new UpdateRecordRequest(
            null, "Updated chief complaint", null, null, null, null, null, null);

        MedicalRecordResponse response = emrService.update(1L, req);
        assertThat(response.chiefComplaint()).isEqualTo("Updated chief complaint");
    }

    @Test
    void update_byAdmin_shouldSucceed() {
        when(recordRepo.findById(1L)).thenReturn(Optional.of(existingRecord));
        when(ctx.isAdmin()).thenReturn(true);
        when(ctx.getUsername()).thenReturn("admin");
        when(recordRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        UpdateRecordRequest req = new UpdateRecordRequest(
            null, null, null, null, null, null,
            new String[]{"A09", "J06.9"}, true);

        MedicalRecordResponse response = emrService.update(1L, req);
        assertThat(response.networkShared()).isTrue();
    }
}
