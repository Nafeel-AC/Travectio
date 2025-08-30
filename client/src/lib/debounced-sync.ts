/**
 * Debounced Synchronization System
 * Prevents excessive API calls by batching and throttling query invalidations
 */

import { QueryClient } from "@tanstack/react-query";

export class DebouncedSynchronization {
  private queryClient: QueryClient;
  private pendingInvalidations = new Set<string>();
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 500; // 500ms delay

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Schedule a query invalidation with debouncing
   */
  scheduleInvalidation(queryKey: string) {
    this.pendingInvalidations.add(queryKey);
    
    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout to batch invalidations
    this.timeoutId = setTimeout(() => {
      this.executePendingInvalidations();
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Execute all pending invalidations in a single batch
   */
  private executePendingInvalidations() {
    if (this.pendingInvalidations.size === 0) return;

    // Convert to array and clear set
    const queryKeys = Array.from(this.pendingInvalidations);
    this.pendingInvalidations.clear();

    // Execute invalidations
    queryKeys.forEach(queryKey => {
      this.queryClient.invalidateQueries({ 
        queryKey: [queryKey], 
        exact: false,
        refetchType: 'inactive' // Only refetch inactive queries
      });
    });

    console.log(`[DebouncedSync] Invalidated ${queryKeys.length} query types:`, queryKeys);
  }

  /**
   * Force immediate execution of pending invalidations
   */
  flush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.executePendingInvalidations();
  }
}

// Global debounced sync instance
let debouncedSync: DebouncedSynchronization | null = null;

export function getDebouncedSync(queryClient: QueryClient): DebouncedSynchronization {
  if (!debouncedSync) {
    debouncedSync = new DebouncedSynchronization(queryClient);
  }
  return debouncedSync;
}