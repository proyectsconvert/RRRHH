import { createClient } from '@supabase/supabase-js';

// Use environment variables directly (available in Node.js environment)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceApplyMigration() {
  console.log('🚀 Force applying candidate fields migration...\n');

  try {
    // Try to execute SQL directly via REST API
    const sqlStatements = [
      'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cedula VARCHAR(20)',
      'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_date DATE',
      'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS application_source VARCHAR(50)',
      'CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)',
      'CREATE INDEX IF NOT EXISTS idx_candidates_cedula ON candidates(cedula)'
    ];

    console.log('📋 Attempting to execute SQL statements via REST API...\n');

    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`🔍 Executing ${i + 1}/${sqlStatements.length}: ${sql}`);

      try {
        // Try to execute via RPC function if it exists
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
          console.log(`⚠️  RPC failed: ${error.message}`);

          // Try direct REST API call
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey
            },
            body: JSON.stringify({ sql_query: sql })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log(`⚠️  REST API failed: ${response.status} - ${errorText}`);
          } else {
            console.log(`✅ REST API succeeded`);
          }
        } else {
          console.log(`✅ RPC succeeded`);
        }
      } catch (err) {
        console.log(`⚠️  Statement failed: ${err.message}`);
      }
    }

    console.log('\n🔍 Testing if new columns exist...');

    // Test by trying to select the new columns
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, cedula, birth_date, application_source')
        .limit(1);

      if (error) {
        console.log('❌ Cannot select new columns:', error.message);
        console.log('🔒 This suggests the columns do not exist yet');
      } else {
        console.log('✅ New columns are accessible!');
        console.log('Sample data:', data);
      }
    } catch (err) {
      console.log('❌ Test query failed:', err.message);
    }

    console.log('\n📋 Manual Application Required:');
    console.log('Since automatic migration failed, please apply manually:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run the SQL from APPLY_MIGRATION_NOW.md');
    console.log('3. Test the application form');

  } catch (error) {
    console.error('❌ Force migration failed:', error.message);
    process.exit(1);
  }
}

forceApplyMigration();