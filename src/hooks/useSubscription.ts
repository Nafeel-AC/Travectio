import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useSupabase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Helper function to call Supabase Edge Functions
const callSupabaseFunction = async (
  functionName: string, 
  data: any = {}, 
  method: string = 'GET',
  pathParams?: string
) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  let url = `${supabaseUrl}/functions/v1/${functionName}`;
  
  // Add path parameters if provided
  if (pathParams) {
    url += `/${pathParams}`;
  }
  
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Session error: ${sessionError.message}`);
  }
  
  if (!session?.access_token) {
    throw new Error('No valid session found. Please log in again.');
  }
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  };
  
  // Only add body for non-GET requests
  if (method !== 'GET' && Object.keys(data).length > 0) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }
  
  return response.json();
};

export interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  minTrucks: number;
  maxTrucks: number | null;
  basePrice: number | null;
  pricePerTruck: number | null;
  stripePriceId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  truckCount: number;
  calculatedAmount: number;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: PricingPlan;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  stripeInvoiceId: string | null;
  amount: number;
  status: string;
  paidAt: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

// Fetch all pricing plans
export const usePricingPlans = () => {
  return useQuery<PricingPlan[]>({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      try {
        return await callSupabaseFunction('pricing-plans', {}, 'GET');
      } catch (error: any) {
        // If Edge Functions are not available, return default plans
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          return [
            {
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
            }
          ];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch organization's current subscription (shared across all members)
export const useSubscription = () => {
  const { user } = useAuth();
  
  return useQuery<Subscription | null>({
    queryKey: ['org-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[useSubscription] No user ID');
        return null;
      }
      
      console.log('[useSubscription] Fetching membership for user:', user.id);
      
      // First, get the user's organization (as owner or member)
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('[useSubscription] Membership:', membership, 'Error:', membershipError);
      
      if (!membership?.organization_id) {
        console.log('[useSubscription] No organization found');
        return null;
      }
      
      console.log('[useSubscription] Fetching subscription for org:', membership.organization_id);
      
      // Then get the organization's subscription (without nested select to avoid RLS issues)
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .eq('status', 'active')
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('[useSubscription] Subscription:', subscription, 'Error:', error);
      
      if (error && !error.message.includes('No rows')) {
        console.error('[useSubscription] Query error:', error);
        throw error;
      }
      
      return subscription || null;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Fetch user's payment history
export const usePaymentHistory = () => {
  const { user } = useAuth();
  
  return useQuery<Payment[]>({
    queryKey: ['payment-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await callSupabaseFunction('payments', {}, 'GET', user.id);
      } catch (error: any) {
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          return []; // No payments found
        }
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Create checkout session
export const useCreateCheckoutSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ planId, truckCount }: { planId: string; truckCount: number }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Check if Edge Functions are deployed
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
      
      try {
        return await callSupabaseFunction('create-checkout-session', { planId, truckCount }, 'POST');
      } catch (error: any) {
        // If Edge Functions are not deployed, show helpful message
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          throw new Error('Edge Functions not deployed yet. Please deploy the Supabase Edge Functions first.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Setup Required",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });
};

// Create or update subscription
export const useCreateSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ planId, truckCount }: { planId: string; truckCount: number }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return await callSupabaseFunction('subscriptions', {
        userId: user.id,
        planId,
        truckCount,
        status: 'active'
      }, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      toast({
        title: "Subscription Created",
        description: "Your subscription has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });
};

// Update subscription (change truck count or plan)
export const useUpdateSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ planId, truckCount }: { planId?: string; truckCount?: number }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return await callSupabaseFunction('subscriptions', {
        userId: user.id,
        planId,
        truckCount
      }, 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });
};

// Cancel subscription
export const useCancelSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ immediately = false }: { immediately?: boolean } = {}) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return await callSupabaseFunction('subscriptions', {}, 'DELETE', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });
};

// Create payment confirmation
export const useCreatePayment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      subscriptionId, 
      amount, 
      stripeInvoiceId, 
      status = 'paid',
      receiptUrl 
    }: { 
      subscriptionId: string; 
      amount: number; 
      stripeInvoiceId?: string;
      status?: string;
      receiptUrl?: string;
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return await callSupabaseFunction('payments', {
        subscriptionId,
        amount,
        stripeInvoiceId,
        status,
        receiptUrl
      }, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-history', user?.id] });
      toast({
        title: "Payment Confirmed",
        description: "Payment has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });
};

// Helper functions
export const calculatePlanPrice = (plan: PricingPlan, truckCount: number): number => {
  // Always use per-truck pricing
  const price = (plan.pricePerTruck || 0) * truckCount;
  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round(price * 100) / 100;
};

export const getRecommendedPlan = (plans: PricingPlan[], truckCount: number): PricingPlan | null => {
  // With per-truck pricing, there's only one plan, so return it if truck count is valid
  const applicablePlans = plans.filter(
    plan => truckCount >= plan.minTrucks && (plan.maxTrucks === null || truckCount <= plan.maxTrucks)
  );

  return applicablePlans.length > 0 ? applicablePlans[0] : null;
};

export const canSelectPlan = (plan: PricingPlan, truckCount: number): boolean => {
  return truckCount >= plan.minTrucks && (plan.maxTrucks === null || truckCount <= plan.maxTrucks);
};
