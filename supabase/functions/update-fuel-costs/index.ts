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

    const { truckId } = await req.json()

    if (!truckId) {
      throw new Error('Truck ID is required')
    }

    // Get current week's start and end dates
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Get fuel purchases attached to loads for this truck
    const { data: fuelPurchases, error: fuelError } = await supabaseClient
      .from('fuel_purchases')
      .select('*')
      .eq('truckId', truckId)
      .not('loadId', 'is', null)

    if (fuelError) throw fuelError

    const attachedFuelPurchases = fuelPurchases.filter(purchase => purchase.loadId !== null)

    // Calculate fuel costs and consumption
    const totalFuelCost = attachedFuelPurchases.reduce((sum, purchase) => sum + (purchase.totalCost || 0), 0)
    const totalGallons = attachedFuelPurchases.reduce((sum, purchase) => sum + (purchase.gallons || 0), 0)
    const avgFuelPrice = totalGallons > 0 ? totalFuelCost / totalGallons : 0

    // Get loads for this truck during the current week
    const { data: allLoads, error: loadsError } = await supabaseClient
      .from('loads')
      .select('*')
      .eq('truckId', truckId)

    if (loadsError) throw loadsError

    const weeklyLoads = allLoads.filter(load => {
      const loadDate = new Date(load.createdAt || load.deliveryDate || load.pickupDate || now)
      return loadDate >= weekStart && loadDate <= weekEnd
    })

    // Calculate total miles
    const totalRevenueMiles = weeklyLoads.reduce((sum, load) => sum + (load.miles || 0), 0)
    const totalDeadheadMiles = weeklyLoads.reduce((sum, load) => sum + (load.deadheadMiles || 0), 0)
    const totalMilesWithDeadhead = totalRevenueMiles + totalDeadheadMiles

    // Get latest cost breakdown
    const { data: latestBreakdown, error: breakdownError } = await supabaseClient
      .from('truck_cost_breakdown')
      .select('*')
      .eq('truckId', truckId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (breakdownError && breakdownError.code !== 'PGRST116') throw breakdownError

    if (latestBreakdown) {
      // Recalculate total variable costs including fuel (IFTA moved to fixed costs)
      const totalVariableCosts = (latestBreakdown.driverPay || 0) + totalFuelCost + 
        (latestBreakdown.maintenance || 0) + 
        (latestBreakdown.tolls || 0) + (latestBreakdown.dwellTime || 0) + 
        (latestBreakdown.reeferFuel || 0) + (latestBreakdown.truckParking || 0)

      const totalWeeklyCosts = latestBreakdown.totalFixedCosts + totalVariableCosts
      const costPerMile = totalMilesWithDeadhead > 0 ? 
        Number((totalWeeklyCosts / totalMilesWithDeadhead).toFixed(3)) : 
        Number((totalWeeklyCosts / 3000).toFixed(3))

      // Calculate accurate MPG
      const milesPerGallon = totalGallons > 0 && totalMilesWithDeadhead > 0 ? 
        Number((totalMilesWithDeadhead / totalGallons).toFixed(2)) : 0

      // Update existing breakdown
      const { error: updateError } = await supabaseClient
        .from('truck_cost_breakdown')
        .update({
          fuel: totalFuelCost,
          gallonsUsed: totalGallons,
          avgFuelPrice: avgFuelPrice,
          milesPerGallon: milesPerGallon,
          milesThisWeek: totalRevenueMiles,
          totalMilesWithDeadhead: totalMilesWithDeadhead,
          totalVariableCosts,
          totalWeeklyCosts,
          costPerMile,
          updatedAt: new Date().toISOString()
        })
        .eq('id', latestBreakdown.id)

      if (updateError) throw updateError

      // Update truck's variable costs
      const { error: truckUpdateError } = await supabaseClient
        .from('trucks')
        .update({
          variableCosts: totalVariableCosts,
          updatedAt: new Date().toISOString()
        })
        .eq('id', truckId)

      if (truckUpdateError) throw truckUpdateError

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Fuel costs updated successfully',
          breakdownId: latestBreakdown.id,
          totalFuelCost,
          totalGallons,
          avgFuelPrice,
          milesPerGallon,
          costPerMile
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (totalFuelCost > 0) {
      // Create new breakdown
      const milesPerGallon = totalGallons > 0 && totalMilesWithDeadhead > 0 ? 
        Number((totalMilesWithDeadhead / totalGallons).toFixed(2)) : 0

      const { data: newBreakdown, error: createError } = await supabaseClient
        .from('truck_cost_breakdown')
        .insert({
          truckId,
          fuel: totalFuelCost,
          gallonsUsed: totalGallons,
          avgFuelPrice: avgFuelPrice,
          milesPerGallon: milesPerGallon,
          milesThisWeek: totalMilesWithDeadhead > 0 ? totalMilesWithDeadhead : 3000,
          totalMilesWithDeadhead: totalMilesWithDeadhead > 0 ? totalMilesWithDeadhead : 3000,
          totalFixedCosts: 0,
          totalVariableCosts: totalFuelCost,
          totalWeeklyCosts: totalFuelCost,
          costPerMile: 0,
          weekStarting: weekStart.toISOString(),
          weekEnding: weekEnd.toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      return new Response(
        JSON.stringify({
          success: true,
          message: 'New cost breakdown created',
          breakdownId: newBreakdown.id,
          totalFuelCost,
          totalGallons,
          avgFuelPrice,
          milesPerGallon
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'No fuel costs to update' }),
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
