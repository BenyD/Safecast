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

    console.log('Starting OTP cleanup job...')

    // Get current timestamp
    const now = new Date().toISOString()
    
    // Find expired OTP codes
    const { data: expiredOtps, error: fetchError } = await supabaseClient
      .from('otp_codes')
      .select('id, email, created_at, expires_at')
      .lt('expires_at', now)

    if (fetchError) {
      console.error('Error fetching expired OTPs:', fetchError)
      throw fetchError
    }

    if (!expiredOtps || expiredOtps.length === 0) {
      console.log('No expired OTPs to clean up')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired OTPs to clean up',
          cleanedCount: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Found ${expiredOtps.length} expired OTPs to clean up`)

    // Delete expired OTP codes
    const { data: deletedOtps, error: deleteError } = await supabaseClient
      .from('otp_codes')
      .delete()
      .in('id', expiredOtps.map(otp => otp.id))
      .select('id, email')

    if (deleteError) {
      console.error('Error deleting expired OTPs:', deleteError)
      throw deleteError
    }

    console.log(`Successfully cleaned up ${deletedOtps?.length || 0} expired OTPs`)

    // Log cleaned OTPs for monitoring
    if (deletedOtps && deletedOtps.length > 0) {
      console.log('Cleaned up OTPs:', deletedOtps.map(otp => ({
        id: otp.id,
        email: otp.email
      })))
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully cleaned up ${deletedOtps?.length || 0} expired OTPs`,
        cleanedCount: deletedOtps?.length || 0,
        cleanedOtps: deletedOtps?.map(otp => ({
          id: otp.id,
          email: otp.email
        })) || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in cleanup-expired-otps function:', error)
    
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
