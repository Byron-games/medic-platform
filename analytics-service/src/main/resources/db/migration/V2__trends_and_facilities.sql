-- V2: Weekly disease trends + facility reporting coverage

CREATE TABLE IF NOT EXISTS weekly_disease_trends (
    id              BIGSERIAL PRIMARY KEY,
    week_start      DATE NOT NULL,
    region          VARCHAR(100) NOT NULL,
    icd10_code      VARCHAR(10) NOT NULL,
    disease_name    VARCHAR(200) NOT NULL,
    case_count      INT NOT NULL DEFAULT 0,
    prev_week_count INT NOT NULL DEFAULT 0,
    trend           VARCHAR(10),     -- UP | DOWN | STABLE
    computed_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(week_start, region, icd10_code)
);

CREATE TABLE IF NOT EXISTS reporting_facilities (
    id              BIGSERIAL PRIMARY KEY,
    facility_id     VARCHAR(50) UNIQUE NOT NULL,
    facility_name   VARCHAR(100) NOT NULL,
    region          VARCHAR(100) NOT NULL,
    last_report_at  TIMESTAMP,
    total_reports   INT NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Upsert facility when they submit a case report
CREATE OR REPLACE FUNCTION update_reporting_facility()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO reporting_facilities (facility_id, facility_name, region, last_report_at, total_reports)
    VALUES (NEW.facility_id, 'Facility ' || NEW.facility_id, NEW.region, NOW(), 1)
    ON CONFLICT (facility_id) DO UPDATE
        SET last_report_at = NOW(),
            total_reports = reporting_facilities.total_reports + 1,
            region = EXCLUDED.region;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_facility
    AFTER INSERT ON disease_cases
    FOR EACH ROW EXECUTE FUNCTION update_reporting_facility();

-- Composite index for dashboard queries
CREATE INDEX idx_cases_region_date ON disease_cases(region, report_date);
CREATE INDEX idx_alerts_active ON outbreak_alerts(active, triggered_at)
    WHERE active = true;
