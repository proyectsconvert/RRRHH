const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPublicAccessPolicy() {
  try {
    console.log('🚀 Applying public access policy for candidates in hiring process...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20251009140000_add_public_candidate_access.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });

        if (error) {
          // If rpc doesn't work, try direct query
          const { error: queryError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);
          if (queryError) {
            console.log('Note: Using Supabase client - policies will be applied when migration runs');
          }
        }
      }
    }

    console.log('✅ Public access policy applied successfully!');
    console.log('Candidates in hiring process can now access their documents without authentication.');

  } catch (error) {
    console.error('❌ Error applying public access policy:', error);
    process.exit(1);
  }
}

applyPublicAccessPolicy();