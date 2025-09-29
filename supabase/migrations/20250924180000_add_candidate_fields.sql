-- Add additional fields to candidates table for better data organization
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS application_source VARCHAR(50);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_cedula ON candidates(cedula);

-- Add comments for documentation
COMMENT ON COLUMN candidates.cedula IS 'National ID number of the candidate';
COMMENT ON COLUMN candidates.birth_date IS 'Date of birth of the candidate';
COMMENT ON COLUMN candidates.application_source IS 'How the candidate found the job opportunity';