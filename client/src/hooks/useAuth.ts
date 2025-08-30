import { useQuery } from "@tanstack/react-query";
import { addCustomerModeToUrl, getCustomerModeState } from "@/utils/customer-mode";

export function useAuth() {
  // CRITICAL FIX: Authentication must NEVER use demo mode - always get real authenticated user
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user", getCustomerModeState().devUserParam],
    queryFn: async () => {
      const url = addCustomerModeToUrl('/api/auth/user');
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}