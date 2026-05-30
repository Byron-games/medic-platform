-- V2: Drug catalog + dispensing audit log

CREATE TABLE IF NOT EXISTS drug_catalog (
    id              BIGSERIAL PRIMARY KEY,
    generic_name    VARCHAR(200) NOT NULL,
    brand_names     TEXT[],
    drug_class      VARCHAR(100),
    atc_code        VARCHAR(20),          -- WHO ATC classification
    dosage_forms    TEXT[],               -- tablet, capsule, syrup, injection…
    standard_doses  TEXT[],               -- e.g. "500mg", "250mg/5ml"
    contraindications TEXT,
    common_interactions TEXT[],           -- generic names that interact
    requires_prescription BOOLEAN NOT NULL DEFAULT TRUE,
    available_in_cameroon BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispensing_log (
    id              BIGSERIAL PRIMARY KEY,
    prescription_id BIGINT NOT NULL REFERENCES prescriptions(id),
    medication_name VARCHAR(200) NOT NULL,
    quantity_dispensed VARCHAR(100),
    batch_number    VARCHAR(50),
    expiry_date     DATE,
    dispensed_by    BIGINT NOT NULL,
    dispensed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    notes           TEXT
);

-- Partial index: active (ISSUED/PARTIALLY_DISPENSED) prescriptions
CREATE INDEX idx_rx_active ON prescriptions(patient_mpi_id, status)
    WHERE status IN ('ISSUED', 'PARTIALLY_DISPENSED');

CREATE INDEX idx_rx_expires ON prescriptions(expires_at)
    WHERE status = 'ISSUED';

CREATE INDEX idx_drug_name ON drug_catalog USING gin(to_tsvector('english', generic_name));

-- Seed essential Cameroonian formulary drugs
INSERT INTO drug_catalog (generic_name, brand_names, drug_class, atc_code, dosage_forms, standard_doses, common_interactions, requires_prescription, available_in_cameroon)
VALUES
  ('Artemether-Lumefantrine', ARRAY['Coartem', 'Lonart'], 'Antimalarial', 'P01BF01', ARRAY['tablet'], ARRAY['20mg/120mg'], ARRAY['halofantrine', 'ketoconazole'], TRUE, TRUE),
  ('Amoxicillin', ARRAY['Amoxil', 'Clamoxyl'], 'Antibiotic', 'J01CA04', ARRAY['capsule', 'syrup'], ARRAY['250mg', '500mg', '125mg/5ml'], ARRAY['warfarin', 'methotrexate'], TRUE, TRUE),
  ('Paracetamol', ARRAY['Doliprane', 'Efferalgan', 'Tylenol'], 'Analgesic/Antipyretic', 'N02BE01', ARRAY['tablet', 'syrup', 'suppository'], ARRAY['500mg', '1000mg', '120mg/5ml'], ARRAY['warfarin'], FALSE, TRUE),
  ('Metformin', ARRAY['Glucophage'], 'Antidiabetic', 'A10BA02', ARRAY['tablet'], ARRAY['500mg', '850mg', '1000mg'], ARRAY['alcohol', 'iodinated contrast'], TRUE, TRUE),
  ('Amlodipine', ARRAY['Norvasc', 'Amlor'], 'Antihypertensive', 'C08CA01', ARRAY['tablet'], ARRAY['5mg', '10mg'], ARRAY['simvastatin', 'cyclosporine'], TRUE, TRUE),
  ('Azithromycin', ARRAY['Zithromax', 'Azithrine'], 'Antibiotic', 'J01FA10', ARRAY['tablet', 'syrup'], ARRAY['250mg', '500mg', '200mg/5ml'], ARRAY['warfarin', 'digoxin', 'amiodarone'], TRUE, TRUE),
  ('Oral Rehydration Salts', ARRAY['ORS', 'Dioralyte'], 'Electrolyte', 'A07CA', ARRAY['sachet'], ARRAY['standard sachet'], ARRAY[]::TEXT[], FALSE, TRUE),
  ('Mebendazole', ARRAY['Vermox', 'Sqworm'], 'Anthelmintic', 'P02CA01', ARRAY['tablet', 'syrup'], ARRAY['100mg', '500mg'], ARRAY[]::TEXT[], FALSE, TRUE),
  ('Cotrimoxazole', ARRAY['Bactrim', 'Septrin'], 'Antibiotic', 'J01EE01', ARRAY['tablet', 'syrup'], ARRAY['960mg', '480mg', '240mg/5ml'], ARRAY['warfarin', 'methotrexate', 'phenytoin'], TRUE, TRUE),
  ('Doxycycline', ARRAY['Vibramycin', 'Doxylin'], 'Antibiotic', 'J01AA02', ARRAY['capsule', 'tablet'], ARRAY['100mg', '200mg'], ARRAY['antacids', 'warfarin', 'oral contraceptives'], TRUE, TRUE)
ON CONFLICT DO NOTHING;
