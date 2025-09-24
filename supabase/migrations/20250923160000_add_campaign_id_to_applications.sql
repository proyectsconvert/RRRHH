-- Add campaign_id column to applications table
ALTER TABLE applications ADD COLUMN campaign_id UUID REFERENCES campaigns(id);

-- Add index for better performance
CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);