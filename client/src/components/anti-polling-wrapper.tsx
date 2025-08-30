import { useState, useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

/**
 * Anti-Polling Wrapper Component
 * Prevents excessive API calls by monitoring and throttling query invalidations
 */
export function AntiPollingWrapper({ children }: { children: React.ReactNode }) {
  const [isThrottling, setIsThrottling] = useState(false);
  const invalidationCount = useRef(0);
  const lastResetTime = useRef(Date.now());
  
  useEffect(() => {
    // Monitor query cache for excessive invalidations
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'invalidated') {
        invalidationCount.current++;
        
        const now = Date.now();
        const timeSinceReset = now - lastResetTime.current;
        
        // Reset counter every 10 seconds
        if (timeSinceReset > 10000) {
          invalidationCount.current = 0;
          lastResetTime.current = now;
          setIsThrottling(false);
          return;
        }
        
        // If more than 20 invalidations in 10 seconds, enable throttling
        if (invalidationCount.current > 20) {
          console.warn('[AntiPolling] Excessive query invalidations detected, enabling throttling');
          setIsThrottling(true);
          
          // Clear all queries and prevent refetching temporarily
          queryClient.clear();
          queryClient.setDefaultOptions({
            queries: {
              enabled: false,
              retry: false,
              refetchOnMount: false,
              refetchOnWindowFocus: false,
              refetchInterval: false,
            }
          });
          
          // Re-enable after 3 seconds with aggressive caching
          setTimeout(() => {
            queryClient.setDefaultOptions({
              queries: {
                enabled: true,
                retry: 1,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                refetchInterval: false,
                staleTime: 1000 * 60 * 15, // 15 minutes aggressive caching
                gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
              }
            });
            setIsThrottling(false);
            console.log('[AntiPolling] Normal operation resumed with aggressive caching');
          }, 3000);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {isThrottling && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-600 text-white p-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Optimizing data sync...
            </span>
          </div>
        </div>
      )}
      {children}
    </>
  );
}