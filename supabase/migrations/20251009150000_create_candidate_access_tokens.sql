-- Create table for candidate access tokens
CREATE TABLE IF NOT EXISTS candidate_access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_candidate_access_tokens_token ON candidate_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_candidate_access_tokens_candidate_id ON candidate_access_tokens(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_access_tokens_expires_at ON candidate_access_tokens(expires_at);

-- Enable RLS
ALTER TABLE candidate_access_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public read access for token validation (candidates need to validate their own tokens)
CREATE POLICY "Allow public read for candidate access tokens" ON candidate_access_tokens
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create tokens
CREATE POLICY "Allow authenticated insert for candidate access tokens" ON candidate_access_tokens
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete tokens
CREATE POLICY "Allow authenticated delete for candidate access tokens" ON candidate_access_tokens
FOR DELETE
TO authenticated
USING (true);