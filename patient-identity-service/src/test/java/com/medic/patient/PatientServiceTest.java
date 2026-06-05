package com.medic.patient;

import com.medic.patient.domain.Gender;
import com.medic.patient.domain.Patient;
import com.medic.patient.dto.CreatePatientRequest;
import com.medic.patient.dto.PatientResponse;
import com.medic.patient.exception.DuplicatePatientException;
import com.medic.patient.repository.PatientFacilityLinkRepository;
import com.medic.patient.repository.PatientRepository;
import com.medic.patient.security.RequestContext;
import com.medic.patient.service.MpiIdGenerator;
import com.medic.patient.service.PatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock PatientRepository             patientRepo;
    @Mock PatientFacilityLinkRepository linkRepo;
    @Mock MpiIdGenerator                mpiIdGenerator;
    @Mock RequestContext                ctx;

    @InjectMocks PatientService patientService;

    private CreatePatientRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new CreatePatientRequest(
            "Jean", "Dupont",
            LocalDate.of(1985, 6, 15),
            Gender.MALE,
            "CM-123456", "A+",
            "+237677123456",
            "jean.dupont@email.cm",
            "Yaoundé, Centre", "Centre", "Cameroon",
            "FAC-001", false
        );
    }

    @Test
    void create_withValidRequest_shouldReturnPatientWithMpiId() {
        when(patientRepo.existsByNationalId("CM-123456")).thenReturn(false);
        when(patientRepo.findDuplicate(any(), any(), any(), any())).thenReturn(Optional.empty());
        when(mpiIdGenerator.generate()).thenReturn("MPI-20260520-ABCDE");
        when(patientRepo.findByMpiId("MPI-20260520-ABCDE")).thenReturn(Optional.empty());
        when(ctx.getFacilityId()).thenReturn("FAC-001");
        when(ctx.getFacilityName()).thenReturn("Yaoundé General");
        when(ctx.getUsername()).thenReturn("dr.smith");
        when(ctx.getUserId()).thenReturn(1L);
        when(patientRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(linkRepo.existsByPatientMpiIdAndFacilityId(any(), any())).thenReturn(false);
        when(linkRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        PatientResponse response = patientService.create(validRequest);

        assertThat(response.mpiId()).isEqualTo("MPI-20260520-ABCDE");
        assertThat(response.firstName()).isEqualTo("Jean");
        assertThat(response.lastName()).isEqualTo("Dupont");
        assertThat(response.age()).isGreaterThan(0);
    }

    @Test
    void create_withDuplicateNationalId_shouldThrowConflict() {
        when(patientRepo.existsByNationalId("CM-123456")).thenReturn(true);

        assertThatThrownBy(() -> patientService.create(validRequest))
            .isInstanceOf(DuplicatePatientException.class)
            .hasMessageContaining("CM-123456");
    }

    @Test
    void create_withDemographicDuplicate_withoutForceCreate_shouldThrow() {
        when(patientRepo.existsByNationalId(anyString())).thenReturn(false);

        Patient existing = Patient.builder()
            .mpiId("MPI-20260101-EXIST")
            .firstName("Jean").lastName("Dupont")
            .dateOfBirth(LocalDate.of(1985, 6, 15))
            .gender(Gender.MALE)
            .build();

        when(patientRepo.findDuplicate(any(), any(), any(), any()))
            .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> patientService.create(validRequest))
            .isInstanceOf(DuplicatePatientException.class)
            .hasMessageContaining("Possible duplicate")
            .hasMessageContaining("MPI-20260101-EXIST");
    }

    @Test
    void create_withDemographicDuplicate_forceCreate_shouldSucceed() {
        CreatePatientRequest forceReq = new CreatePatientRequest(
            "Jean", "Dupont", LocalDate.of(1985, 6, 15), Gender.MALE,
            null, null, null, null, null, null, "Cameroon", "FAC-001", true
        );

        when(patientRepo.existsByNationalId(any())).thenReturn(false);
        when(mpiIdGenerator.generate()).thenReturn("MPI-20260520-FORCE");
        when(patientRepo.findByMpiId("MPI-20260520-FORCE")).thenReturn(Optional.empty());
        when(ctx.getFacilityId()).thenReturn("FAC-001");
        when(ctx.getFacilityName()).thenReturn("Test Hospital");
        when(ctx.getUsername()).thenReturn("registrar");
        when(ctx.getUserId()).thenReturn(2L);
        when(patientRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(linkRepo.existsByPatientMpiIdAndFacilityId(any(), any())).thenReturn(false);
        when(linkRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        PatientResponse response = patientService.create(forceReq);
        assertThat(response.mpiId()).isEqualTo("MPI-20260520-FORCE");
    }

    @Test
    void mpiIdGenerator_shouldProduceCorrectFormat() {
        MpiIdGenerator generator = new MpiIdGenerator();
        String id = generator.generate();
        // Format: MPI-YYYYMMDD-XXXXX  (18 chars total)
        assertThat(id).startsWith("MPI-");
        assertThat(id).hasSize(18);
        assertThat(id).matches("MPI-\\d{8}-[A-Z2-9]{5}");
    }

    @Test
    void mpiIdGenerator_shouldProduceDifferentIdsEachCall() {
        MpiIdGenerator generator = new MpiIdGenerator();
        // Extremely unlikely to get the same ID twice
        assertThat(generator.generate()).isNotEqualTo(generator.generate());
    }
}
