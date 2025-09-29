import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApplicationForm() {
  console.log('🧪 Testing Application Form Data Storage...\n');

  try {
    // Test data similar to what the form would submit
    const testCandidate = {
      first_name: 'Juan',
      last_name: 'Pérez',
      email: `test-${Date.now()}@example.com`,
      phone: '3001234567',
      phone_country: '57',
      cedula: '1234567890',
      birth_date: '1990-05-15',
      application_source: 'computrabajo',
      resume_url: null,
      analysis_summary: 'Esta es una carta de presentación de prueba para el puesto de desarrollador.'
    };

    console.log('📝 Creating test candidate...');
    console.log('Data:', testCandidate);

    // Insert candidate
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert(testCandidate)
      .select()
      .single();

    if (candidateError) {
      throw new Error(`Error creating candidate: ${candidateError.message}`);
    }

    console.log('✅ Candidate created successfully!');
    console.log('Candidate ID:', candidate.id);
    console.log('Candidate data:', candidate);

    // Create a test application (assuming we have a job with ID 'job-001')
    console.log('\n📋 Creating test application...');

    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .insert({
        candidate_id: candidate.id,
        job_id: 'job-001', // Assuming this job exists
        status: 'new'
      })
      .select()
      .single();

    if (applicationError) {
      console.log('⚠️  Application creation failed (this is expected if job-001 doesn\'t exist):', applicationError.message);
    } else {
      console.log('✅ Application created successfully!');
      console.log('Application data:', application);
    }

    // Verify data was stored correctly
    console.log('\n🔍 Verifying stored data...');

    const { data: storedCandidate, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidate.id)
      .single();

    if (fetchError) {
      throw new Error(`Error fetching candidate: ${fetchError.message}`);
    }

    console.log('✅ Data verification successful!');
    console.log('Stored candidate:', storedCandidate);

    // Check that all fields are correctly stored
    const checks = [
      { field: 'first_name', expected: testCandidate.first_name, actual: storedCandidate.first_name },
      { field: 'last_name', expected: testCandidate.last_name, actual: storedCandidate.last_name },
      { field: 'email', expected: testCandidate.email, actual: storedCandidate.email },
      { field: 'phone', expected: testCandidate.phone, actual: storedCandidate.phone },
      { field: 'phone_country', expected: testCandidate.phone_country, actual: storedCandidate.phone_country },
      { field: 'cedula', expected: testCandidate.cedula, actual: storedCandidate.cedula },
      { field: 'birth_date', expected: testCandidate.birth_date, actual: storedCandidate.birth_date },
      { field: 'application_source', expected: testCandidate.application_source, actual: storedCandidate.application_source },
      { field: 'analysis_summary', expected: testCandidate.analysis_summary, actual: storedCandidate.analysis_summary }
    ];

    console.log('\n📊 Field validation:');
    let allValid = true;
    checks.forEach(check => {
      const valid = check.expected === check.actual;
      console.log(`${valid ? '✅' : '❌'} ${check.field}: ${check.actual} ${valid ? '(correct)' : `(expected: ${check.expected})`}`);
      if (!valid) allValid = false;
    });

    if (allValid) {
      console.log('\n🎉 All tests passed! Application form data storage is working correctly.');
    } else {
      console.log('\n⚠️  Some fields did not match expected values.');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');

    // Delete application first (if it was created)
    if (application) {
      await supabase.from('applications').delete().eq('id', application.id);
    }

    // Delete candidate
    await supabase.from('candidates').delete().eq('id', candidate.id);

    console.log('✅ Test data cleaned up successfully.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testApplicationForm();