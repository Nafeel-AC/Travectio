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
    const pathParts = url.pathname.split("/").filter(part => part);
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
        // For GET, take userId from path or use current user
        const targetUserId = userIdFromPath && userIdFromPath !== "subscriptions" ? userIdFromPath : user.id;
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
        // Handle both data creation and data fetching for backwards compatibility
        const body = await req.json().catch(() => ({}));
        
        // If this is a data fetch request (no planId provided)
        if (!body.planId && body.userId) {
          const targetUserId = body.userId;
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
        
        // Create or update subscription
        const targetUserId = body.userId || user.id;
        ensureAccess(targetUserId);

        // Validate required fields for creation
        if (!body.planId) {
          throw new Error("planId is required");
        }

        // Check if plan exists
        const { data: plan, error: planError } = await supabase
          .from("pricing_plans")
          .select("*")
          .eq("id", body.planId)
          .eq("isActive", true)
          .single();

        if (planError || !plan) {
          throw new Error("Invalid or inactive plan");
        }

        // Prepare subscription data
        const subscriptionData = {
          userId: targetUserId,
          planId: body.planId,
          status: body.status || "active",
          startDate: body.startDate || new Date().toISOString(),
          endDate: body.endDate,
          stripeCustomerId: body.stripeCustomerId,
          stripeSubscriptionId: body.stripeSubscriptionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Upsert subscription
        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .upsert(subscriptionData, {
            onConflict: "userId"
          })
          .select("*, plan:pricing_plans(*)")
          .single();

        if (error) throw error;
        responseData = subscription;
        break;
      }

      case "PUT": {
        // Update existing subscription
        const body = await req.json();
        const targetUserId = body.userId || user.id;
        ensureAccess(targetUserId);

        // Check if subscription exists
        const { data: existingSubscription, error: checkError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("userId", targetUserId)
          .single();

        if (checkError) {
          throw new Error("Subscription not found");
        }

        // Prepare update data
        const updateData = {
          ...body,
          userId: targetUserId, // Ensure userId cannot be changed
          updatedAt: new Date().toISOString()
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .update(updateData)
          .eq("userId", targetUserId)
          .select("*, plan:pricing_plans(*)")
          .single();

        if (error) throw error;
        responseData = subscription;
        break;
      }

      case "DELETE": {
        // Cancel/delete subscription
        const targetUserId = userIdFromPath && userIdFromPath !== "subscriptions" ? userIdFromPath : user.id;
        ensureAccess(targetUserId);

        // Soft delete by updating status to cancelled
        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .update({ 
            status: "cancelled",
            endDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq("userId", targetUserId)
          .select("*, plan:pricing_plans(*)")
          .single();

        if (error) throw error;
        responseData = { message: "Subscription cancelled successfully", subscription };
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
    const statusCode = error.message.includes("Authentication required") ? 401 :
                      error.message.includes("Access denied") ? 403 :
                      error.message.includes("not found") ? 404 : 400;
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
