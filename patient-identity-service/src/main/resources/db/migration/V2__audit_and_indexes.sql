-- V2: patient_facility_links + extra indexes

CREATE TABLE IF NOT EXISTS patient_facility_links (
    id              BIGSERIAL PRIMARY KEY,
    patient_mpi_id  VARCHAR(20) NOT NULL,
    facility_id     VARCHAR(50) NOT NULL,
    facility_name   VARCHAR(100) NOT NULL,
    linked_by       BIGINT,
    linked_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(patient_mpi_id, facility_id)
);

CREATE INDEX idx_pfl_mpi_id   ON patient_facility_links(patient_mpi_id);
CREATE INDEX idx_pfl_facility  ON patient_facility_links(facility_id);
CREATE INDEX idx_patients_active ON patients(active) WHERE active = true;
