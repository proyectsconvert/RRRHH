#!/usr/bin/env node

/**
 * Script to create the candidate-documents bucket in Supabase Storage
 * Run this script with: node scripts/create-candidate-documents-bucket.js
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to set your service role key here or in environment variables
// Get this from your Supabase dashboard -> Settings -> API -> service_role key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kugocdtesaczbfrwblsi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need to add this

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to Settings -> API');
  console.log('3. Copy the "service_role" key (not the anon key)');
  console.log('4. Set it as an environment variable:');
  console.log('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.log('5. Run this script again');
  console.log('');
  console.log('⚠️  WARNING: Keep your service role key secure and never commit it to version control!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  try {
    console.log('🔍 Checking existing buckets...');

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    console.log('📦 Existing buckets:', buckets.map(b => b.name));

    const candidateDocsBucket = buckets.find(b => b.name === 'candidate-documents');

    if (candidateDocsBucket) {
      console.log('✅ candidate-documents bucket already exists!');
      return;
    }

    console.log('🆕 Creating candidate-documents bucket...');

    const { data, error } = await supabase.storage.createBucket('candidate-documents', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      console.log('');
      console.log('🔧 Alternative: Create the bucket manually in Supabase Dashboard');
      console.log('1. Go to https://supabase.com/dashboard/project/kugocdtesaczbfrwblsi/storage');
      console.log('2. Click "Create bucket"');
      console.log('3. Name: candidate-documents');
      console.log('4. Uncheck "Public bucket"');
      console.log('5. Click "Create bucket"');
    } else {
      console.log('✅ Bucket created successfully:', data);
      console.log('');
      console.log('🎉 The document upload functionality should now work!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createBucket();