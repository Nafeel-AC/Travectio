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
    // Create Supabase client with service role key to bypass RLS
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

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const userId = user.id

    // Delete all user data in the correct order to avoid foreign key constraints
    console.log(`Starting account deletion for user: ${userId}`)

    // 1. Delete all trucks and their related data
    const { data: trucks } = await supabaseClient
      .from('trucks')
      .select('id')
      .eq('userId', userId)

    if (trucks && trucks.length > 0) {
      for (const truck of trucks) {
        // Delete cost breakdowns
        await supabaseClient
          .from('truck_cost_breakdown')
          .delete()
          .eq('truckId', truck.id)

        // Delete fuel purchases
        await supabaseClient
          .from('fuel_purchases')
          .delete()
          .eq('truckId', truck.id)

        // Delete loads
        await supabaseClient
          .from('loads')
          .delete()
          .eq('truckId', truck.id)

        // Delete HOS logs
        await supabaseClient
          .from('hos_logs')
          .delete()
          .eq('truckId', truck.id)

        // Delete truck integrations
        await supabaseClient
          .from('truck_integrations')
          .delete()
          .eq('truckId', truck.id)
      }

      // Delete all trucks
      await supabaseClient
        .from('trucks')
        .delete()
        .eq('userId', userId)
    }

    // 2. Delete all drivers and their related data
    const { data: drivers } = await supabaseClient
      .from('drivers')
      .select('id')
      .eq('userId', userId)

    if (drivers && drivers.length > 0) {
      for (const driver of drivers) {
        // Delete HOS logs
        await supabaseClient
          .from('hos_logs')
          .delete()
          .eq('driverId', driver.id)
      }

      // Delete all drivers
      await supabaseClient
        .from('drivers')
        .delete()
        .eq('userId', userId)
    }

    // 3. Delete all loads
    await supabaseClient
      .from('loads')
      .delete()
      .eq('userId', userId)

    // 4. Delete all load plans and legs
    const { data: loadPlans } = await supabaseClient
      .from('load_plans')
      .select('id')
      .eq('userId', userId)

    if (loadPlans && loadPlans.length > 0) {
      for (const plan of loadPlans) {
        // Delete load plan legs
        await supabaseClient
          .from('load_plan_legs')
          .delete()
          .eq('planId', plan.id)
      }

      // Delete load plans
      await supabaseClient
        .from('load_plans')
        .delete()
        .eq('userId', userId)
    }

    // 5. Delete all activities
    await supabaseClient
      .from('activities')
      .delete()
      .eq('userId', userId)

    // 6. Delete all sessions
    await supabaseClient
      .from('sessions')
      .delete()
      .eq('userId', userId)

    // 7. Delete all session audit logs
    await supabaseClient
      .from('session_audit_logs')
      .delete()
      .eq('userId', userId)

    // 8. Delete all subscriptions
    await supabaseClient
      .from('subscriptions')
      .delete()
      .eq('userId', userId)

    // 9. Delete all analytics data
    await supabaseClient
      .from('user_analytics')
      .delete()
      .eq('userId', userId)

    await supabaseClient
      .from('feature_analytics')
      .delete()
      .eq('userId', userId)

    // 10. Delete all fleet metrics
    await supabaseClient
      .from('fleet_metrics')
      .delete()
      .eq('userId', userId)

    // 11. Delete all fuel purchases
    await supabaseClient
      .from('fuel_purchases')
      .delete()
      .eq('userId', userId)

    // 12. Delete all load board items
    await supabaseClient
      .from('load_board')
      .delete()
      .eq('userId', userId)

    // 13. Delete all load stops
    const { data: loads } = await supabaseClient
      .from('loads')
      .select('id')
      .eq('userId', userId)

    if (loads && loads.length > 0) {
      for (const load of loads) {
        await supabaseClient
          .from('load_stops')
          .delete()
          .eq('loadId', load.id)
      }
    }

    // 14. Finally, delete the user account
    const { error: userError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) {
      throw new Error(`Failed to delete user: ${userError.message}`)
    }

    // 15. Delete the user from Supabase Auth
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId)
    
    if (authDeleteError) {
      console.warn(`Failed to delete user from auth: ${authDeleteError.message}`)
      // Don't throw error here as the main data is already deleted
    }

    console.log(`Account deletion completed for user: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all associated data deleted successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Account deletion error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
