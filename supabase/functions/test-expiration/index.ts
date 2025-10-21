import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Creating test incident with short expiration...')

    // Create a test incident that expires in 1 minute
    const testIncident = {
      title: 'Test Incident - Will Expire Soon',
      description: 'This is a test incident that will expire in 1 minute',
      type: 'other',
      severity: 'low',
      location: 'POINT(80.2707 13.0827)', // Chennai coordinates
      address: 'Test Location, Chennai',
      status: 'active',
      expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      user_id: null
    }

    const { data: createdIncident, error: createError } = await supabaseClient
      .from('incidents')
      .insert([testIncident])
      .select('id, title, expires_at')
      .single()

    if (createError) {
      console.error('Error creating test incident:', createError)
      throw createError
    }

    console.log('Test incident created:', createdIncident)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test incident created successfully',
        incident: createdIncident,
        expiresIn: '1 minute',
        note: 'Run the expire-incidents function in 1 minute to see it get expired'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in test-expiration function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
