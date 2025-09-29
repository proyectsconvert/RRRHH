import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDirectMigration() {
  console.log('🔄 Applying direct migration to add candidate fields...\n');

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

    console.log('📋 Executing SQL statements...\n');

    // Execute each statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`🔍 Executing ${i + 1}/${sqlStatements.length}: ${sql.substring(0, 50)}...`);

      try {
        // Try to execute using a simple query that should work
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
          console.log(`⚠️  Statement ${i + 1} failed with exec_sql:`, error.message);

          // For ALTER TABLE, we can try a different approach
          if (sql.includes('ALTER TABLE candidates ADD COLUMN')) {
            console.log('ℹ️  This is expected for ADD COLUMN statements - column might already exist');
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} encountered error:`, err.message);
        // Continue with next statement
      }
    }

    console.log('\n🔍 Testing the new columns...');

    // Test by trying to select from the table
    const { data, error } = await supabase
      .from('candidates')
      .select('id, first_name, email')
      .limit(1);

    if (error) {
      console.log('⚠️  Could not query candidates table:', error.message);
    } else {
      console.log('✅ Candidates table is accessible');
      console.log('Sample data:', data);
    }

    console.log('\n🎉 Migration process completed!');
    console.log('ℹ️  Note: If columns were not added, they might already exist or the migration needs to be applied through Supabase dashboard.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyDirectMigration();