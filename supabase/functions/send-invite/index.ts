import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const EMAILJS_PRIVATE_KEY = Deno.env.get("EMAILJS_PRIVATE_KEY");
const EMAILJS_SERVICE_ID = Deno.env.get("EMAILJS_SERVICE_ID");
const EMAILJS_TEMPLATE_ID = Deno.env.get("EMAILJS_TEMPLATE_ID");
const APP_URL = Deno.env.get("APP_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  console.log(`Received ${req.method} request to send-invite`);
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    console.log("Checking environment variables...");
    if (!EMAILJS_PRIVATE_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !APP_URL) {
      console.error("Missing environment variables:", {
        EMAILJS_PRIVATE_KEY: !!EMAILJS_PRIVATE_KEY,
        EMAILJS_SERVICE_ID: !!EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID: !!EMAILJS_TEMPLATE_ID,
        APP_URL: !!APP_URL
      });
      
      // Return a proper error response instead of throwing
      return new Response(JSON.stringify({ 
        error: "Missing environment variables. Please check EMAILJS_PRIVATE_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and APP_URL are set in Supabase." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const { email, token, orgName, inviterName, inviterEmail } = await req.json();
    if (!email || !token || !orgName) throw new Error("email, token, orgName required");

    const link = `${APP_URL.replace(/\/$/, "")}/invite?token=${encodeURIComponent(token)}`;

    const body = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      // When using private key (server-to-server), user_id is not required; use Authorization header instead.
      // Include template variables below; ensure your EmailJS template expects these names.
      template_params: {
        to_email: email,
        org_name: orgName,
        invite_link: link,
        inviter_name: inviterName || 'Team',
        inviter_email: inviterEmail || 'noreply@travectio.com',
      },
    } as Record<string, unknown>;

    console.log("Sending request to EmailJS...");
    const resp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAILJS_PRIVATE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    console.log(`EmailJS response status: ${resp.status}`);
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("EmailJS error:", txt);
      throw new Error(txt || `EmailJS error: ${resp.status}`);
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


