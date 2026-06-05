-- USSD Schema
CREATE TABLE IF NOT EXISTS ussd_sessions (
    id              BIGSERIAL PRIMARY KEY,
    session_id      VARCHAR(100) UNIQUE NOT NULL,
    phone_number    VARCHAR(20) NOT NULL,
    current_menu    VARCHAR(50) NOT NULL DEFAULT 'MAIN',
    patient_mpi_id  VARCHAR(20),
    language        VARCHAR(5) NOT NULL DEFAULT 'EN',
    session_data    JSONB,
    input_history   TEXT[],
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ussd_session_id ON ussd_sessions(session_id);
CREATE INDEX idx_ussd_phone ON ussd_sessions(phone_number);
