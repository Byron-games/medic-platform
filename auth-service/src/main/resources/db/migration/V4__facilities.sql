-- V4: Facility registry — hospitals registered on the M.E.D.I.C. network

CREATE TABLE IF NOT EXISTS facilities (
    id              BIGSERIAL PRIMARY KEY,
    facility_id     VARCHAR(20) UNIQUE NOT NULL,  -- e.g. CMR-YDE-001
    name            VARCHAR(200) NOT NULL,
    region          VARCHAR(100) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    facility_type   VARCHAR(50) NOT NULL,         -- HOSPITAL | CLINIC | HEALTH_CENTRE | PHARMACY
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(100),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_facilities_region ON facilities(region, active);

-- Seed Cameroonian hospitals
INSERT INTO facilities (facility_id, name, region, city, facility_type, phone) VALUES
  ('CMR-YDE-001', 'Hôpital Central de Yaoundé',           'Centre',       'Yaoundé', 'HOSPITAL', '+237 222 230 462'),
  ('CMR-YDE-002', 'Centre Hospitalier Universitaire de Yaoundé (CHUY)', 'Centre', 'Yaoundé', 'HOSPITAL', '+237 222 312 333'),
  ('CMR-YDE-003', 'Hôpital Général de Yaoundé',           'Centre',       'Yaoundé', 'HOSPITAL', '+237 222 230 010'),
  ('CMR-DLA-001', 'Hôpital Général de Douala',             'Littoral',     'Douala',  'HOSPITAL', '+237 233 420 000'),
  ('CMR-DLA-002', 'Hôpital Laquintinie de Douala',         'Littoral',     'Douala',  'HOSPITAL', '+237 233 425 800'),
  ('CMR-BDA-001', 'Bamenda Regional Hospital',              'Nord-Ouest',   'Bamenda', 'HOSPITAL', '+237 233 362 040'),
  ('CMR-BFG-001', 'Bafoussam Regional Hospital',            'Ouest',        'Bafoussam','HOSPITAL','+237 233 445 200'),
  ('CMR-GAR-001', 'Garoua Regional Hospital',               'Nord',         'Garoua',  'HOSPITAL', '+237 222 271 060'),
  ('CMR-MAR-001', 'Maroua Regional Hospital',               'Extrême-Nord', 'Maroua',  'HOSPITAL', '+237 222 291 206'),
  ('CMR-BER-001', 'Bertoua Regional Hospital',              'Est',          'Bertoua', 'HOSPITAL', '+237 222 243 043'),
  ('CMR-EBO-001', 'Ebolowa Regional Hospital',              'Sud',          'Ebolowa', 'HOSPITAL', '+237 222 281 239'),
  ('CMR-LIM-001', 'Limbé Regional Hospital',                'Sud-Ouest',    'Limbé',   'HOSPITAL', '+237 233 332 244'),
  ('CMR-NGD-001', 'Ngaoundéré Regional Hospital',           'Adamaoua',     'Ngaoundéré','HOSPITAL','+237 222 251 341'),
  ('CMR-KRI-001', 'Kribi District Hospital',                'Sud',          'Kribi',   'HOSPITAL', '+237 233 461 234'),
  ('CMR-EDC-001', 'Édéa District Hospital',                 'Littoral',     'Édéa',    'HOSPITAL', '+237 233 468 010')
ON CONFLICT DO NOTHING;