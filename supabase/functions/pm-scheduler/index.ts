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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Run the daily PM generation
    const { data: result, error } = await supabase
      .rpc('run_daily_pm_generation')

    if (error) {
      console.error('Error running daily PM generation:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to run PM generation',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get recent notifications for reporting
    const { data: notifications } = await supabase
      .from('pm_notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get critical alerts
    const { data: criticalAlerts } = await supabase
      .from('pm_notifications')
      .select('*')
      .eq('notification_type', 'urgent')
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    const response = {
      success: true,
      message: 'Daily PM generation completed successfully',
      result: result[0], // The function returns a table, so we get the first row
      recentNotifications: notifications || [],
      criticalAlerts: criticalAlerts || [],
      timestamp: new Date().toISOString()
    }

    console.log('PM Generation completed:', response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in PM scheduler:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 