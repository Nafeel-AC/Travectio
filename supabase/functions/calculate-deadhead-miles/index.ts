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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { truckId, deliveredLoadDestinationCity, deliveredLoadDestinationState } = await req.json()

    if (!truckId || !deliveredLoadDestinationCity || !deliveredLoadDestinationState) {
      throw new Error('Missing required parameters')
    }

    // Get all loads for this truck that don't have deadhead miles calculated yet
    const { data: allLoads, error: loadsError } = await supabaseClient
      .from('loads')
      .select('*')
      .eq('truckId', truckId)

    if (loadsError) throw loadsError

    const truckLoads = allLoads.filter(load => 
      load.status !== 'delivered' && 
      load.deadheadMiles === 0
    )

    if (truckLoads.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending loads found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sort loads by pickup date to find the next load
    const nextLoad = truckLoads.sort((a, b) => {
      const dateA = new Date(a.pickupDate || a.createdAt || '').getTime()
      const dateB = new Date(b.pickupDate || b.createdAt || '').getTime()
      return dateA - dateB
    })[0]

    if (!nextLoad || !nextLoad.originCity || !nextLoad.originState) {
      return new Response(
        JSON.stringify({ message: 'Next load has no complete origin location specified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate deadhead miles using a simple approximation
    // In production, you'd use a proper distance calculation API
    const deadheadMiles = Math.floor(Math.random() * 100) + 50 // Placeholder calculation

    if (deadheadMiles > 0) {
      // Update the next load with deadhead information
      const { error: updateError } = await supabaseClient
        .from('loads')
        .update({
          deadheadFromCity: deliveredLoadDestinationCity,
          deadheadFromState: deliveredLoadDestinationState,
          deadheadMiles: deadheadMiles,
          totalMilesWithDeadhead: nextLoad.miles + deadheadMiles,
          updatedAt: new Date().toISOString()
        })
        .eq('id', nextLoad.id)

      if (updateError) throw updateError

      // Create activity to log this automatic calculation
      await supabaseClient
        .from('activities')
        .insert({
          userId: nextLoad.userId,
          title: 'Deadhead miles auto-calculated',
          description: `${deadheadMiles} deadhead miles calculated from ${deliveredLoadDestinationCity}, ${deliveredLoadDestinationState} to ${nextLoad.originCity}, ${nextLoad.originState} for next load`,
          type: 'info',
          relatedTruckId: truckId,
          relatedLoadId: nextLoad.id,
          timestamp: new Date().toISOString()
        })

      return new Response(
        JSON.stringify({
          success: true,
          deadheadMiles,
          updatedLoadId: nextLoad.id,
          message: `Updated load ${nextLoad.id} with ${deadheadMiles} deadhead miles`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'No deadhead miles calculated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
