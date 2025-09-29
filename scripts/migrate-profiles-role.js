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

async function migrateProfilesRole() {
  try {
    console.log('Starting profiles role migration...');

    // First, check if the role column exists in profiles
    const { data: testProfile, error: columnCheckError } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);

    if (columnCheckError) {
      console.error('Role column does not exist in profiles table. Please run the migration first.');
      console.log('Run: supabase db push or apply the 20250925180000 migration');
      return;
    }

    console.log('Role column exists in profiles table.');

    // Get all users with their roles from user_roles
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles(name)
      `)
      .eq('is_active', true);

    if (userRolesError) {
      console.error('Error fetching user roles:', userRolesError);
      return;
    }

    console.log(`Found ${userRolesData?.length || 0} user role assignments.`);

    // Update profiles with their primary role
    if (userRolesData && userRolesData.length > 0) {
      for (const userRole of userRolesData) {
        const roleName = userRole.roles?.name;
        if (roleName) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: roleName })
            .eq('id', userRole.user_id);

          if (updateError) {
            console.error(`Error updating role for user ${userRole.user_id}:`, updateError);
          } else {
            console.log(`✓ Updated role for user ${userRole.user_id}: ${roleName}`);
          }
        }
      }
    }

    // Verify the migration
    const { data: profilesWithRoles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .not('role', 'is', null)
      .limit(10);

    if (verifyError) {
      console.error('Error verifying migration:', verifyError);
    } else {
      console.log('\nMigration verification - Profiles with roles:');
      profilesWithRoles?.forEach(profile => {
        console.log(`  ${profile.email}: ${profile.role}`);
      });
    }

    console.log('\nProfiles role migration completed successfully!');
    console.log('Users now have their roles stored directly in the profiles table.');

  } catch (error) {
    console.error('Error during profiles role migration:', error);
  }
}

migrateProfilesRole();