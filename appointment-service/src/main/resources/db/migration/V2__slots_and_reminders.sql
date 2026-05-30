-- V2: Clinician availability slots + appointment reminders

CREATE TABLE IF NOT EXISTS clinician_slots (
    id              BIGSERIAL PRIMARY KEY,
    clinician_id    BIGINT NOT NULL,
    facility_id     VARCHAR(50) NOT NULL,
    day_of_week     SMALLINT NOT NULL,   -- 1=MON … 7=SUN (ISO)
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_minutes    INT NOT NULL DEFAULT 30,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_reminders (
    id              BIGSERIAL PRIMARY KEY,
    appointment_id  BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    remind_at       TIMESTAMP NOT NULL,
    channel         VARCHAR(20) NOT NULL DEFAULT 'SMS',
    sent            BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMP
);

-- Partial index: upcoming scheduled appointments only
CREATE INDEX idx_appt_upcoming ON appointments(scheduled_at, status)
    WHERE status = 'SCHEDULED';

-- Index for clinician availability lookups
CREATE INDEX idx_slots_clinician ON clinician_slots(clinician_id, day_of_week)
    WHERE active = true;

CREATE INDEX idx_reminders_pending ON appointment_reminders(remind_at)
    WHERE sent = false;
