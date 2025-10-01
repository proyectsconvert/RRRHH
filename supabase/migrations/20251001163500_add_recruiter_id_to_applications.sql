-- Add recruiter_id column to applications table to track which recruiter assigned interviews
ALTER TABLE applications
ADD COLUMN recruiter_id UUID REFERENCES profiles(id);

-- Add index for better performance
CREATE INDEX idx_applications_recruiter_id ON applications(recruiter_id);

-- Add comment
COMMENT ON COLUMN applications.recruiter_id IS 'ID of the recruiter who assigned this application status (especially for interviews)';