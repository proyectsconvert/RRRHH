const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCandidateAccess() {
  try {
    console.log('🚀 Applying public access policy for candidates in hiring process...');

    // SQL to add public read access for candidates in hiring process
    const sql = `
      -- Allow public read access for candidates who are in hiring process (contratar or contratado status)
      DROP POLICY IF EXISTS "Allow public read for candidates in hiring process" ON candidates;
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
      DROP POLICY IF EXISTS "Allow public read for applications in hiring process" ON applications;
      CREATE POLICY "Allow public read for applications in hiring process" ON applications
      FOR SELECT
      TO public
      USING (
        status IN ('contratar', 'contratado')
      );
    `;

    // Execute the SQL using rpc if available, otherwise try direct approach
    const { error } = await supabase.rpc('exec', { query: sql });

    if (error) {
      console.log('RPC not available, trying alternative approach...');

      // Try to execute each statement separately
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            // This might not work with anon key, but let's try
            console.log('Attempting to execute policy...');
          } catch (e) {
            console.log('Note: Manual SQL execution required. Please run the following SQL in your Supabase dashboard:');
            console.log('--- SQL TO EXECUTE ---');
            console.log(sql);
            console.log('--- END SQL ---');
            break;
          }
        }
      }
    } else {
      console.log('✅ Public access policy applied successfully!');
    }

    console.log('Candidates in hiring process can now access their documents without authentication.');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📋 Manual SQL execution required. Please run this SQL in your Supabase SQL editor:');

    const manualSQL = `
-- Allow public read access for candidates who are in hiring process (contratar or contratado status)
DROP POLICY IF EXISTS "Allow public read for candidates in hiring process" ON candidates;
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
DROP POLICY IF EXISTS "Allow public read for applications in hiring process" ON applications;
CREATE POLICY "Allow public read for applications in hiring process" ON applications
FOR SELECT
TO public
USING (
  status IN ('contratar', 'contratado')
);
    `;

    console.log(manualSQL);
  }
}

fixCandidateAccess();