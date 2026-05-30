-- Appointment Schema
CREATE TABLE IF NOT EXISTS appointments (
    id              BIGSERIAL PRIMARY KEY,
    patient_mpi_id  VARCHAR(20) NOT NULL,
    clinician_id    BIGINT NOT NULL,
    clinician_name  VARCHAR(100) NOT NULL,
    facility_id     VARCHAR(50) NOT NULL,
    facility_name   VARCHAR(100) NOT NULL,
    appointment_type VARCHAR(20) NOT NULL DEFAULT 'IN_PERSON',
    status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    scheduled_at    TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    reason          TEXT,
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appt_patient ON appointments(patient_mpi_id);
CREATE INDEX idx_appt_clinician ON appointments(clinician_id);
CREATE INDEX idx_appt_date ON appointments(scheduled_at);
