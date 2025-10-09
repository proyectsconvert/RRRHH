const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying candidate access tokens migration...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20251009150000_create_candidate_access_tokens.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📋 SQL to execute:');
    console.log(sql);

    // Note: Direct SQL execution via RPC might not work with anon key
    // This SQL needs to be executed manually in Supabase SQL Editor
    console.log('\n⚠️  Please execute the above SQL manually in your Supabase SQL Editor');
    console.log('📍 Go to: Project Settings > SQL Editor > New Query');
    console.log('📍 Paste the SQL and click "Run"');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();