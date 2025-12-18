
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

    // Format phone number correctly for WhatsApp format (without + and with @s.whatsapp.net)
    const whatsappFormattedPhone = phoneCountry && phone ? `${phoneCountry}${phone}@s.whatsapp.net` : null
    console.log('📱 Formatted phone for WhatsApp storage:', whatsappFormattedPhone)
    
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

    // Check if candidate already has an application for this specific job
    let existingApplication = null;
    if (existingCandidate) {
      const { data: appData, error: appError } = await supabaseAdmin
        .from('applications')
        .select('id, status')
        .eq('candidate_id', existingCandidate.id)
        .eq('job_id', jobId)
        .maybeSingle();

      if (appError && appError.code !== 'PGRST116') {
        console.error('Error checking existing application:', appError);
        throw new Error('Error al verificar aplicación existente');
      }

      existingApplication = appData;
    }

    // If candidate already has an application for this job, prevent duplicate
    if (existingApplication) {
      console.log('Candidate already has an application for this job:', existingApplication.id);
      throw new Error('Ya tienes una aplicación pendiente para esta vacante. No puedes postularte nuevamente.');
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
        phone: whatsappFormattedPhone || null, // Store WhatsApp formatted number
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
        email,
        phone: whatsappFormattedPhone || null, // Store WhatsApp formatted number
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

    // Send WhatsApp message to candidate thanking them and providing status check info
    try {
      if (candidate && candidate.phone) {
        const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || Deno.env.get('VITE_EVOLUTION_API_URL') || 'https://evolution-api-desarrollo.testbot.click';
        const evolutionApiToken = Deno.env.get('EVOLUTION_API_TOKEN') || Deno.env.get('VITE_EVOLUTION_API_TOKEN') || '26BEA03F1C6F-4FD3-B0B0-EADD25589851';
        const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE') || Deno.env.get('VITE_EVOLUTION_INSTANCE') || 'TestWPP';
        const botNumber = Deno.env.get('BOT_NUMBER') || Deno.env.get('VITE_BOT_NUMBER') || '3192463493';
        const appUrl = Deno.env.get('APP_URL') || 'https://convertia-rh.vercel.app'; // Default to production URL

        const statusCheckUrl = `${appUrl}/status-check`;

        const message = `¡Gracias ${firstName} por postularte a la vacante!\n\n` +
          `Para consultar el estado de tu postulación, sigue estos pasos:\n\n` +
          `1. Ve a: ${statusCheckUrl}\n` +
          `2. Ingresa tu número de cédula\n` +
          `3. Ingresa el código de verificación que recibirás por WhatsApp\n\n` +
          `¡Te deseamos suerte en el proceso!`;

        // Format phone number for Evolution API (candidate.phone already has @s.whatsapp.net)
        const formattedNumber = candidate.phone.includes('@s.whatsapp.net')
          ? candidate.phone
          : candidate.phone.startsWith('+')
          ? candidate.phone.substring(1) + '@s.whatsapp.net'
          : candidate.phone + '@s.whatsapp.net';

        console.log('📱 Sending WhatsApp message to:', formattedNumber);

        const evolutionResponse = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${evolutionApiToken}`,
            'apikey': evolutionApiToken,
          },
          body: JSON.stringify({
            number: formattedNumber,
            text: message.trim(),
          }),
        });

        if (!evolutionResponse.ok) {
          let errorMessage = `HTTP ${evolutionResponse.status}: ${evolutionResponse.statusText}`;
          try {
            const errorData = await evolutionResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            // Silent error parsing
          }
          console.error('❌ Error sending WhatsApp message:', errorMessage);
        } else {
          console.log('✅ WhatsApp message sent successfully');

          // Save message to historychat table
          const cleanPhoneNumber = candidate.phone.replace(/^\+/, '').replace('@s.whatsapp.net', '');
          const { error: historyError } = await supabaseAdmin
            .from('historychat')
            .insert({
              hicnumerouser: cleanPhoneNumber,
              hicusername: `${firstName} ${lastName}`,
              hicsendnumbot: botNumber,
              hicmessagebot: message.trim(),
              hicmessageuser: null,
            });

          if (historyError) {
            console.error('Error saving message to history:', historyError);
          } else {
            console.log('✅ Message saved to history');
          }
        }
      } else {
        console.log('⚠️ No phone number available for candidate, skipping WhatsApp message');
      }
    } catch (messageError) {
      console.error('Error sending WhatsApp message:', messageError);
      // Don't fail the application creation if message sending fails
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


