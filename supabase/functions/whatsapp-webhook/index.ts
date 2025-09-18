import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// N8N Workflow Proxy to avoid CORS issues
async function proxyToN8N(action: string, data: any) {
  const n8nUrl = 'https://n8n.testbot.click/webhook/qpBj0IpMs21Q7zha';

  try {
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        action: action,
        workflowId: 'qpBj0IpMs21Q7zha',
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`N8N HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for webhook processing
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Use service role for webhook processing (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse the webhook payload from Evolution API
    const webhookData = await req.json()

    // Evolution API webhook structure for messages
    // This may vary depending on the Evolution API version
    const messageData = webhookData

    // Check if this is a message event
    if (messageData.event === 'message' || messageData.type === 'message' || messageData.message) {
      const message = messageData.message || messageData
      const from = message.from || message.remoteJid || message.sender
      const body = message.body || message.text || message.content
      const timestamp = message.timestamp || message.created_at

      // Skip if no message body or sender
      if (!body || !from) {
        return new Response(JSON.stringify({ success: true, message: 'Skipped' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Clean the phone number (remove @s.whatsapp.net if present)
      const cleanPhoneNumber = from.replace('@s.whatsapp.net', '').replace('@c.us', '')

      // Skip messages from bot/status updates
      if (cleanPhoneNumber === 'status' || cleanPhoneNumber.includes('g.us')) {
        return new Response(JSON.stringify({ success: true, message: 'Skipped status/group' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get or create user profile
      let userName = cleanPhoneNumber // Default to phone number

      // Try to get existing user data
      const { data: existingUser } = await supabase
        .from('historychat')
        .select('hicusername')
        .eq('hicnumerouser', cleanPhoneNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingUser) {
        userName = existingUser.hicusername
      } else {
        // Try to extract name from message if it's a greeting
        const lowerBody = body.toLowerCase()
        if (lowerBody.includes('hola') || lowerBody.includes('hello') || lowerBody.includes('buenos')) {
          // For now, keep the phone number as name
          // In a real implementation, you might want to prompt for name
          userName = `Usuario ${cleanPhoneNumber.slice(-4)}`
        }
      }

      // Save the incoming message to database
      const { data: savedMessage, error: saveError } = await supabase
        .from('historychat')
        .insert({
          hicnumerouser: cleanPhoneNumber,
          hicusername: userName,
          hicsendnumbot: null, // No bot number for incoming messages
          hicmessagebot: null, // Bot message is null for incoming
          hicmessageuser: body, // User message content
        })
        .select()
        .single()

      if (saveError) {
        throw new Error(`Failed to save message: ${saveError.message}`)
      }

      // Optional: Send auto-response or trigger chatbot
      // You can add logic here to automatically respond to messages
      // For example, integrate with OpenAI or your chatbot system

      return new Response(JSON.stringify({
        success: true,
        message: 'Message processed successfully',
        savedMessage: savedMessage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle other webhook events (connection status, etc.)

    return new Response(JSON.stringify({
      success: true,
      message: 'Event received but not processed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})