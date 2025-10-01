
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log("Starting create-application function")
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // Using service role key to bypass RLS
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Error de configuración del servidor')
    }
    
    // Verify the authorization header is present
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      throw new Error('Se requiere autenticación para esta operación')
    }
    
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const body = await req.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      phoneCountry,
      cedula,
      birth_date,
      application_source,
      jobId,
      coverLetter,
      resumeUrl
    } = body
    
    console.log('Application data received:', {
      firstName,
      lastName,
      email,
      phone: phone ? '(hidden for privacy)' : null,
      phoneCountry,
      cedula,
      birth_date,
      application_source,
      jobId,
      resumeUrl: resumeUrl ? 'Resume URL provided' : 'No resume URL'
    })
    
    if (!firstName || !lastName || !email || !jobId) {
      console.error('Missing required fields:', { 
        firstName: !!firstName, 
        lastName: !!lastName, 
        email: !!email, 
        jobId: !!jobId 
      })
      throw new Error('Faltan campos requeridos para la aplicación')
    }
    
    // Verificar que el trabajo existe
    const { data: jobExists, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, type')
      .eq('id', jobId)
      .single()

    if (jobError || !jobExists) {
      console.error('Job not found:', jobId, jobError)
      throw new Error('La vacante seleccionada no existe')
    }

    // Log that migration needs to be applied manually
    console.log('Note: Migration for new candidate fields needs to be applied manually in Supabase Dashboard');
    console.log('SQL to run: ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cedula VARCHAR(20); etc.');

    // Format phone number correctly
    const formattedPhone = phoneCountry && phone ? `+${phoneCountry}${phone}` : null
    console.log('Formatted phone:', formattedPhone)
    
    // Explicitly log phone_country parameter to verify it's being passed correctly
    console.log('Phone country parameter:', phoneCountry || '')
    
    // Check if candidate already exists by email
    const { data: existingCandidate, error: checkError } = await supabaseAdmin
      .from('candidates')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing candidate:', checkError);
      throw new Error('Error al verificar candidato existente');
    }

    let candidateId: string;

    // Prepare data for database columns (migration should have been applied)
    const candidateData = {
      cedula: cedula || null,
      birth_date: birth_date ? new Date(birth_date).toISOString().split('T')[0] : null, // Convert to DATE format
      application_source: application_source || null
    };

    // Also keep structured data for backward compatibility and additional info
    const structuredData = {
      coverLetter: coverLetter || '',
      submittedAt: new Date().toISOString()
    };

    console.log('📋 Candidate data for columns:', candidateData);
    console.log('📋 Structured data to save:', structuredData);

    // Debug: Check if columns exist by trying a simple select
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('candidates')
        .select('cedula, birth_date, application_source')
        .limit(1);

      if (testError) {
        console.error('❌ Error checking column existence:', testError);
      } else {
        console.log('✅ Columns exist, sample data:', testData);
      }
    } catch (colError) {
      console.error('❌ Error testing columns:', colError);
    }

    if (existingCandidate) {
      // Update existing candidate
      candidateId = existingCandidate.id;

      const updateData = {
        first_name: firstName,
        last_name: lastName,
        phone: formattedPhone || null,
        phone_country: phoneCountry || null,
        resume_url: resumeUrl || null,
        cedula: candidateData.cedula,
        birth_date: candidateData.birth_date,
        application_source: candidateData.application_source,
        analysis_summary: JSON.stringify(structuredData),
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Updating candidate with data:', updateData);

      const { error: updateError } = await supabaseAdmin
        .from('candidates')
        .update(updateData)
        .eq('id', candidateId);

      if (updateError) {
        console.error('❌ Error updating candidate:', updateError);
        throw new Error('Error al actualizar candidato');
      }

      console.log('✅ Existing candidate updated successfully:', candidateId);
    } else {
      // Create new candidate
      const insertData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: formattedPhone || null,
        phone_country: phoneCountry || null,
        resume_url: resumeUrl || null,
        cedula: candidateData.cedula,
        birth_date: candidateData.birth_date,
        application_source: candidateData.application_source,
        analysis_summary: JSON.stringify(structuredData)
      };

      console.log('🆕 Creating new candidate with data:', insertData);

      const { data: newCandidate, error: insertError } = await supabaseAdmin
        .from('candidates')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error creating candidate:', insertError);
        throw new Error('Error al crear candidato');
      }

      candidateId = newCandidate.id;
      console.log('✅ New candidate created successfully:', candidateId);
    }

    // Create application record
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        status: 'new',
        campaign_id: jobExists.campaign_id || null
      })
      .select('id')
      .single();

    if (applicationError) {
      console.error('Error creating application:', applicationError);
      throw new Error('Error al crear aplicación');
    }

    console.log('Application created successfully with ID:', application.id);

    // Get the updated candidate data to verify it was saved correctly
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError) {
      console.error('Error fetching candidate data:', candidateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          application,
          candidate: candidate || null
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
    
  } catch (error) {
    console.error('Error in create-application function:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error al enviar la aplicación';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
  
})


