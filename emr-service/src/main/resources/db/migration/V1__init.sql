-- EMR Schema
CREATE TABLE IF NOT EXISTS medical_records (
    id              BIGSERIAL PRIMARY KEY,
    patient_mpi_id  VARCHAR(20) NOT NULL,
    record_type     VARCHAR(50) NOT NULL,
    facility_id     VARCHAR(50) NOT NULL,
    facility_name   VARCHAR(100) NOT NULL,
    clinician_id    BIGINT NOT NULL,
    clinician_name  VARCHAR(100) NOT NULL,
    visit_date      TIMESTAMP NOT NULL,
    chief_complaint TEXT,
    subjective      TEXT,
    objective       TEXT,
    assessment      TEXT,
    plan            TEXT,
    icd10_codes     TEXT[],
    network_shared  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_patient ON medical_records(patient_mpi_id);
CREATE INDEX idx_emr_facility ON medical_records(facility_id);
CREATE INDEX idx_emr_visit_date ON medical_records(visit_date);
