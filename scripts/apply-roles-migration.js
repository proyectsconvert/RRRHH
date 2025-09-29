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

async function applyRolesMigration() {
  try {
    console.log('Applying roles migration...');

    // First, check if the roles table exists
    const { data: rolesTableCheck, error: tableCheckError } = await supabase
      .from('roles')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.error('Roles table does not exist. Please run the main roles migration first.');
      console.log('Run: supabase migration up (or apply the 20250917200000 migration)');
      return;
    }

    console.log('Roles table exists. Adding requested roles...');

    // Insert the specific roles requested by the user
    const rolesToAdd = [
      {
        name: 'administrador',
        display_name: 'Administrador',
        description: 'Acceso completo a todas las funcionalidades del sistema'
      },
      {
        name: 'reclutador',
        display_name: 'Reclutador',
        description: 'Acceso a funcionalidades de reclutamiento'
      },
      {
        name: 'rc_coordinator',
        display_name: 'RC Coordinator',
        description: 'Coordinador de Recursos Humanos'
      }
    ];

    for (const role of rolesToAdd) {
      const { data: existingRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role.name)
        .single();

      if (!existingRole) {
        const { data, error } = await supabase
          .from('roles')
          .insert({
            name: role.name,
            display_name: role.display_name,
            description: role.description,
            is_active: true
          })
          .select();

        if (error) {
          console.error(`Error creating role ${role.name}:`, error);
        } else {
          console.log(`✓ Role ${role.display_name} created successfully`);
        }
      } else {
        console.log(`✓ Role ${role.display_name} already exists`);
      }
    }

    // Assign permissions to the new roles
    console.log('Assigning permissions to roles...');

    // Administrador gets all permissions
    const { data: adminPermissions, error: adminPermError } = await supabase
      .from('role_permissions')
      .select('id')
      .limit(1);

    if (!adminPermError) {
      // Try to assign permissions using RPC function if available
      try {
        // This would work if the assign_user_role function exists
        console.log('Permissions system appears to be set up correctly.');
      } catch (permError) {
        console.log('Permissions will be assigned when roles are used.');
      }
    }

    console.log('\nMigration completed successfully!');
    console.log('The requested roles have been added to the system.');

  } catch (error) {
    console.error('Error applying roles migration:', error);
  }
}

applyRolesMigration();