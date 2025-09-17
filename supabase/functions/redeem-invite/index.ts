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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    const { token } = await req.json();
    if (!token) throw new Error('token required');

    // Caller must be authenticated (magic link or password)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('No authorization header');
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userRes } = await supabase.auth.getUser(jwt);
    const user = userRes?.user;
    if (!user) throw new Error('Invalid token');

    // Find invite
    const { data: invite, error: inviteErr } = await supabase
      .from('beta_invites')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (inviteErr) throw inviteErr;
    if (!invite) throw new Error('Invalid invite token');
    if (invite.used_at) throw new Error('Invite already used');
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) throw new Error('Invite expired');
    if (invite.email && invite.email.toLowerCase() !== (user.email || '').toLowerCase()) {
      throw new Error('Invite email does not match logged-in user');
    }

    // Upsert tester row
    const { error: testerErr } = await supabase
      .from('beta_testers')
      .upsert({ email: (user.email || '').toLowerCase(), is_active: true }, { onConflict: 'email' });
    if (testerErr) throw testerErr;

    // Mark invite used
    const { error: usedErr } = await supabase
      .from('beta_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id);
    if (usedErr) throw usedErr;

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('redeem-invite error', e);
    return new Response(JSON.stringify({ error: e.message || 'internal error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});


