-- Add meeting details columns to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS meeting_modality TEXT CHECK (meeting_modality IN ('virtual', 'presencial')),
ADD COLUMN IF NOT EXISTS meeting_address TEXT,
ADD COLUMN IF NOT EXISTS meeting_notes TEXT,
ADD COLUMN IF NOT EXISTS meeting_status TEXT DEFAULT 'scheduled';

-- Add comments
COMMENT ON COLUMN applications.meeting_modality IS 'Modality of the meeting: virtual or presencial';
COMMENT ON COLUMN applications.meeting_address IS 'Physical address for presencial meetings';
COMMENT ON COLUMN applications.meeting_notes IS 'Notes or novelties regarding the meeting';
COMMENT ON COLUMN applications.meeting_status IS 'Status of the meeting: scheduled, completed, cancelled, rescheduled';
