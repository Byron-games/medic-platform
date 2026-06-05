-- Telemedicine Schema
CREATE TABLE IF NOT EXISTS telemedicine_sessions (
    id                  BIGSERIAL PRIMARY KEY,
    session_code        VARCHAR(30) UNIQUE NOT NULL,
    appointment_id      BIGINT,
    patient_mpi_id      VARCHAR(20) NOT NULL,
    clinician_id        BIGINT NOT NULL,
    clinician_name      VARCHAR(100) NOT NULL,
    facility_id         VARCHAR(50) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    platform            VARCHAR(20) NOT NULL DEFAULT 'JITSI',
    room_name           VARCHAR(200) NOT NULL,
    clinician_join_url  TEXT,
    patient_join_url    TEXT,
    low_bandwidth_mode  BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_at        TIMESTAMP,
    started_at          TIMESTAMP,
    ended_at            TIMESTAMP,
    duration_seconds    INT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tele_patient ON telemedicine_sessions(patient_mpi_id);
CREATE INDEX idx_tele_session_code ON telemedicine_sessions(session_code);
