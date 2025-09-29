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

async function applyMigrationDirect() {
  console.log('🔄 Applying candidate fields migration directly...\n');

  try {
    console.log('📋 Migration SQL to apply:');
    const migrationSQL = `
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_date DATE;
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS application_source VARCHAR(50);
      CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
      CREATE INDEX IF NOT EXISTS idx_candidates_cedula ON candidates(cedula);
      COMMENT ON COLUMN candidates.cedula IS 'National ID number of the candidate';
      COMMENT ON COLUMN candidates.birth_date IS 'Date of birth of the candidate';
      COMMENT ON COLUMN candidates.application_source IS 'How the candidate found the job opportunity';
    `;

    console.log(migrationSQL);
    console.log('\n---\n');

    // Since we can't execute DDL directly from client, we'll provide instructions
    console.log('⚠️  Cannot apply migration automatically from client side.');
    console.log('🔧 Please apply this migration manually:');
    console.log('');
    console.log('📋 Option 1 - Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('2. Copy and paste the SQL above');
    console.log('3. Click "Run"');
    console.log('');
    console.log('📋 Option 2 - Supabase CLI (if you have access):');
    console.log('1. Run: supabase db push');
    console.log('2. Or apply the migration file: supabase/migrations/20250924180000_add_candidate_fields.sql');
    console.log('');
    console.log('📋 Option 3 - Direct SQL execution:');
    console.log('Execute the SQL above directly in your PostgreSQL database');
    console.log('');

    // Test if we can at least verify the current state
    console.log('🔍 Testing current database access...');

    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, first_name, email')
        .limit(1);

      if (error) {
        console.log('❌ Database access failed:', error.message);
        console.log('💡 This might be due to RLS policies. The application form uses an edge function with service role access.');
      } else {
        console.log('✅ Database access successful');
        console.log('📊 Current candidates table is accessible');
      }
    } catch (err) {
      console.log('❌ Database connection error:', err.message);
    }

    console.log('\n🎯 After applying the migration:');
    console.log('✅ The application form will automatically use the new fields');
    console.log('✅ Candidates will be stored with cedula, birth_date, and application_source');
    console.log('✅ Data will be properly structured instead of JSON in analysis_summary');

  } catch (error) {
    console.error('❌ Migration setup failed:', error.message);
    process.exit(1);
  }
}

applyMigrationDirect();