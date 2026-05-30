package com.medic.emr.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.medic.emr.domain.MedicalRecord;
import com.medic.emr.domain.RecordType;
import com.medic.emr.domain.VitalSigns;
import com.medic.emr.dto.CreateRecordRequest;
import com.medic.emr.dto.MedicalRecordResponse;
import com.medic.emr.dto.RecordSummary;
import com.medic.emr.dto.UpdateRecordRequest;
import com.medic.emr.dto.VitalSignsRequest;
import com.medic.emr.dto.VitalSignsResponse;
import com.medic.emr.exception.RecordNotFoundException;
import com.medic.emr.exception.UnauthorisedException;
import com.medic.emr.repository.MedicalRecordRepository;
import com.medic.emr.repository.VitalSignsRepository;
import com.medic.emr.security.RequestContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmrService {

    private final MedicalRecordRepository recordRepo;
    private final VitalSignsRepository vitalsRepo;
    private final RequestContext ctx;
    private final AnalyticsNotifier analyticsNotifier;

    // ── List records for a patient ───────────────────────

    @Transactional(readOnly = true)
    public Page<RecordSummary> listForPatient(String mpiId, RecordType type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MedicalRecord> records = type != null
                ? recordRepo.findByPatientMpiIdAndRecordTypeOrderByVisitDateDesc(mpiId, type,
                        pageable)
                : recordRepo.findByPatientMpiIdOrderByVisitDateDesc(mpiId, pageable);
        return records.map(RecordSummary::from);
    }

    // ── Get full record ──────────────────────────────────

    @Transactional(readOnly = true)
    public MedicalRecordResponse getById(Long id) {
        return MedicalRecordResponse.from(findOrThrow(id));
    }

    // ── Create ──────────────────────────────────────────

    @Transactional
    public MedicalRecordResponse create(CreateRecordRequest req) {
        String clinicianName = ctx.getUsername() != null ? ctx.getUsername() : "Unknown";
        Long clinicianId = ctx.getUserId() != null ? ctx.getUserId() : 0L;
        String facilityId = ctx.getFacilityId() != null ? ctx.getFacilityId() : "UNKNOWN";
        String facilityName =
                ctx.getFacilityName() != null ? ctx.getFacilityName() : "Unknown Facility";

        MedicalRecord record = MedicalRecord.builder().patientMpiId(req.patientMpiId())
                .recordType(req.recordType() != null ? req.recordType() : RecordType.SOAP)
                .facilityId(facilityId).facilityName(facilityName).clinicianId(clinicianId)
                .clinicianName(clinicianName).visitDate(req.visitDate())
                .chiefComplaint(req.chiefComplaint()).subjective(req.subjective())
                .objective(req.objective()).assessment(req.assessment()).plan(req.plan())
                .icd10Codes(req.icd10Codes()).networkShared(req.networkShared()).build();

        recordRepo.save(record);

        // Attach vitals if provided
        if (req.vitals() != null) {
            VitalSigns vitals = buildVitals(req.vitals(), record);
            vitalsRepo.save(vitals);
            record.getVitalSigns().add(vitals);
        }

        // ── Notify analytics service about diagnoses ───────
        // FIX: use array length, not List methods
        if (record.getIcd10Codes() != null && record.getIcd10Codes().length > 0) {
            for (String icd10Code : record.getIcd10Codes()) {
                analyticsNotifier.notifyDiagnosis(icd10Code, record.getAssessment(),
                        ctx.getFacilityRegion(), ctx.getFacilityId());
            }
            log.info("Notified analytics for {} ICD-10 code(s) on record id={}",
                    record.getIcd10Codes().length, record.getId());
        }

        log.info("EMR record created: id={} patient={} type={} by={}", record.getId(),
                req.patientMpiId(), record.getRecordType(), clinicianName);

        return MedicalRecordResponse.from(record);
    }

    // ── Update (PATCH semantics) ─────────────────────────

    @Transactional
    public MedicalRecordResponse update(Long id, UpdateRecordRequest req) {
        MedicalRecord record = findOrThrow(id);

        // Only the original clinician or an admin can edit
        if (!ctx.isAdmin() && !record.getClinicianId().equals(ctx.getUserId())) {
            throw new UnauthorisedException(
                    "Only the authoring clinician or an admin can edit this record");
        }

        if (req.recordType() != null)
            record.setRecordType(req.recordType());
        if (req.chiefComplaint() != null)
            record.setChiefComplaint(req.chiefComplaint());
        if (req.subjective() != null)
            record.setSubjective(req.subjective());
        if (req.objective() != null)
            record.setObjective(req.objective());
        if (req.assessment() != null)
            record.setAssessment(req.assessment());
        if (req.plan() != null)
            record.setPlan(req.plan());
        if (req.icd10Codes() != null)
            record.setIcd10Codes(req.icd10Codes());
        if (req.networkShared() != null)
            record.setNetworkShared(req.networkShared());

        recordRepo.save(record);
        log.info("EMR record updated: id={} by={}", id, ctx.getUsername());
        return MedicalRecordResponse.from(record);
    }

    // ── Add vitals to existing record ────────────────────

    @Transactional
    public VitalSignsResponse addVitals(Long recordId, VitalSignsRequest req) {
        MedicalRecord record = findOrThrow(recordId);
        VitalSigns vitals = buildVitals(req, record);
        vitalsRepo.save(vitals);
        log.info("Vitals added to record id={} by={}", recordId, ctx.getUsername());
        return VitalSignsResponse.from(vitals);
    }

    // ── Get vitals for a record ──────────────────────────

    @Transactional(readOnly = true)
    public List<VitalSignsResponse> getVitals(Long recordId) {
        findOrThrow(recordId); // verify record exists
        return vitalsRepo.findByRecordIdOrderByRecordedAtDesc(recordId).stream()
                .map(VitalSignsResponse::from).toList();
    }

    // ── Patient timeline (last N records, all types) ─────

    @Transactional(readOnly = true)
    public List<RecordSummary> getTimeline(String mpiId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return recordRepo.findRecentByPatient(mpiId, pageable).stream().map(RecordSummary::from)
                .toList();
    }

    // ── Record count for patient ─────────────────────────

    @Transactional(readOnly = true)
    public long countForPatient(String mpiId) {
        return recordRepo.countByPatientMpiId(mpiId);
    }

    // ── Private helpers ──────────────────────────────────

    private MedicalRecord findOrThrow(Long id) {
        return recordRepo.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Medical record not found: " + id));
    }

    private VitalSigns buildVitals(VitalSignsRequest req, MedicalRecord record) {
        BigDecimal bmi = null;
        if (req.weightKg() != null && req.heightCm() != null
                && req.heightCm().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightM =
                    req.heightCm().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            bmi = req.weightKg().divide(heightM.multiply(heightM), 2, RoundingMode.HALF_UP);
        }

        return VitalSigns.builder().record(record).temperatureC(req.temperatureC())
                .pulseBpm(req.pulseBpm()).respiratoryRate(req.respiratoryRate())
                .systolicBp(req.systolicBp()).diastolicBp(req.diastolicBp())
                .oxygenSatPct(req.oxygenSatPct()).weightKg(req.weightKg()).heightCm(req.heightCm())
                .bmi(bmi).notes(req.notes()).build();
    }
}
