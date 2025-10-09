-- EMERGENCY FIX: Complete removal of ALL RLS restrictions for candidate document access
-- This makes the candidates, applications, and candidate_documents tables completely public

-- Disable RLS completely for these tables (temporary emergency fix)
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS but with completely open policies
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow authenticated read for candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated insert for candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated update for candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated delete for candidates" ON candidates;
DROP POLICY IF EXISTS "Allow public insert for candidates" ON candidates;
DROP POLICY IF EXISTS "Allow public read for candidates in hiring process" ON candidates;
DROP POLICY IF EXISTS "Allow public read for all candidates" ON candidates;

DROP POLICY IF EXISTS "Allow authenticated read for applications" ON applications;
DROP POLICY IF EXISTS "Allow authenticated insert for applications" ON applications;
DROP POLICY IF EXISTS "Allow authenticated update for applications" ON applications;
DROP POLICY IF EXISTS "Allow authenticated delete for applications" ON applications;
DROP POLICY IF EXISTS "Allow public insert for applications" ON applications;
DROP POLICY IF EXISTS "Allow public read for applications in hiring process" ON applications;
DROP POLICY IF EXISTS "Allow public read for all applications" ON applications;

DROP POLICY IF EXISTS "Users can view candidate documents" ON candidate_documents;
DROP POLICY IF EXISTS "Users can insert candidate documents" ON candidate_documents;
DROP POLICY IF EXISTS "Users can update candidate documents" ON candidate_documents;
DROP POLICY IF EXISTS "Users can delete candidate documents" ON candidate_documents;
DROP POLICY IF EXISTS "Public can view candidate documents" ON candidate_documents;

-- Create COMPLETELY OPEN policies (emergency access)
CREATE POLICY "emergency_public_access_candidates" ON candidates
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "emergency_public_access_applications" ON applications
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "emergency_public_access_documents" ON candidate_documents
FOR ALL
TO public
USING (true)
WITH CHECK (true);