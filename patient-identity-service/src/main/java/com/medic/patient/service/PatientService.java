package com.medic.patient.service;

import com.medic.patient.domain.Patient;
import com.medic.patient.domain.PatientFacilityLink;
import com.medic.patient.dto.*;
import com.medic.patient.exception.DuplicatePatientException;
import com.medic.patient.exception.PatientNotFoundException;
import com.medic.patient.repository.PatientFacilityLinkRepository;
import com.medic.patient.repository.PatientRepository;
import com.medic.patient.security.RequestContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository             patientRepo;
    private final PatientFacilityLinkRepository linkRepo;
    private final MpiIdGenerator                mpiIdGenerator;
    private final RequestContext                ctx;

    // ── List all (paginated) ────────────────────────────

    @Transactional(readOnly = true)
    public Page<PatientSummary> listAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName"));
        return patientRepo.findAllByActiveTrue(pageable).map(PatientSummary::from);
    }

    // ── Search ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PatientSummary> search(String term, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName"));
        return patientRepo.search(term.trim(), pageable).map(PatientSummary::from);
    }

    // ── Get by MPI ID ────────────────────────────────────

    @Transactional(readOnly = true)
    public PatientResponse getByMpiId(String mpiId) {
        return PatientResponse.from(findOrThrow(mpiId));
    }

    // ── Create ──────────────────────────────────────────

    @Transactional
    public PatientResponse create(CreatePatientRequest req) {

        // 1. National ID uniqueness
        if (req.nationalId() != null && !req.nationalId().isBlank()
                && patientRepo.existsByNationalId(req.nationalId())) {
            throw new DuplicatePatientException(
                "A patient with national ID '" + req.nationalId() + "' already exists");
        }

        // 2. Demographic duplicate detection (skip if forceCreate)
        if (!req.forceCreate()) {
            Optional<Patient> duplicate = patientRepo.findDuplicate(
                req.firstName(), req.lastName(), req.dateOfBirth(), req.gender());
            if (duplicate.isPresent()) {
                Patient d = duplicate.get();
                throw new DuplicatePatientException(
                    "Possible duplicate: patient '" + d.getFullName() +
                    "' (MPI: " + d.getMpiId() + ") shares the same name, DOB and gender. " +
                    "Set forceCreate=true to register anyway.");
            }
        }

        // 3. Generate unique MPI ID (retry up to 5x on collision)
        String mpiId = generateUniqueMpiId();

        // 4. Resolve facility from request or from request context
        String facilityId = req.primaryFacilityId() != null
            ? req.primaryFacilityId() : ctx.getFacilityId();

        // 5. Build and persist
        Patient patient = Patient.builder()
            .mpiId(mpiId)
            .nationalId(req.nationalId())
            .firstName(capitalise(req.firstName()))
            .lastName(capitalise(req.lastName()))
            .dateOfBirth(req.dateOfBirth())
            .gender(req.gender())
            .bloodType(req.bloodType())
            .phoneNumber(req.phoneNumber())
            .email(req.email())
            .address(req.address())
            .region(req.region())
            .country(req.country() != null ? req.country() : "Cameroon")
            .primaryFacilityId(facilityId)
            .build();

        patientRepo.save(patient);

        // 6. Auto-link to the registering facility
        if (facilityId != null) {
            String facilityName = ctx.getFacilityName() != null
                ? ctx.getFacilityName() : facilityId;
            linkToFacility(mpiId, facilityId, facilityName);
        }

        log.info("Patient registered: {} | MPI: {} | by: {} @ {}",
            patient.getFullName(), mpiId, ctx.getUsername(), facilityId);

        return PatientResponse.from(patient);
    }

    // ── Update (PATCH semantics) ─────────────────────────

    @Transactional
    public PatientResponse update(String mpiId, UpdatePatientRequest req) {
        Patient p = findOrThrow(mpiId);

        if (req.firstName()         != null) p.setFirstName(capitalise(req.firstName()));
        if (req.lastName()          != null) p.setLastName(capitalise(req.lastName()));
        if (req.dateOfBirth()       != null) p.setDateOfBirth(req.dateOfBirth());
        if (req.gender()            != null) p.setGender(req.gender());
        if (req.nationalId()        != null) p.setNationalId(req.nationalId());
        if (req.bloodType()         != null) p.setBloodType(req.bloodType());
        if (req.phoneNumber()       != null) p.setPhoneNumber(req.phoneNumber());
        if (req.email()             != null) p.setEmail(req.email());
        if (req.address()           != null) p.setAddress(req.address());
        if (req.region()            != null) p.setRegion(req.region());
        if (req.country()           != null) p.setCountry(req.country());
        if (req.primaryFacilityId() != null) p.setPrimaryFacilityId(req.primaryFacilityId());

        patientRepo.save(p);
        log.info("Patient updated: {} | by: {}", mpiId, ctx.getUsername());
        return PatientResponse.from(p);
    }

    // ── Soft deactivate ──────────────────────────────────

    @Transactional
    public void deactivate(String mpiId) {
        Patient p = findOrThrow(mpiId);
        p.setActive(false);
        patientRepo.save(p);
        log.info("Patient deactivated: {} | by: {}", mpiId, ctx.getUsername());
    }

    // ── Facility linking ─────────────────────────────────

    @Transactional
    public void linkToFacility(String mpiId, String facilityId, String facilityName) {
        if (!linkRepo.existsByPatientMpiIdAndFacilityId(mpiId, facilityId)) {
            PatientFacilityLink link = PatientFacilityLink.builder()
                .patientMpiId(mpiId)
                .facilityId(facilityId)
                .facilityName(facilityName)
                .linkedBy(ctx.getUserId())
                .build();
            linkRepo.save(link);
            log.info("Patient {} linked to facility {}", mpiId, facilityId);
        }
    }

    @Transactional(readOnly = true)
    public Page<PatientSummary> findByFacility(String facilityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName"));
        return patientRepo.findByFacilityId(facilityId, pageable).map(PatientSummary::from);
    }

    // ── Private helpers ──────────────────────────────────

    private Patient findOrThrow(String mpiId) {
        return patientRepo.findByMpiId(mpiId)
            .orElseThrow(() -> new PatientNotFoundException("Patient not found: " + mpiId));
    }

    private String generateUniqueMpiId() {
        for (int i = 0; i < 5; i++) {
            String id = mpiIdGenerator.generate();
            if (patientRepo.findByMpiId(id).isEmpty()) return id;
        }
        throw new IllegalStateException("Failed to generate unique MPI ID after 5 attempts");
    }

    private String capitalise(String s) {
        if (s == null || s.isBlank()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }
}
