import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    // Verify caller user and admin role
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: userRes } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (!user) throw new Error('Invalid token');

    const { data: adminUser } = await supabase
      .from('users')
      .select('id, "isAdmin", "isFounder"')
      .eq('id', user.id)
      .maybeSingle();
    if (!adminUser || (!(adminUser as any).isAdmin && !(adminUser as any).isFounder)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    if (req.method === 'GET' && action === 'list') {
      const { data, error } = await supabase
        .from('beta_invites')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ invites: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST' && action === 'create') {
      const { emails, expiresAt } = await req.json();
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        throw new Error('emails array required');
      }

      const rows = await Promise.all(emails.map(async (email: string) => {
        const token = randomToken(24);
        const insert = {
          email: email.trim().toLowerCase(),
          token,
          invited_by: user.id,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        } as any;
        const { data, error } = await supabase
          .from('beta_invites')
          .insert(insert)
          .select('*')
          .single();
        if (error) {
          // If unique violation, upsert token
          const { data: existing } = await supabase
            .from('beta_invites')
            .select('*')
            .eq('email', insert.email)
            .maybeSingle();
          if (existing) return existing;
          throw error;
        }
        return data;
      }));

      return new Response(JSON.stringify({ invites: rows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST' && action === 'revoke') {
      const { id } = await req.json();
      if (!id) throw new Error('id required');
      const { error } = await supabase.from('beta_invites').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
  } catch (e: any) {
    console.error('beta-invites error', e);
    return new Response(JSON.stringify({ error: e.message || 'internal error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});


