-- V2: USSD analytics + menu navigation tracking

CREATE TABLE IF NOT EXISTS ussd_analytics (
    id              BIGSERIAL PRIMARY KEY,
    phone_number    VARCHAR(20) NOT NULL,
    session_id      VARCHAR(100) NOT NULL,
    menu_visited    VARCHAR(50) NOT NULL,
    input           VARCHAR(20),
    language        VARCHAR(5) NOT NULL DEFAULT 'EN',
    occurred_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Track which menus are most used (for UX improvement)
CREATE INDEX idx_ussd_menu ON ussd_analytics(menu_visited, occurred_at);

-- Ended/timed-out sessions cleanup index
CREATE INDEX idx_ussd_status ON ussd_sessions(status, updated_at)
    WHERE status = 'ACTIVE';

-- Daily unique callers view
CREATE OR REPLACE VIEW ussd_daily_stats AS
SELECT
    DATE(created_at) AS day,
    COUNT(DISTINCT phone_number) AS unique_callers,
    COUNT(*) AS total_sessions,
    language,
    AVG(ARRAY_LENGTH(input_history, 1)) AS avg_menu_depth
FROM ussd_sessions
GROUP BY 1, 4
ORDER BY 1 DESC;
