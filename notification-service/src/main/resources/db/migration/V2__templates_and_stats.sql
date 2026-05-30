-- V2: Notification templates + delivery stats view

CREATE TABLE IF NOT EXISTS notification_templates (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,     -- e.g. APPOINTMENT_REMINDER_EN
    language    VARCHAR(5) NOT NULL DEFAULT 'EN',
    subject     VARCHAR(200),
    body        TEXT NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Delivery stats view for Grafana dashboard
CREATE OR REPLACE VIEW notification_delivery_stats AS
SELECT
    DATE_TRUNC('hour', created_at) AS hour,
    message_type,
    provider,
    status,
    COUNT(*) AS count
FROM notifications
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC;

-- Index for retry job performance
CREATE INDEX IF NOT EXISTS idx_notif_retry
    ON notifications(status, attempts, created_at)
    WHERE status = 'FAILED' AND attempts < 3;

-- Seed built-in templates
INSERT INTO notification_templates (code, language, body)
VALUES
  ('APPOINTMENT_REMINDER_EN', 'EN',
   'M.E.D.I.C. Reminder: You have an appointment on %s at %s. Reply STOP to opt out.'),
  ('APPOINTMENT_REMINDER_FR', 'FR',
   'M.E.D.I.C. Rappel: Vous avez un rendez-vous le %s à %s. Répondez STOP pour vous désabonner.'),
  ('PRESCRIPTION_READY_EN', 'EN',
   'M.E.D.I.C.: Your prescription (Rx: %s) is ready for collection at %s.'),
  ('PRESCRIPTION_READY_FR', 'FR',
   'M.E.D.I.C.: Votre ordonnance (Rx: %s) est prête à être collectée à %s.'),
  ('TELEMEDICINE_INVITE_EN', 'EN',
   'M.E.D.I.C.: Your video consultation is ready. Join using code: %s or visit %s'),
  ('TELEMEDICINE_INVITE_FR', 'FR',
   'M.E.D.I.C.: Votre consultation vidéo est prête. Rejoignez avec le code: %s ou visitez %s')
ON CONFLICT DO NOTHING;
