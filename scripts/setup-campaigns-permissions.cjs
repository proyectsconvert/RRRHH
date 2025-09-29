const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCampaignsPermissions() {
  try {
    console.log('🔧 Setting up campaigns permissions...\n');

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ No authenticated user found');
      console.log('Please log in to the application first');
      return;
    }

    console.log('✅ Current user:', user.email);

    // 1. Ensure campaigns module exists
    console.log('\n1. Ensuring campaigns module exists...');
    const { data: existingModule, error: moduleCheckError } = await supabase
      .from('modules')
      .select('*')
      .eq('name', 'campaigns')
      .single();

    if (moduleCheckError && moduleCheckError.code !== 'PGRST116') {
      console.log('❌ Error checking modules:', moduleCheckError.message);
    }

    if (!existingModule) {
      console.log('Creating campaigns module...');
      const { error: createModuleError } = await supabase
        .from('modules')
        .insert({
          name: 'campaigns',
          display_name: 'Campañas',
          description: 'Gestión de campañas de reclutamiento',
          is_active: true
        });

      if (createModuleError) {
        console.log('❌ Error creating campaigns module:', createModuleError.message);
      } else {
        console.log('✅ Campaigns module created');
      }
    } else {
      console.log('✅ Campaigns module already exists');
    }

    // 2. Grant campaigns permission to current user
    console.log('\n2. Granting campaigns permission to user...');

    // First, remove any existing permission
    await supabase
      .from('user_module_permissions')
      .delete()
      .eq('user_id', user.id.toString())
      .eq('module_name', 'campaigns');

    // Then insert the new permission
    const { error: permissionError } = await supabase
      .from('user_module_permissions')
      .insert({
        user_id: user.id.toString(),
        module_name: 'campaigns',
        has_access: true
      });

    if (permissionError) {
      console.log('❌ Error granting campaigns permission:', permissionError.message);
    } else {
      console.log('✅ Campaigns permission granted to user');
    }

    // 3. Verify permission was granted
    console.log('\n3. Verifying permission...');
    const { data: verifyPermission, error: verifyError } = await supabase
      .from('user_module_permissions')
      .select('*')
      .eq('user_id', user.id.toString())
      .eq('module_name', 'campaigns');

    if (verifyError) {
      console.log('❌ Error verifying permission:', verifyError.message);
    } else if (verifyPermission && verifyPermission.length > 0) {
      console.log('✅ Permission verified successfully');
      console.log('Permission details:', verifyPermission[0]);
    } else {
      console.log('❌ Permission not found after granting');
    }

    console.log('\n🎉 Campaigns permissions setup completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh the application page');
    console.log('   2. Try accessing /admin/campaigns');
    console.log('   3. The temporary access override can now be removed from ModuleProtectedRoute.tsx');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupCampaignsPermissions();