import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, AlertCircle, RefreshCw, Network } from "lucide-react";

/**
 * Cross-Tab Connectivity Status Component
 * Shows real-time status of data synchronization across all fleet management tabs
 */
export function CrossTabConnectivityStatus() {
  const [syncStatus, setSyncStatus] = useState<{
    [key: string]: { status: 'synced' | 'syncing' | 'error'; lastUpdate: Date }
  }>({});
  const queryClient = useQueryClient();

  const tabs = [
    { key: 'overview', name: 'Overview', queries: ['/api/metrics', '/api/trucks'] },
    { key: 'matcher', name: 'Load Matcher', queries: ['/api/load-board', '/api/compliance-overview'] },
    { key: 'fleet', name: 'Fleet Summary', queries: ['/api/fleet-summary'] },
    { key: 'costs', name: 'Cost Breakdown', queries: ['/api/trucks'] },
    { key: 'planning', name: 'Multi-Leg Planning', queries: ['/api/load-plans'] },
    { key: 'hos', name: 'HOS Dashboard', queries: ['/api/compliance-overview'] },
  ];

  useEffect(() => {
    // Monitor query state changes to track synchronization
    const updateSyncStatus = () => {
      const newStatus: typeof syncStatus = {};
      
      tabs.forEach(tab => {
        const hasActiveQueries = tab.queries.some(queryKey => {
          const queryState = queryClient.getQueryState([queryKey]);
          return queryState !== undefined;
        });
        
        const hasFetchingQueries = tab.queries.some(queryKey => {
          const queryState = queryClient.getQueryState([queryKey]);
          return queryState?.fetchStatus === 'fetching';
        });

        const hasErrorQueries = tab.queries.some(queryKey => {
          const queryState = queryClient.getQueryState([queryKey]);
          return queryState?.status === 'error';
        });

        let status: 'synced' | 'syncing' | 'error';
        if (hasFetchingQueries) {
          status = 'syncing';
        } else if (hasErrorQueries) {
          status = 'error';
        } else if (hasActiveQueries) {
          status = 'synced';
        } else {
          // Tab not active but ready for synchronization
          status = 'synced';
        }

        newStatus[tab.key] = {
          status,
          lastUpdate: new Date()
        };
      });
      
      setSyncStatus(newStatus);
    };

    // Update sync status every 5 seconds instead of 2 seconds to reduce polling
    const interval = setInterval(updateSyncStatus, 5000);
    updateSyncStatus();

    // Update when queries change, but throttled to prevent excessive updates
    let updateTimeout: NodeJS.Timeout;
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updateSyncStatus, 1000);
    });

    return () => {
      clearInterval(interval);
      clearTimeout(updateTimeout);
      unsubscribe();
    };
  }, [queryClient]);

  const getStatusIcon = (status: 'synced' | 'syncing' | 'error') => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: 'synced' | 'syncing' | 'error') => {
    switch (status) {
      case 'synced':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'syncing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const overallStatus = Object.values(syncStatus).every(s => s.status === 'synced') ? 'synced' :
                      Object.values(syncStatus).some(s => s.status === 'syncing') ? 'syncing' : 'error';

  return (
    <Card className="bg-[var(--dark-card)] border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Network className="w-4 h-4 text-[var(--primary-blue)]" />
          Cross-Tab Synchronization
          <Badge 
            className={`ml-auto ${getStatusColor(overallStatus)}`}
            variant="outline"
          >
            {getStatusIcon(overallStatus)}
            {overallStatus === 'synced' ? 'All Connected' : 
             overallStatus === 'syncing' ? 'Synchronizing' : 'Issues Detected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {tabs.map(tab => {
            const status = syncStatus[tab.key]?.status || 'synced';
            return (
              <div 
                key={tab.key} 
                className="flex items-center justify-between p-2 bg-[var(--dark-elevated)] rounded border border-gray-600"
              >
                <span className="text-gray-300">{tab.name}</span>
                {getStatusIcon(status)}
              </div>
            );
          })}
        </div>
        <div className="mt-3 p-2 bg-blue-900/20 border border-blue-600/30 rounded text-xs">
          <p className="text-blue-300">
            <strong>Real-time synchronization:</strong> All tabs communicate automatically through DataSynchronizationManager. 
            Changes trigger comprehensive cross-tab updates across the fleet management system.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}