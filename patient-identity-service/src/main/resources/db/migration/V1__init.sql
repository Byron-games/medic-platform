-- Patient Identity (MPI) Schema
CREATE TABLE IF NOT EXISTS patients (
    id              BIGSERIAL PRIMARY KEY,
    mpi_id          VARCHAR(20) UNIQUE NOT NULL,
    national_id     VARCHAR(50),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          VARCHAR(10) NOT NULL,
    blood_type      VARCHAR(5),
    phone_number    VARCHAR(20),
    email           VARCHAR(100),
    address         TEXT,
    region          VARCHAR(100),
    country         VARCHAR(50) NOT NULL DEFAULT 'Cameroon',
    primary_facility_id VARCHAR(50),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_mpi_id ON patients(mpi_id);
CREATE INDEX idx_patients_national_id ON patients(national_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
