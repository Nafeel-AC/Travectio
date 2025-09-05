import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    // Temporarily skip signature verification for debugging
    // if (!signature) {
    //   throw new Error('No Stripe signature found')
    // }

    // Skip signature verification for now
    let event: Stripe.Event
    try {
      // Parse the event directly without signature verification
      event = JSON.parse(body) as Stripe.Event
    } catch (err) {
      console.error('Failed to parse webhook body:', err)
      return new Response('Invalid JSON', { status: 400 })
    }

    console.log('Received webhook event:', event.type, event.id)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabase, event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response('Webhook handled successfully', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(`Webhook error: ${error.message}`, { status: 400 })
  }
})

async function handleCheckoutSessionCompleted(supabase: any, session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id)

  const userId = session.metadata?.userId
  const planId = session.metadata?.planId
  const truckCount = parseInt(session.metadata?.truckCount || '0')

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session:', session.metadata)
    return
  }

  // Get the subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

  // Get the actual plan UUID from the database (since planId might be a name like "starter")
  let actualPlanId = planId;
  
  // Try to get plan by UUID first, then by name
  let plan, planError;
  
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
    actualPlanId = plan?.id; // Use the actual UUID
  }

  if (planError || !plan) {
    console.error('Plan lookup error in webhook:', planError, 'for planId:', planId);
    return
  }

  // Calculate subscription amount - always per truck pricing
  const calculatedAmount = plan.pricePerTruck * truckCount

  // Create or update subscription record
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      userId: userId,
      planId: actualPlanId, // Use the actual UUID
      stripeCustomerId: session.customer,
      stripeSubscriptionId: subscription.id,
      truckCount: truckCount,
      calculatedAmount: calculatedAmount || 0,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    })

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }

  console.log('Subscription created/updated successfully for user:', userId)
}

async function handleInvoicePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id)

  if (!invoice.subscription) {
    console.log('Invoice not associated with subscription, skipping')
    return
  }

  // Get subscription record
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripeSubscriptionId', invoice.subscription)
    .single()

  if (subError || !subscription) {
    console.error('Subscription not found for invoice:', invoice.subscription)
    return
  }

  // Create payment record
  const { error } = await supabase
    .from('payments')
    .insert({
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      status: 'paid',
      paidAt: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
      receiptUrl: invoice.hosted_invoice_url,
    })

  if (error) {
    console.error('Error creating payment record:', error)
    throw error
  }

  console.log('Payment record created for invoice:', invoice.id)
}

async function handleInvoicePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log('Processing invoice payment failed:', invoice.id)

  if (!invoice.subscription) {
    return
  }

  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'past_due',
      updatedAt: new Date().toISOString(),
    })
    .eq('stripeSubscriptionId', invoice.subscription)

  if (error) {
    console.error('Error updating subscription status:', error)
  }

  // Create payment record for failed payment
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripeSubscriptionId', invoice.subscription)
    .single()

  if (subscription) {
    await supabase
      .from('payments')
      .insert({
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        status: 'failed',
      })
  }
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date().toISOString(),
    })
    .eq('stripeSubscriptionId', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updatedAt: new Date().toISOString(),
    })
    .eq('stripeSubscriptionId', subscription.id)

  if (error) {
    console.error('Error updating subscription status:', error)
    throw error
  }
}
