-- Fix Row Level Security policies for candidates table to allow public insertions
-- This is needed for the application form to work

-- First, enable RLS on candidates table if not already enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON candidates;

-- Create new policies that allow public read/insert for application form
-- Allow anyone to insert new candidates (for application form)
CREATE POLICY "Allow public insert for candidates" ON candidates
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users to read all candidates
CREATE POLICY "Allow authenticated read for candidates" ON candidates
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update candidates
CREATE POLICY "Allow authenticated update for candidates" ON candidates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete candidates
CREATE POLICY "Allow authenticated delete for candidates" ON candidates
FOR DELETE
TO authenticated
USING (true);

-- Also fix applications table RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON applications;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON applications;

-- Allow public insert for applications (needed for application form)
CREATE POLICY "Allow public insert for applications" ON applications
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users to read applications
CREATE POLICY "Allow authenticated read for applications" ON applications
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update applications
CREATE POLICY "Allow authenticated update for applications" ON applications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete applications
CREATE POLICY "Allow authenticated delete for applications" ON applications
FOR DELETE
TO authenticated
USING (true);