import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract user from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid or expired token");
    }

    // Extract userId from URL path (last segment)
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const userIdFromPath = pathParts[pathParts.length - 1];

    // Check if user is founder
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("isFounder")
      .eq("id", user.id)
      .single();

    if (userDataError) throw userDataError;
    const isFounder = userData?.isFounder === 1;

    // Function to enforce access control
    const ensureAccess = (targetUserId: string) => {
      if (!isFounder && targetUserId !== user.id) {
        throw new Error("Access denied");
      }
    };

    let responseData: any = null;

    switch (req.method) {
      case "GET": {
        // For GET, take userId from path
        const targetUserId = userIdFromPath;
        ensureAccess(targetUserId);

        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .select("*, plan:pricing_plans(*)")
          .eq("userId", targetUserId)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        responseData = subscription || null;
        break;
      }

      case "POST": {
        // For POST, take userId from body
        const body = await req.json();
        const targetUserId = body.userId || user.id;
        ensureAccess(targetUserId);

        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .select("*, plan:pricing_plans(*)")
          .eq("userId", targetUserId)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        responseData = subscription || null;
        break;
      }

      case "PUT": {
        // Example: update subscription
        const body = await req.json();
        const targetUserId = body.userId || user.id;
        ensureAccess(targetUserId);

        const { data, error } = await supabase
          .from("subscriptions")
          .update({ planId: body.planId })
          .eq("userId", targetUserId)
          .select();

        if (error) throw error;
        responseData = data;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in subscriptions function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
