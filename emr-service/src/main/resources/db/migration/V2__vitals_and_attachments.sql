-- V2: Vital signs, attachments, and additional indexes

CREATE TABLE IF NOT EXISTS vital_signs (
    id              BIGSERIAL PRIMARY KEY,
    record_id       BIGINT NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    recorded_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    temperature_c   NUMERIC(4,1),       -- Celsius
    pulse_bpm       INT,
    respiratory_rate INT,
    systolic_bp     INT,
    diastolic_bp    INT,
    oxygen_sat_pct  NUMERIC(5,2),
    weight_kg       NUMERIC(6,2),
    height_cm       NUMERIC(5,1),
    bmi             NUMERIC(5,2),
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS record_attachments (
    id              BIGSERIAL PRIMARY KEY,
    record_id       BIGINT NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path    TEXT NOT NULL,
    uploaded_by     BIGINT NOT NULL,
    uploaded_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Partial index: only shared records (used by analytics/surveillance)
CREATE INDEX idx_emr_shared ON medical_records(patient_mpi_id)
    WHERE network_shared = true;

-- Index for ICD-10 code lookups (GIN for array column)
CREATE INDEX idx_emr_icd10 ON medical_records USING gin(icd10_codes);

CREATE INDEX idx_vitals_record ON vital_signs(record_id);
