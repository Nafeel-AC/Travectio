import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useSupabase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Helper function to call Supabase Edge Functions
const callSupabaseFunction = async (functionName: string, data: any) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Session error: ${sessionError.message}`);
  }
  
  if (!session?.access_token) {
    throw new Error('No valid session found. Please log in again.');
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(data),
  });
  
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
        return await callSupabaseFunction('pricing-plans', {});
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

// Fetch user's current subscription
export const useSubscription = () => {
  const { user } = useAuth();
  
  return useQuery<Subscription | null>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await callSupabaseFunction('subscriptions', { userId: user.id });
      } catch (error: any) {
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          return null; // No subscription found
        }
        throw error;
      }
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
        return await callSupabaseFunction('payments', { userId: user.id });
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
        return await callSupabaseFunction('create-checkout-session', { planId, truckCount });
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

// Update subscription (change truck count or plan)
export const useUpdateSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ planId, truckCount }: { planId?: string; truckCount?: number }) => {
      const response = await apiRequest('/api/update-subscription', 'PUT', { planId, truckCount });
      return response.json();
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
      const response = await apiRequest('/api/cancel-subscription', 'POST', { immediately });
      return response.json();
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
