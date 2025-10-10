import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  console.log(`Received ${req.method} request to dynamic-action`);
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    console.log("Checking environment variables...");
    if (!RESEND_API_KEY || !APP_URL) {
      console.error("Missing environment variables:", {
        RESEND_API_KEY: !!RESEND_API_KEY,
        APP_URL: !!APP_URL
      });
      
      return new Response(JSON.stringify({ 
        error: "Missing environment variables. Please check RESEND_API_KEY and APP_URL are set in Supabase." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const { email, token, orgName, inviterName, inviterEmail } = await req.json();
    if (!email || !token || !orgName) throw new Error("email, token, orgName required");

    const link = `${APP_URL.replace(/\/$/, "")}/invite?token=${encodeURIComponent(token)}`;

    console.log("Sending request to Resend...");
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Travectio <noreply@travectio.com>",
        to: [email],
        subject: `You're invited to ${orgName} on Travectio`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You're invited to join ${orgName}</h2>
            <p>Hello!</p>
            <p>${inviterName || 'A team member'} has invited you to join <strong>${orgName}</strong> on Travectio.</p>
            <p>Click the button below to accept your invitation:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${link}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">This invitation was sent by ${inviterEmail || 'noreply@travectio.com'}</p>
          </div>
        `,
      }),
    });

    console.log(`Resend response status: ${resp.status}`);
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Resend error:", txt);
      throw new Error(txt || `Resend error: ${resp.status}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("send-invite error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
