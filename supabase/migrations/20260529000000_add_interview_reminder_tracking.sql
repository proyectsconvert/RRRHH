-- Add reminder tracking columns to applications table
-- These track whether the 30-min and 15-min reminders have been sent

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS reminder_30_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_15_sent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN applications.reminder_30_sent_at IS 'Timestamp when the 30-minute reminder email was sent';
COMMENT ON COLUMN applications.reminder_15_sent_at IS 'Timestamp when the 15-minute reminder email was sent';
