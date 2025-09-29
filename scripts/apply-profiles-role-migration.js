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

async function applyProfilesRoleMigration() {
  try {
    console.log('Applying profiles role migration...');

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250925180000_add_role_to_profiles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Migration SQL to execute:');
    console.log(migrationSQL);

    // Execute the migration using rpc (if available) or direct SQL
    // Since we can't execute raw SQL directly, we'll try to apply the changes programmatically

    console.log('Adding role column to profiles table...');

    // Try to add the column using a test query first
    const { error: testError } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);

    if (testError && testError.message.includes('column') && testError.message.includes('does not exist')) {
      console.log('Role column does not exist, attempting to add it...');

      // Since we can't execute DDL directly, we'll inform the user
      console.log('\n❌ Cannot apply DDL migrations directly via API.');
      console.log('Please apply the migration manually using one of these methods:');
      console.log('');
      console.log('Method 1 - Supabase Dashboard:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Open your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Run the SQL from: supabase/migrations/20250925180000_add_role_to_profiles.sql');
      console.log('');
      console.log('Method 2 - Supabase CLI:');
      console.log('1. Install Supabase CLI: npm install -g supabase');
      console.log('2. Login: supabase login');
      console.log('3. Link project: supabase link --project-ref YOUR_PROJECT_REF');
      console.log('4. Apply migrations: supabase db push');
      console.log('');
      console.log('After applying the migration, run: node scripts/migrate-profiles-role.js');

      return;
    }

    console.log('Role column already exists or migration already applied.');

    // Continue with data migration
    await runDataMigration();

  } catch (error) {
    console.error('Error applying profiles role migration:', error);
  }
}

async function runDataMigration() {
  try {
    console.log('Running data migration...');

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

    console.log('\nData migration completed successfully!');

  } catch (error) {
    console.error('Error during data migration:', error);
  }
}

applyProfilesRoleMigration();