import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[pathParts.length - 1]

    // Ensure user can only access their own data (unless they're a founder)
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('isFounder')
      .eq('id', user.id)
      .single()

    const isFounder = userData?.isFounder === 1
    if (!isFounder && userId !== user.id) {
      throw new Error('Access denied')
    }

    if (req.method === 'GET') {
      // Handle both /payments/{userId} and /payments with userId in body
      let targetUserId = userId;
      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await req.json();
        targetUserId = body.userId || userId;
      }
      
      // Get user's payment history
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('userId', targetUserId)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        throw subError
      }

      if (!subscription) {
        return new Response(
          JSON.stringify([]),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('subscriptionId', subscription.id)
        .order('createdAt', { ascending: false })

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify(payments || []),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )
  } catch (error) {
    console.error('Error in payments function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
