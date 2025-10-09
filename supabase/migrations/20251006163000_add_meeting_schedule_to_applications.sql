-- Add meeting schedule columns to applications table
ALTER TABLE applications
ADD COLUMN meeting_date DATE,
ADD COLUMN meeting_time TIME,
ADD COLUMN meeting_link TEXT,
ADD COLUMN meeting_title TEXT;

-- Add comment to document the new columns
COMMENT ON COLUMN applications.meeting_date IS 'Scheduled date for the interview meeting';
COMMENT ON COLUMN applications.meeting_time IS 'Scheduled time for the interview meeting';
COMMENT ON COLUMN applications.meeting_link IS 'Teams meeting link for the interview';
COMMENT ON COLUMN applications.meeting_title IS 'Title of the scheduled meeting';