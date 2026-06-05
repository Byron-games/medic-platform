-- Pharmacy Schema
CREATE TABLE IF NOT EXISTS prescriptions (
    id              BIGSERIAL PRIMARY KEY,
    rx_code         VARCHAR(20) UNIQUE NOT NULL,
    patient_mpi_id  VARCHAR(20) NOT NULL,
    clinician_id    BIGINT NOT NULL,
    clinician_name  VARCHAR(100) NOT NULL,
    facility_id     VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    medications     JSONB NOT NULL,
    interaction_warnings JSONB,
    notes           TEXT,
    issued_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMP,
    dispensed_at    TIMESTAMP,
    dispensed_by    BIGINT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rx_patient ON prescriptions(patient_mpi_id);
CREATE INDEX idx_rx_code ON prescriptions(rx_code);
