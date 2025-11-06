-- Add status and hire_date columns to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add hire_date column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN candidates.status IS 'Current status of the candidate (e.g., contratado, proceso-contratacion, etc.)';
COMMENT ON COLUMN candidates.hire_date IS 'Date when the candidate was hired';
COMMENT ON COLUMN applications.hire_date IS 'Date when this specific application was hired';

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);