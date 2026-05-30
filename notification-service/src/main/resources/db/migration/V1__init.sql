-- Notification Schema
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL PRIMARY KEY,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name  VARCHAR(100),
    message_type    VARCHAR(50) NOT NULL,
    message         TEXT NOT NULL,
    language        VARCHAR(5) NOT NULL DEFAULT 'EN',
    provider        VARCHAR(20) NOT NULL DEFAULT 'TWILIO',
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts        INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP,
    sent_at         TIMESTAMP,
    error_message   TEXT,
    reference_id    VARCHAR(100),
    reference_type  VARCHAR(50),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_status ON notifications(status);
CREATE INDEX idx_notif_phone ON notifications(recipient_phone);
