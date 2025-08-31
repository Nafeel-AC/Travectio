/**
 * Offline Data Synchronization Manager
 * Handles offline data storage, conflict resolution, and sync when online
 */

interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'truck' | 'load' | 'hos' | 'fuel';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncState {
  isOnline: boolean;
  lastSyncTime: number;
  pendingOperations: PendingOperation[];
  conflictResolution: 'server' | 'client' | 'manual';
}

class OfflineSyncManager {
  private syncState: SyncState;
  private storageKey = 'travectio_offline_data';
  private pendingKey = 'travectio_pending_operations';
  private maxRetries = 3;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.syncState = this.loadSyncState();
    this.initializeNetworkListener();
    this.startPeriodicSync();
  }

  private loadSyncState(): SyncState {
    const saved = localStorage.getItem(this.pendingKey);
    return saved ? JSON.parse(saved) : {
      isOnline: navigator.onLine,
      lastSyncTime: 0,
      pendingOperations: [],
      conflictResolution: 'server'
    };
  }

  private saveSyncState() {
    localStorage.setItem(this.pendingKey, JSON.stringify(this.syncState));
  }

  private initializeNetworkListener() {
    window.addEventListener('online', () => {
      console.log('[OfflineSync] Network restored - triggering sync');
      this.syncState.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineSync] Network lost - entering offline mode');
      this.syncState.isOnline = false;
      this.saveSyncState();
    });
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.syncState.isOnline && this.syncState.pendingOperations.length > 0) {
        this.triggerSync();
      }
    }, 30000);
  }

  // Store data locally for offline access
  public storeOfflineData(key: string, data: any) {
    const offlineData = this.getOfflineData();
    offlineData[key] = {
      data,
      timestamp: Date.now(),
      synced: this.syncState.isOnline
    };
    localStorage.setItem(this.storageKey, JSON.stringify(offlineData));
  }

  // Retrieve offline data
  public getOfflineData(): Record<string, any> {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : {};
  }

  // Queue operation for sync when online
  public queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const pendingOp: PendingOperation = {
      ...operation,
      id: `${operation.entity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncState.pendingOperations.push(pendingOp);
    this.saveSyncState();

    console.log(`[OfflineSync] Queued ${operation.type} operation for ${operation.entity}`, pendingOp);

    // Try immediate sync if online
    if (this.syncState.isOnline) {
      this.triggerSync();
    }

    return pendingOp.id;
  }

  // Process pending operations when online
  public async triggerSync(): Promise<boolean> {
    if (!this.syncState.isOnline || this.syncState.pendingOperations.length === 0) {
      return true;
    }

    console.log(`[OfflineSync] Starting sync of ${this.syncState.pendingOperations.length} operations`);

    const operations = [...this.syncState.pendingOperations];
    const successfulOps: string[] = [];
    const failedOps: PendingOperation[] = [];

    for (const operation of operations) {
      try {
        const success = await this.executeOperation(operation);
        if (success) {
          successfulOps.push(operation.id);
          console.log(`[OfflineSync] ✓ ${operation.type} ${operation.entity} synced successfully`);
        } else {
          operation.retryCount++;
          if (operation.retryCount < this.maxRetries) {
            failedOps.push(operation);
            console.log(`[OfflineSync] ⚠ ${operation.type} ${operation.entity} failed, retrying (${operation.retryCount}/${this.maxRetries})`);
          } else {
            console.error(`[OfflineSync] ✗ ${operation.type} ${operation.entity} failed permanently after ${this.maxRetries} retries`);
          }
        }
      } catch (error) {
        console.error(`[OfflineSync] Error executing operation:`, error);
        operation.retryCount++;
        if (operation.retryCount < this.maxRetries) {
          failedOps.push(operation);
        }
      }
    }

    // Update pending operations (remove successful, keep failed for retry)
    this.syncState.pendingOperations = failedOps;
    this.syncState.lastSyncTime = Date.now();
    this.saveSyncState();

    const allSuccessful = failedOps.length === 0;
    console.log(`[OfflineSync] Sync complete: ${successfulOps.length} success, ${failedOps.length} pending retry`);

    return allSuccessful;
  }

  private async executeOperation(operation: PendingOperation): Promise<boolean> {
    const endpoint = this.getEndpointForEntity(operation.entity);
    
    try {
      let response: Response;

      switch (operation.type) {
        case 'CREATE':
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operation.data)
          });
          break;

        case 'UPDATE':
          response = await fetch(`${endpoint}/${operation.data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operation.data)
          });
          break;

        case 'DELETE':
          response = await fetch(`${endpoint}/${operation.data.id}`, {
            method: 'DELETE'
          });
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      if (response.ok) {
        // Update local data with server response if available
        if (operation.type !== 'DELETE' && response.headers.get('content-type')?.includes('application/json')) {
          const serverData = await response.json();
          this.storeOfflineData(`${operation.entity}_${serverData.id}`, serverData);
        }
        return true;
      } else if (response.status === 409) {
        // Conflict - handle based on resolution strategy
        await this.handleConflict(operation, response);
        return true; // Mark as handled
      } else {
        console.error(`[OfflineSync] Server error ${response.status} for ${operation.type} ${operation.entity}`);
        return false;
      }
    } catch (error) {
      console.error(`[OfflineSync] Network error during sync:`, error);
      return false;
    }
  }

  private async handleConflict(operation: PendingOperation, response: Response) {
    const serverData = await response.json();
    
    switch (this.syncState.conflictResolution) {
      case 'server':
        // Server wins - update local data
        this.storeOfflineData(`${operation.entity}_${serverData.id}`, serverData);
        console.log(`[OfflineSync] Conflict resolved: Server data accepted for ${operation.entity}`);
        break;

      case 'client':
        // Force client data to server
        await this.executeOperation({ ...operation, retryCount: 0 });
        console.log(`[OfflineSync] Conflict resolved: Client data forced to server for ${operation.entity}`);
        break;

      case 'manual':
        // Store conflict for manual resolution
        const conflicts = JSON.parse(localStorage.getItem('travectio_conflicts') || '[]');
        conflicts.push({
          operation,
          serverData,
          timestamp: Date.now()
        });
        localStorage.setItem('travectio_conflicts', JSON.stringify(conflicts));
        console.log(`[OfflineSync] Conflict stored for manual resolution: ${operation.entity}`);
        break;
    }
  }

  private getEndpointForEntity(entity: string): string {
    const endpoints = {
      truck: '/api/trucks',
      load: '/api/loads',
      hos: '/api/hos-logs',
      fuel: '/api/fuel-purchases'
    };
    return endpoints[entity as keyof typeof endpoints] || '/api/unknown';
  }

  // Get sync status for UI
  public getSyncStatus() {
    return {
      isOnline: this.syncState.isOnline,
      pendingCount: this.syncState.pendingOperations.length,
      lastSyncTime: this.syncState.lastSyncTime,
      hasConflicts: JSON.parse(localStorage.getItem('travectio_conflicts') || '[]').length > 0
    };
  }

  // Manual conflict resolution
  public resolveConflict(conflictId: string, resolution: 'server' | 'client') {
    const conflicts = JSON.parse(localStorage.getItem('travectio_conflicts') || '[]');
    const conflict = conflicts.find((c: any, index: number) => index.toString() === conflictId);
    
    if (conflict) {
      if (resolution === 'server') {
        this.storeOfflineData(`${conflict.operation.entity}_${conflict.serverData.id}`, conflict.serverData);
      } else {
        this.queueOperation(conflict.operation);
      }
      
      // Remove resolved conflict
      const updatedConflicts = conflicts.filter((_: any, index: number) => index.toString() !== conflictId);
      localStorage.setItem('travectio_conflicts', JSON.stringify(updatedConflicts));
    }
  }

  // Clear all offline data (use with caution)
  public clearOfflineData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.pendingKey);
    localStorage.removeItem('travectio_conflicts');
    this.syncState = {
      isOnline: navigator.onLine,
      lastSyncTime: 0,
      pendingOperations: [],
      conflictResolution: 'server'
    };
  }

  // Cleanup
  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    window.removeEventListener('online', this.triggerSync);
    window.removeEventListener('offline', this.triggerSync);
  }
}

// Global instance
export const offlineSyncManager = new OfflineSyncManager();

// React hook for sync status - optimized to reduce re-renders
export function useSyncStatus() {
  const [status, setStatus] = React.useState(offlineSyncManager.getSyncStatus());

  React.useEffect(() => {
    // Only update every 10 seconds instead of every second to reduce re-renders
    const interval = setInterval(() => {
      const newStatus = offlineSyncManager.getSyncStatus();
      // Only update state if something actually changed
      setStatus(prevStatus => {
        if (JSON.stringify(prevStatus) !== JSON.stringify(newStatus)) {
          return newStatus;
        }
        return prevStatus;
      });
    }, 10000); // Update every 10 seconds instead of 1 second

    return () => clearInterval(interval);
  }, []);

  return status;
}

// Hook for offline-first operations
export function useOfflineOperation() {
  const queueOperation = React.useCallback((operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    return offlineSyncManager.queueOperation(operation);
  }, []);

  const triggerSync = React.useCallback(() => {
    return offlineSyncManager.triggerSync();
  }, []);

  return { queueOperation, triggerSync };
}

import * as React from "react";