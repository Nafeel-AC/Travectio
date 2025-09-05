import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get user from Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Parse request body
    const { planId, truckCount } = await req.json()

    if (!planId || !truckCount) {
      throw new Error('Missing planId or truckCount')
    }

    // Get pricing plan details - try by ID first, then by name
    let plan, planError;
    
    // First try to get by UUID (if planId is a UUID)
    if (planId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      const result = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('id', planId)
        .eq('isActive', true)
        .single()
      plan = result.data;
      planError = result.error;
    } else {
      // Try by name (like "starter", "growth", "enterprise")
      const result = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('name', planId)
        .eq('isActive', true)
        .single()
      plan = result.data;
      planError = result.error;
    }

    if (planError || !plan) {
      console.error('Plan lookup error:', planError, 'for planId:', planId);
      throw new Error('Invalid pricing plan')
    }

    // Validate truck count is within plan limits
    if (truckCount < plan.minTrucks || (plan.maxTrucks && truckCount > plan.maxTrucks)) {
      throw new Error(`Truck count ${truckCount} is outside plan limits`)
    }

    // Calculate subscription amount - always per truck pricing
    const subscriptionAmount = plan.pricePerTruck * truckCount

    // Get or create Stripe customer
    let stripeCustomerId: string

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripeCustomerId')
      .eq('userId', user.id)
      .single()

    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      stripeCustomerId = customer.id
    }

    // Create dynamic price for per-truck pricing
    const unitAmount = Math.round(plan.pricePerTruck * 100) // Convert to cents

    const priceData = {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Travectio Subscription',
          description: `Fleet management for ${truckCount} truck${truckCount > 1 ? 's' : ''}`,
        },
        unit_amount: unitAmount,
        recurring: {
          interval: 'month',
        },
      },
      quantity: truckCount,
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [priceData],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
        truckCount: truckCount.toString(),
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
          truckCount: truckCount.toString(),
        },
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
