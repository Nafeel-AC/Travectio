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
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // For GET requests, we don't need authentication (RLS handles access)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const pathParts = url.pathname.split("/").filter(part => part);
      const planId = pathParts[pathParts.length - 1];

      try {
        if (planId && planId !== "pricing-plans") {
          // Get specific plan
          const { data: plan, error } = await supabase
            .from("pricing_plans")
            .select("*")
            .eq("id", planId)
            .eq("isActive", true)
            .single();
          
          if (error) {
            if (error.code === 'PGRST116') {
              return new Response(JSON.stringify(null), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            throw error;
          }

          return new Response(JSON.stringify(plan), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          // Get all active plans
          const { data: plans, error } = await supabase
            .from("pricing_plans")
            .select("*")
            .eq("isActive", true)
            .order("pricePerTruck", { ascending: true });

          if (error) {
            console.error("Database error:", error);
            
            // Try to create the default plan if table is empty
            try {
              const { error: insertError } = await supabase
                .from("pricing_plans")
                .insert({
                  name: "per-truck",
                  displayName: "Per Truck Plan", 
                  minTrucks: 1,
                  maxTrucks: null,
                  basePrice: null,
                  pricePerTruck: 24.99,
                  stripePriceId: null,
                  isActive: true
                });

              if (!insertError) {
                // Try to fetch again
                const { data: newPlans } = await supabase
                  .from("pricing_plans")
                  .select("*")
                  .eq("isActive", true)
                  .order("pricePerTruck", { ascending: true });
                
                if (newPlans && newPlans.length > 0) {
                  return new Response(JSON.stringify(newPlans), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                  });
                }
              }
            } catch (insertError) {
              console.log("Could not insert default plan:", insertError);
            }
            
            throw error;
          }

          return new Response(JSON.stringify(plans || []), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        console.error("GET pricing-plans error:", error);
        // Return default plans on any error
        const defaultPlans = [{
          id: "per-truck",
          name: "per-truck", 
          displayName: "Per Truck Plan",
          minTrucks: 1,
          maxTrucks: null,
          basePrice: null,
          pricePerTruck: 24.99,
          stripePriceId: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
        
        return new Response(JSON.stringify(defaultPlans), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // For non-GET requests, we need authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid or expired token");
    }

    // Check if user is founder
    let isFounder = false;
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("isFounder")
        .eq("id", user.id)
        .single();
      
      isFounder = userData?.isFounder === 1;
    } catch (error) {
      console.log("Could not check founder status:", error);
      isFounder = false;
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(part => part);
    const planId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case "POST": {
        // For POST requests to pricing-plans without data, treat as GET
        const body = await req.json().catch(() => ({}));
        
        // If no specific plan data is being sent, return all plans
        if (!body.name && !body.description && !body.price) {
          const { data: plans, error } = await supabase
            .from("pricing_plans")
            .select("*")
            .eq("isActive", true)
            .order("pricePerTruck", { ascending: true });

          if (error) throw error;

          return new Response(JSON.stringify(plans), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Create new pricing plan (founders only)
        if (!isFounder) {
          throw new Error("Access denied - founders only");
        }
        
        const planData = {
          name: body.name,
          displayName: body.displayName || body.name,
          minTrucks: body.minTrucks || 1,
          maxTrucks: body.maxTrucks,
          basePrice: body.basePrice,
          pricePerTruck: parseFloat(body.pricePerTruck || "0"),
          stripePriceId: body.stripePriceId,
          isActive: body.isActive !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const { data: plan, error } = await supabase
          .from("pricing_plans")
          .insert(planData)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(plan), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "PUT": {
        // Update pricing plan (founders only)
        if (!isFounder) {
          throw new Error("Access denied - founders only");
        }

        if (!planId || planId === "pricing-plans") {
          throw new Error("Plan ID is required");
        }

        const body = await req.json();
        const updateData = {
          ...body,
          updatedAt: new Date().toISOString()
        };

        const { data: plan, error } = await supabase
          .from("pricing_plans")
          .update(updateData)
          .eq("id", planId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(plan), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "DELETE": {
        // Delete/deactivate pricing plan (founders only)
        if (!isFounder) {
          throw new Error("Access denied - founders only");
        }

        if (!planId || planId === "pricing-plans") {
          throw new Error("Plan ID is required");
        }

        // Soft delete by setting isActive to false
        const { data: plan, error } = await supabase
          .from("pricing_plans")
          .update({ 
            isActive: false, 
            updatedAt: new Date().toISOString() 
          })
          .eq("id", planId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ message: "Plan deactivated successfully", plan }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error) {
    console.error("Error in pricing-plans function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes("Authentication required") ? 401 : 
             error.message.includes("Access denied") ? 403 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
