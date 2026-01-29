-- Add status and feedback columns to candidate_documents table
ALTER TABLE candidate_documents
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add check constraint for status values
ALTER TABLE candidate_documents
ADD CONSTRAINT check_document_status CHECK (status IN ('pending', 'approved', 'rejected'));
