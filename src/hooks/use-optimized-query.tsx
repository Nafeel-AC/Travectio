import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useTimeFilter } from "@/lib/time-filter-context";
import { useMemo } from "react";

/**
 * Optimized query hook that integrates with time filtering
 * and reduces redundant API calls through intelligent caching
 */
export function useOptimizedQuery<T>(
  baseQueryKey: string, 
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const { getFilteredQueryKey, isFilterActive, currentPeriod, startDate, endDate } = useTimeFilter();
  
  // Memoize the query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => getFilteredQueryKey(baseQueryKey), [
    baseQueryKey, 
    isFilterActive, 
    currentPeriod, 
    startDate?.getTime(), // Use getTime() for stable comparison
    endDate?.getTime()
  ]);
  
  // Memoize the query function to prevent recreation on every render
  const queryFn = useMemo(() => async () => {
    // Build URL with time filter parameters if active
    let url = baseQueryKey;
    if (isFilterActive && startDate && endDate) {
      const params = new URLSearchParams({
        period: currentPeriod,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, [baseQueryKey, isFilterActive, currentPeriod, startDate?.getTime(), endDate?.getTime()]);
  
  return useQuery<T>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 2, // 2 minutes for time-filtered data
    refetchOnWindowFocus: false, // Prevent excessive refetching
    ...options
  });
}