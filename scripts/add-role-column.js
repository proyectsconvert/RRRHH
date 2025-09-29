import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          envVars[key.trim()] = value.slice(1, -1);
        } else {
          envVars[key.trim()] = value;
        }
      }
    });
    Object.assign(process.env, envVars);
  }
}

loadEnvFile();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addRoleColumn() {
  try {
    console.log('Checking if role column exists in profiles table...');

    // Try to select the role column to see if it exists
    const { error: testError } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);

    if (testError) {
      console.log('Role column does not exist. Please add it manually using one of these methods:');
      console.log('');
      console.log('Method 1 - Supabase Dashboard:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Open your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Run this SQL:');
      console.log('');
      console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;');
      console.log('COMMENT ON COLUMN public.profiles.role IS \'Primary role of the user (administrador, reclutador, rc_coordinator)\';');
      console.log('CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);');
      console.log('');
      console.log('Method 2 - Direct SQL execution:');
      console.log('Execute the SQL above in your database directly.');
      console.log('');
      console.log('After adding the column, the application will work correctly.');
    } else {
      console.log('✅ Role column already exists in profiles table!');
      console.log('The application should work correctly now.');
    }

  } catch (error) {
    console.error('Error checking role column:', error);
  }
}

addRoleColumn();