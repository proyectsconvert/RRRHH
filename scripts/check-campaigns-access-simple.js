const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCampaignsAccess() {
  try {
    console.log('🔍 Checking campaigns module access...\n');

    // 1. Get current user
    console.log('1. Getting current user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ No authenticated user found');
      console.log('Please make sure you are logged in to the application first');
      return;
    }

    console.log('✅ Current user:', user.email, `(ID: ${user.id})`);

    // 2. Check if modules table exists and has campaigns module
    console.log('\n2. Checking modules table...');
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('name', 'campaigns');

    if (modulesError) {
      console.log('❌ Modules table error:', modulesError.message);
      console.log('Creating campaigns module...\n');

      // Create campaigns module
      const { error: insertError } = await supabase
        .from('modules')
        .insert({
          name: 'campaigns',
          display_name: 'Campañas',
          description: 'Gestión de campañas de reclutamiento',
          is_active: true
        });

      if (insertError) {
        console.log('❌ Error creating campaigns module:', insertError.message);
      } else {
        console.log('✅ Campaigns module created successfully');
      }
    } else if (modules && modules.length > 0) {
      console.log('✅ Campaigns module exists:', modules[0].display_name);
    } else {
      console.log('⚠️  Campaigns module not found, creating...');

      const { error: insertError } = await supabase
        .from('modules')
        .insert({
          name: 'campaigns',
          display_name: 'Campañas',
          description: 'Gestión de campañas de reclutamiento',
          is_active: true
        });

      if (insertError) {
        console.log('❌ Error creating campaigns module:', insertError.message);
      } else {
        console.log('✅ Campaigns module created successfully');
      }
    }

    // 3. Check user permissions for campaigns
    console.log('\n3. Checking user permissions for campaigns...');
    const { data: permissions, error: permsError } = await supabase
      .from('user_module_permissions')
      .select('*')
      .eq('user_id', user.id.toString())
      .eq('module_name', 'campaigns');

    if (permsError) {
      console.log('❌ Error checking permissions:', permsError.message);
    } else if (permissions && permissions.length > 0) {
      console.log('✅ User has campaigns permissions:', permissions[0]);
    } else {
      console.log('⚠️  User does not have campaigns permissions, granting access...');

      const { error: grantError } = await supabase
        .from('user_module_permissions')
        .insert({
          user_id: user.id.toString(),
          module_name: 'campaigns',
          has_access: true
        });

      if (grantError) {
        console.log('❌ Error granting campaigns access:', grantError.message);
      } else {
        console.log('✅ Campaigns access granted successfully');
      }
    }

    // 4. Check campaigns table
    console.log('\n4. Checking campaigns table...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);

    if (campaignsError) {
      console.log('❌ Campaigns table error:', campaignsError.message);
    } else {
      console.log('✅ Campaigns table accessible');
    }

    // 5. Check responsable column
    console.log('\n5. Checking responsable column in campaigns...');
    const { data: testCampaign, error: testError } = await supabase
      .from('campaigns')
      .select('responsable')
      .limit(1);

    if (testError) {
      console.log('❌ Responsable column error:', testError.message);
      console.log('⚠️  You may need to run the migration for responsable column');
    } else {
      console.log('✅ Responsable column exists');
    }

    console.log('\n🎉 Campaigns access check completed!');
    console.log('\n💡 If you still can\'t access campaigns, try:');
    console.log('   1. Refresh the page');
    console.log('   2. Clear browser cache');
    console.log('   3. Check browser console for errors');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCampaignsAccess();