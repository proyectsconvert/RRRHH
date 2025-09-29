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

async function applyCandidateFieldsMigration() {
  console.log('🔄 Applying candidate fields migration...\n');

  try {
    // SQL statements to add the new columns
    const sqlStatements = [
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cedula VARCHAR(20)`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_date DATE`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS application_source VARCHAR(50)`,
      `CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)`,
      `CREATE INDEX IF NOT EXISTS idx_candidates_cedula ON candidates(cedula)`,
      `COMMENT ON COLUMN candidates.cedula IS 'National ID number of the candidate'`,
      `COMMENT ON COLUMN candidates.birth_date IS 'Date of birth of the candidate'`,
      `COMMENT ON COLUMN candidates.application_source IS 'How the candidate found the job opportunity'`
    ];

    console.log('📋 Attempting to apply migration via edge function...\n');

    // Try to call an edge function to apply the migration
    const migrationData = {
      action: 'apply_migration',
      statements: sqlStatements
    };

    try {
      const response = await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/create-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(migrationData)
      });

      if (response.ok) {
        console.log('✅ Migration applied successfully via edge function');
        return;
      } else {
        console.log('⚠️  Edge function method failed, trying direct approach...');
      }
    } catch (error) {
      console.log('⚠️  Edge function method failed, trying direct approach...');
    }

    // Alternative: Try to test if we can access the table and see current structure
    console.log('🔍 Checking current table structure...');

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Cannot access candidates table:', error.message);
      console.log('🔒 This suggests RLS policies are blocking access');
      console.log('💡 You may need to apply the migration manually in Supabase Dashboard');
    } else {
      console.log('✅ Can access candidates table');
      if (data && data.length > 0) {
        console.log('📊 Current candidate structure:', Object.keys(data[0]));
      }
    }

    console.log('\n📋 Manual Migration Instructions:');
    console.log('Since automatic migration failed, please apply manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('2. Run the following SQL:');

    sqlStatements.forEach((sql, index) => {
      console.log(`${index + 1}. ${sql}`);
    });

    console.log('\n3. After applying, test the application form again');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyCandidateFieldsMigration();