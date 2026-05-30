-- V2: Auth audit log + password reset tokens

CREATE TABLE IF NOT EXISTS auth_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username        VARCHAR(50),
    event_type      VARCHAR(50) NOT NULL,   -- LOGIN | LOGOUT | PASSWORD_CHANGE | LOCK | UNLOCK
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    success         BOOLEAN NOT NULL DEFAULT TRUE,
    detail          TEXT,
    occurred_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) UNIQUE NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON auth_audit_log(user_id, occurred_at DESC);
CREATE INDEX idx_audit_event ON auth_audit_log(event_type, occurred_at DESC);
CREATE INDEX idx_reset_token ON password_reset_tokens(token) WHERE used = FALSE;
