import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useRef, useMemo } from "react";

/**
 * Stable query hook that prevents excessive re-fetching
 * by using stable query keys and aggressive caching
 */
export function useStableQuery<T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  // Use a ref to store the last successful data
  const lastDataRef = useRef<T | undefined>();
  
  // Create a stable query key using JSON.stringify
  const stableQueryKey = useMemo(() => 
    queryKey.map(k => typeof k === 'string' ? k : String(k)),
    [queryKey.join(',')]
  );

  const result = useQuery<T>({
    queryKey: stableQueryKey,
    queryFn: async () => {
      try {
        const data = await queryFn();
        lastDataRef.current = data;
        return data;
      } catch (error) {
        // Return last known data if available, otherwise throw
        if (lastDataRef.current !== undefined) {
          console.warn('[StableQuery] Using cached data due to error:', error);
          return lastDataRef.current;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    ...options
  });

  return result;
}