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

const defaultRoles = [
  {
    name: 'admin',
    display_name: 'Administrador',
    description: 'Acceso completo a todas las funcionalidades del sistema'
  },
  {
    name: 'recruiter',
    display_name: 'Reclutador',
    description: 'Acceso a funcionalidades de reclutamiento'
  },
  {
    name: 'rc_coordinator',
    display_name: 'RC Coordinator',
    description: 'Coordinador de Recursos Humanos'
  }
];

async function setupRoles() {
  try {
    console.log('Setting up roles system...');

    // Check if roles table exists and has data
    const { data: existingRoles, error: checkError } = await supabase
      .from('roles')
      .select('name')
      .limit(1);

    if (checkError) {
      console.log('Roles table does not exist or is not accessible. This is expected if migrations haven\'t been run.');
      console.log('Please run the database migrations first.');
      return;
    }

    console.log('Roles table exists. Checking for default roles...');

    // Insert default roles if they don't exist
    for (const role of defaultRoles) {
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

    // Verify roles were created
    const { data: allRoles, error: verifyError } = await supabase
      .from('roles')
      .select('name, display_name, is_active')
      .eq('is_active', true);

    if (verifyError) {
      console.error('Error verifying roles:', verifyError);
    } else {
      console.log('\nActive roles in system:');
      allRoles.forEach(role => {
        console.log(`  - ${role.display_name} (${role.name})`);
      });
    }

    console.log('\nRoles setup completed successfully!');

  } catch (error) {
    console.error('Error setting up roles:', error);
  }
}

setupRoles();