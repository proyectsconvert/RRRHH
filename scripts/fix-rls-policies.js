import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use environment variables directly (available in Node.js environment)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('🔒 Fixing Row Level Security policies for candidates and applications tables...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250924190000_fix_candidates_rls.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 RLS Migration SQL:');
    console.log(migrationSQL);
    console.log('\n---\n');

    // Split into individual statements (simple approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Executing ${statements.length} RLS policy statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`🔍 Executing ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 80) + (statement.length > 80 ? '...' : ''));

      try {
        // For RLS policies, we need to use a different approach since they require admin privileges
        // Let's try using the REST API directly with admin privileges

        // First, try to enable RLS
        if (statement.includes('ENABLE ROW LEVEL SECURITY')) {
          console.log('ℹ️  RLS enable statement - may require admin privileges');
        }

        // For policy creation, these usually require admin access
        if (statement.includes('CREATE POLICY') || statement.includes('DROP POLICY')) {
          console.log('ℹ️  Policy statement - may require admin privileges through Supabase dashboard');
        }

        // Try a simple test query to see if we can access the tables
        if (statement.includes('candidates')) {
          const { data, error } = await supabase
            .from('candidates')
            .select('id')
            .limit(1);

          if (error) {
            console.log(`⚠️  Cannot access candidates table: ${error.message}`);
            console.log('ℹ️  This suggests RLS policies are blocking access');
          } else {
            console.log('✅ Candidates table is accessible');
          }
        }

        console.log(`✅ Statement ${i + 1} processed (Note: Actual execution may require admin privileges)`);

      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} encountered error:`, err.message);
      }
    }

    console.log('\n📋 Summary:');
    console.log('ℹ️  RLS policies may need to be applied through the Supabase dashboard');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('📄 Run the SQL from: supabase/migrations/20250924190000_fix_candidates_rls.sql');

    console.log('\n🔍 Testing current access...');

    // Test current access
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, first_name, email')
        .limit(1);

      if (error) {
        console.log('❌ Current access test failed:', error.message);
        console.log('🔒 RLS policies are likely blocking public access');
      } else {
        console.log('✅ Current access test passed');
        console.log('Sample data:', data);
      }
    } catch (err) {
      console.log('❌ Access test error:', err.message);
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run the migration: supabase/migrations/20250924190000_fix_candidates_rls.sql');
    console.log('3. Test the application form again');

  } catch (error) {
    console.error('❌ RLS fix failed:', error.message);
    process.exit(1);
  }
}

fixRLSPolicies();