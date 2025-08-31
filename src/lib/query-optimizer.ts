/**
 * Query Optimization System
 * Prevents excessive API calls and optimizes React Query behavior
 */

import { QueryClient } from "@tanstack/react-query";

export class QueryOptimizer {
  private queryClient: QueryClient;
  private activeQueries = new Set<string>();
  private lastRequestTimes = new Map<string, number>();
  private readonly MIN_REQUEST_INTERVAL = 30000; // 30 seconds minimum between same requests

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupOptimizations();
  }

  private setupOptimizations() {
    // Override the default query function to add throttling
    const originalQueryFn = this.queryClient.getDefaultOptions().queries?.queryFn;
    
    this.queryClient.setDefaultOptions({
      queries: {
        ...this.queryClient.getDefaultOptions().queries,
        queryFn: async (context) => {
          const queryKey = context.queryKey.join('/');
          
          // Check if we should throttle this request
          if (this.shouldThrottleRequest(queryKey)) {
            const cachedData = this.queryClient.getQueryData(context.queryKey);
            if (cachedData) {
              // console.log(`[QueryOptimizer] Using cached data for ${queryKey}`);
              return cachedData;
            }
          }

          // Mark query as active and update last request time
          this.activeQueries.add(queryKey);
          this.lastRequestTimes.set(queryKey, Date.now());

          try {
            if (!originalQueryFn) {
            throw new Error('No query function available');
          }
          const result = await originalQueryFn(context);
            // console.log(`[QueryOptimizer] Fetched fresh data for ${queryKey}`);
            return result;
          } finally {
            this.activeQueries.delete(queryKey);
          }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false, // Disable automatic refetching
        refetchIntervalInBackground: false,
      }
    });
  }

  private shouldThrottleRequest(queryKey: string): boolean {
    const lastRequestTime = this.lastRequestTimes.get(queryKey);
    if (!lastRequestTime) return false;

    const timeSinceLastRequest = Date.now() - lastRequestTime;
    return timeSinceLastRequest < this.MIN_REQUEST_INTERVAL;
  }

  /**
   * Batch invalidate queries with throttling
   */
  batchInvalidate(queryKeys: string[], delay = 500) {
    setTimeout(() => {
      queryKeys.forEach(queryKey => {
        this.queryClient.invalidateQueries({ 
          queryKey: [queryKey], 
          exact: false,
          refetchType: 'none' // Don't refetch immediately
        });
      });
      
      // console.log(`[QueryOptimizer] Batch invalidated ${queryKeys.length} queries`);
    }, delay);
  }

  /**
   * Get optimization stats
   */
  getStats() {
    return {
      activeQueries: this.activeQueries.size,
      trackedQueries: this.lastRequestTimes.size,
      recentRequests: Array.from(this.lastRequestTimes.entries())
        .filter(([_, time]) => Date.now() - time < 10000) // Last 10 seconds
        .length
    };
  }
}

// Global optimizer instance
let queryOptimizer: QueryOptimizer | null = null;

export function getQueryOptimizer(queryClient: QueryClient): QueryOptimizer {
  if (!queryOptimizer) {
    queryOptimizer = new QueryOptimizer(queryClient);
  }
  return queryOptimizer;
}