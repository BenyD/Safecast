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

    console.log('Starting incident expiration job...')

    // Get current timestamp
    const now = new Date().toISOString()
    
    // Find incidents that should be expired
    const { data: expiredIncidents, error: fetchError } = await supabaseClient
      .from('incidents')
      .select('id, title, created_at, expires_at')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lte('expires_at', now)

    if (fetchError) {
      console.error('Error fetching expired incidents:', fetchError)
      throw fetchError
    }

    if (!expiredIncidents || expiredIncidents.length === 0) {
      console.log('No incidents to expire')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No incidents to expire',
          expiredCount: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Found ${expiredIncidents.length} incidents to expire`)

    // Update expired incidents
    const { data: updatedIncidents, error: updateError } = await supabaseClient
      .from('incidents')
      .update({ 
        status: 'expired',
        updated_at: now
      })
      .in('id', expiredIncidents.map(incident => incident.id))
      .select('id, title')

    if (updateError) {
      console.error('Error updating expired incidents:', updateError)
      throw updateError
    }

    console.log(`Successfully expired ${updatedIncidents?.length || 0} incidents`)

    // Log expired incidents for monitoring
    if (updatedIncidents && updatedIncidents.length > 0) {
      console.log('Expired incidents:', updatedIncidents.map(incident => ({
        id: incident.id,
        title: incident.title
      })))
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully expired ${updatedIncidents?.length || 0} incidents`,
        expiredCount: updatedIncidents?.length || 0,
        expiredIncidents: updatedIncidents?.map(incident => ({
          id: incident.id,
          title: incident.title
        })) || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in expire-incidents function:', error)
    
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