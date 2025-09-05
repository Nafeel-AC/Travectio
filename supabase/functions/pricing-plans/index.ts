import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    let query = supabase.from('pricing_plans').select('*').eq('isActive', true);

    if (req.method === 'GET') {
      // Fetch all active pricing plans
      const { data: plans, error } = await query.order('minTrucks');
      if (error) throw error;

      return new Response(JSON.stringify(plans || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (req.method === 'POST') {
      // Accept filters from body (optional)
      const body = await req.json().catch(() => ({}));
      const { minTrucks, maxTrucks, planType } = body;

      if (minTrucks) query = query.gte('minTrucks', minTrucks);
      if (maxTrucks) query = query.lte('maxTrucks', maxTrucks);
      if (planType) query = query.eq('planType', planType);

      const { data: plans, error } = await query.order('minTrucks');
      if (error) throw error;

      return new Response(JSON.stringify(plans || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
