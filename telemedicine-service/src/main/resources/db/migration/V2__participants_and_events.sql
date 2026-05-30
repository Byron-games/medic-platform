-- V2: Session participants + event audit log

CREATE TABLE IF NOT EXISTS session_participants (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT NOT NULL REFERENCES telemedicine_sessions(id) ON DELETE CASCADE,
    user_type       VARCHAR(20) NOT NULL,   -- CLINICIAN | PATIENT | OBSERVER
    user_id         VARCHAR(50) NOT NULL,   -- userId or patientMpiId
    display_name    VARCHAR(100) NOT NULL,
    joined_at       TIMESTAMP,
    left_at         TIMESTAMP,
    duration_seconds INT
);

CREATE TABLE IF NOT EXISTS session_events (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT NOT NULL REFERENCES telemedicine_sessions(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,   -- CREATED | STARTED | PARTICIPANT_JOINED | ENDED | etc.
    actor           VARCHAR(100),
    event_data      TEXT,
    occurred_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Partial index: active sessions only
CREATE INDEX idx_tele_active ON telemedicine_sessions(status)
    WHERE status IN ('CREATED', 'WAITING', 'ACTIVE');

CREATE INDEX idx_session_events ON session_events(session_id, occurred_at);
