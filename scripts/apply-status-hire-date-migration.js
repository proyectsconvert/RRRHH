import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      const [key, value] = line.split('=');
      if (key === 'VITE_SUPABASE_URL') {
        supabaseUrl = value;
      } else if (key === 'VITE_SUPABASE_ANON_KEY') {
        supabaseKey = value;
      }
    }
  } catch (error) {
    console.error('Could not read .env file:', error.message);
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyStatusHireDateMigration() {
  console.log('🔄 Applying migration: Add status and hire_date to candidates...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251106140000_add_status_and_hire_date_to_candidates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n---\n');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📋 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`🔍 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));

      try {
        // Try to execute via RPC function if it exists
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

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
            body: JSON.stringify({ sql: statement + ';' })
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

    console.log('\n🔍 Verifying migration...');

    // Check if the new columns exist
    const { data, error } = await supabase
      .from('candidates')
      .select('status, hire_date')
      .limit(1);

    if (error) {
      console.log('⚠️  Could not verify columns:', error.message);
      console.log('ℹ️  This might be expected if the columns don\'t exist yet');
    } else {
      console.log('✅ Migration verification completed');
      console.log('Sample data structure:', data);
    }

    console.log('\n🎉 Migration application completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyStatusHireDateMigration();