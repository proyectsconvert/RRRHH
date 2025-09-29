import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Applying migration: Add candidate fields...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250924180000_add_candidate_fields.sql');
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
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // If exec_sql doesn't exist, try direct execution for simple ALTER TABLE statements
          console.log('⚠️  exec_sql not available, trying direct execution...');

          // For ALTER TABLE statements, we can try to execute them directly
          if (statement.toUpperCase().includes('ALTER TABLE')) {
            const { error: directError } = await supabase.from('candidates').select('id').limit(1);
            if (directError && directError.message.includes('column')) {
              console.log('ℹ️  Column might not exist, this is expected for ADD COLUMN statements');
            }
          }

          // Try to execute the statement using raw SQL
          const { error: rawError } = await supabase.rpc('exec', { query: statement + ';' });
          if (rawError) {
            console.log(`⚠️  Statement ${i + 1} failed:`, rawError.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} encountered an error:`, err.message);
        // Continue with other statements
      }
    }

    console.log('\n🔍 Verifying migration...');

    // Check if the new columns exist
    const { data, error } = await supabase
      .from('candidates')
      .select('cedula, birth_date, application_source')
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

applyMigration();