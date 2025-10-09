-- Add fields to track document re-upload requests
ALTER TABLE candidate_documents
ADD COLUMN needs_reupload BOOLEAN DEFAULT FALSE,
ADD COLUMN reupload_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reupload_requested_by TEXT;