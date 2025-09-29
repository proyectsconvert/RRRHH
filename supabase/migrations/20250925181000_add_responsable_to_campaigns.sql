-- Add responsable field to campaigns table
-- Migration: 20250925181000_add_responsable_to_campaigns.sql

-- Add responsable column to campaigns table (references profiles.id)
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS responsable TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.campaigns.responsable IS 'ID of the user responsible for this campaign (references profiles.id)';

-- Add foreign key constraint (optional, since profiles.id is the primary key)
-- ALTER TABLE public.campaigns
-- ADD CONSTRAINT campaigns_responsable_fkey
-- FOREIGN KEY (responsable) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_responsable ON public.campaigns(responsable);