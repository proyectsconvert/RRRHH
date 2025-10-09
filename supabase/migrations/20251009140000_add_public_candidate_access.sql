-- Add public read access for candidates in hiring process
-- This allows candidates to access their documents without authentication

-- Allow public read access for candidates who are in hiring process (contratar or contratado status)
CREATE POLICY "Allow public read for candidates in hiring process" ON candidates
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.candidate_id = candidates.id
    AND applications.status IN ('contratar', 'contratado')
  )
);

-- Also allow public read access for applications of candidates in hiring process
CREATE POLICY "Allow public read for applications in hiring process" ON applications
FOR SELECT
TO public
USING (
  status IN ('contratar', 'contratado')
);