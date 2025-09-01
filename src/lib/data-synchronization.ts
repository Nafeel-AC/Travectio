/**
 * Comprehensive Data Synchronization System for Cross-Tab Communication
 * Ensures all fleet management components stay synchronized with real-time updates
 */

import { QueryClient } from "@tanstack/react-query";
import { getDebouncedSync } from "./debounced-sync";

export class DataSynchronizationManager {
  private queryClient: QueryClient;
  private debouncedSync;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.debouncedSync = getDebouncedSync(queryClient);
  }

  /**
   * Invalidates all queries related to truck operations and fleet management
   * Use when truck data, cost breakdowns, or assignments change
   */
  synchronizeTruckData(truckId?: string) {
    const queries = [
      "trucks",
      "metrics", 
      "fleet-summary",
      "compliance-overview",
      "load-board",
      "activities",
    ];

    if (truckId) {
      queries.push("trucks");
    }

    // Use debounced synchronization to prevent excessive API calls
    queries.forEach(queryKey => {
      this.debouncedSync.scheduleInvalidation(queryKey);
    });
  }

  /**
   * Synchronizes load-related data across all tabs
   * Use when loads are assigned, completed, or modified
   */
  synchronizeLoadData() {
    const queries = [
      "loads", // Critical: invalidate the main loads endpoint
      "load-board",
      "load-plans",
      "metrics",
      "fleet-summary",
      "compliance-overview",
      "activities",
      "trucks", // For load assignments and truck status
    ];

    queries.forEach(queryKey => {
      this.debouncedSync.scheduleInvalidation(queryKey);
    });
  }

  /**
   * Synchronizes cost and financial data across all tabs
   * Use when cost breakdowns, fuel prices, or financial data changes
   */
  synchronizeCostData(truckId?: string) {
    const queries = [
      "trucks",
      "metrics",
      "fleet-summary",
      "load-board", // For updated cost calculations in recommendations
    ];

    queries.forEach(queryKey => {
      this.debouncedSync.scheduleInvalidation(queryKey);
    });
  }

  /**
   * Synchronizes HOS and compliance data
   * Use when driver status, HOS logs, or compliance data changes
   */
  synchronizeComplianceData() {
    const queries = [
      ["compliance-overview"],
      ["load-board"], // For load recommendations based on HOS
      ["load-plans"], // For multi-leg planning with HOS constraints
      ["metrics"],
      ["activities"],
    ];

    queries.forEach(queryKey => {
      this.queryClient.invalidateQueries({ queryKey });
    });
  }

  /**
   * Comprehensive synchronization for major fleet operations
   * Use when multiple systems are affected simultaneously
   */
  synchronizeAllFleetData() {
    const queries = [
      ["trucks"],
      ["loads"], // Critical: invalidate the main loads endpoint
      ["metrics"],
      ["fleet-summary"],
      ["compliance-overview"],
      ["load-board"],
      ["load-plans"],
      ["activities"],
      ["drivers"],
    ];

    queries.forEach(queryKey => {
      this.queryClient.invalidateQueries({ queryKey });
    });
  }

  /**
   * Optimized synchronization for fuel efficiency updates
   * Specifically targets tabs that display or calculate fuel-related data
   */
  synchronizeFuelData(truckId: string) {
    const queries = [
      ["trucks", truckId, "cost-breakdowns"],
      ["trucks"], // For updated avgCostPerMile calculations
      ["metrics"], // For dashboard cost metrics
      ["fleet-summary"], // For fleet fuel efficiency overview
      ["load-board"], // For load recommendations with updated fuel costs
    ];

    queries.forEach(queryKey => {
      this.queryClient.invalidateQueries({ queryKey });
    });
  }

  /**
   * Synchronizes planning and scheduling data
   * Use when load plans, multi-leg trips, or scheduling changes occur
   */
  synchronizePlanningData() {
    const queries = [
      ["load-plans"],
      ["compliance-overview"], // For HOS impact analysis
      ["fleet-summary"], // For fleet utilization updates
      ["load-board"], // For available load recommendations
      ["metrics"], // For planning efficiency metrics
      ["activities"],
    ];

    queries.forEach(queryKey => {
      this.queryClient.invalidateQueries({ queryKey });
    });
  }
}

// Utility function to create synchronized mutation options
export const createSynchronizedMutation = (
  queryClient: QueryClient,
  syncType: 'truck' | 'load' | 'cost' | 'compliance' | 'planning' | 'fuel' | 'all',
  truckId?: string
) => {
  const syncManager = new DataSynchronizationManager(queryClient);
  
  return {
    onSuccess: () => {
      switch (syncType) {
        case 'truck':
          syncManager.synchronizeTruckData(truckId);
          break;
        case 'load':
          syncManager.synchronizeLoadData();
          break;
        case 'cost':
          syncManager.synchronizeCostData(truckId);
          break;
        case 'compliance':
          syncManager.synchronizeComplianceData();
          break;
        case 'planning':
          syncManager.synchronizePlanningData();
          break;
        case 'fuel':
          if (truckId) syncManager.synchronizeFuelData(truckId);
          break;
        case 'all':
          syncManager.synchronizeAllFleetData();
          break;
      }
    }
  };
};