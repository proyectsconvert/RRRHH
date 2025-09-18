// @ts-ignore - Deno import for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, data }: { action?: string; data?: any } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // N8N Workflow URL
    const n8nUrl = 'https://n8n.testbot.click/webhook/qpBj0IpMs21Q7zha'

    console.log('Proxying to N8N:', { action, data })

    // Prepare payload for N8N
    const payload = {
      action: action,
      workflowId: 'qpBj0IpMs21Q7zha',
      service: 'whatsapp-bot',
      timestamp: new Date().toISOString(),
      ...data
    }

    // Call N8N workflow
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()

    console.log('N8N Response:', responseData)

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `N8N Error: ${response.status}`,
          details: responseData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status
        }
      )
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Proxy error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})