-- Analytics Schema
CREATE TABLE IF NOT EXISTS disease_cases (
    id              BIGSERIAL PRIMARY KEY,
    report_date     DATE NOT NULL,
    region          VARCHAR(100) NOT NULL,
    facility_id     VARCHAR(50) NOT NULL,
    icd10_code      VARCHAR(10) NOT NULL,
    disease_name    VARCHAR(200) NOT NULL,
    case_count      INT NOT NULL DEFAULT 1,
    severity        VARCHAR(20),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbreak_alerts (
    id              BIGSERIAL PRIMARY KEY,
    icd10_code      VARCHAR(10) NOT NULL,
    disease_name    VARCHAR(200) NOT NULL,
    region          VARCHAR(100) NOT NULL,
    case_count      INT NOT NULL,
    threshold       INT NOT NULL,
    alert_level     VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMP
);

CREATE INDEX idx_cases_date_region ON disease_cases(report_date, region);
CREATE INDEX idx_cases_icd10 ON disease_cases(icd10_code);
