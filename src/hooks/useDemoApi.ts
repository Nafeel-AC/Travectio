import { useDemo } from "@/lib/demo-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Demo-aware API hook that fetches data based on demo mode
 * When demo mode is enabled, fetches data for the demo user
 * When disabled, fetches data for the current user
 */
export function useDemoApi() {
  const { isDemoMode, getDemoUserId } = useDemo();
  const queryClient = useQueryClient();
  
  // Invalidate all queries when demo mode changes
  useEffect(() => {
    // Demo mode changed, invalidating queries
    console.log('[useDemoApi] Demo mode changed, invalidating queries');
    queryClient.invalidateQueries();
  }, [isDemoMode, queryClient]);


  // Helper function to get the appropriate query key with demo user context
  const getDemoQueryKey = (baseKey: string | string[], demoUserId?: string) => {
    if (!isDemoMode) {
      return typeof baseKey === 'string' ? [baseKey] : baseKey;
    }
    
    const keyArray = typeof baseKey === 'string' ? [baseKey] : baseKey;
    return [...keyArray, 'demo', demoUserId || getDemoUserId()];
  };

  // Helper function to make demo-aware API requests that never throw or reject
  const makeDemoRequest = async (endpoint: string, options: RequestInit = {}) => {
    // Return a promise that resolves to either data or empty array - NEVER rejects
    return new Promise<any>((resolve) => {
      // Setup timeout as backup
      const timeoutId = setTimeout(() => {
        resolve([]);
      }, 5000); // Shorter timeout for better responsiveness
      
      try {
        // Check for customer mode from localStorage or URL
        const storedMode = localStorage.getItem('travectio_view_mode');
        const urlParams = new URLSearchParams(window.location.search);
        const urlDevUser = urlParams.get('dev_user');
        const isCustomerMode = storedMode === 'customer' || urlDevUser === 'customer';
        
        let url = isDemoMode 
          ? `${endpoint}?demo_user_id=${getDemoUserId()}`
          : endpoint;
          
        // Add customer mode parameter if needed (for non-demo API calls)
        if (!isDemoMode && isCustomerMode) {
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}dev_user=customer`;
        }
        
        // Use apiClient for authenticated requests
        const fetchRequest = apiClient.fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });
        
        // Handle the fetch promise with comprehensive error catching
        fetchRequest
          .then((response) => {
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              resolve([]);
              return;
            }
            
            // Parse JSON with error handling
            response.json()
              .then((data) => {
                resolve(data || []);
              })
              .catch((jsonError) => {
                resolve([]);
              });
          })
          .catch((fetchError) => {
            clearTimeout(timeoutId);
            resolve([]);
          });
          
      } catch (syncError) {
        clearTimeout(timeoutId);
        resolve([]);
      }
    });
  };

  // Demo-aware useQuery wrapper with stable key generation
  const useDemoQuery = (baseQueryKey: string | string[], endpoint: string, options: any = {}) => {
    const queryKey = getDemoQueryKey(baseQueryKey, getDemoUserId());
    
    return useQuery({
      queryKey,
      queryFn: () => makeDemoRequest(endpoint),
      staleTime: 1000 * 60 * 10, // 10 minutes aggressive cache - CRITICAL for preventing infinite loops
      refetchOnWindowFocus: false, // CRITICAL - prevent refetch on window focus
      refetchOnMount: false, // CRITICAL - prevent refetch on component mount
      refetchOnReconnect: false, // CRITICAL - prevent refetch on reconnection
      retry: false, // Disable retries to prevent cascading requests
      ...options,
    });
  };

  // Demo-aware useMutation wrapper
  const useDemoMutation = (endpoint: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST', options: any = {}) => {
    return useMutation({
      mutationFn: async (data: any) => {
        return makeDemoRequest(endpoint, {
          method,
          body: method !== 'DELETE' ? JSON.stringify(data) : undefined,
        });
      },
      onSuccess: () => {
        // Invalidate relevant queries when mutation succeeds
        if (options.invalidateQueries) {
          options.invalidateQueries.forEach((queryKey: string | string[]) => {
            queryClient.invalidateQueries({ queryKey: getDemoQueryKey(queryKey) });
          });
        }
      },
      ...options,
    });
  };

  return {
    isDemoMode,
    getDemoUserId,
    getDemoQueryKey,
    makeDemoRequest,
    useDemoQuery,
    useDemoMutation,
  };
}