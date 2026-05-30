-- V3: Staff ID, account status, REGISTRAR role

ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_id VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_role VARCHAR(30);

-- Existing users are all ACTIVE (they were created before approval flow)
UPDATE users SET account_status = 'ACTIVE' WHERE account_status IS NULL OR account_status = '';

-- Index for pending approval queries
CREATE INDEX idx_users_pending ON users(facility_id, account_status)
    WHERE account_status = 'PENDING';

-- Index for staff ID lookups
CREATE INDEX idx_users_staff_id ON users(staff_id) WHERE staff_id IS NOT NULL;