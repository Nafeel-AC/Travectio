import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Clock, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import ManualHOSEntry from "./manual-hos-entry";
import { useDemoApi } from "@/hooks/useDemoApi";

interface DualModeHOSEntryProps {
  truckId: string;
}

export default function DualModeHOSEntry({ truckId }: DualModeHOSEntryProps) {
  const { useDemoQuery } = useDemoApi();
  const [isManualMode, setIsManualMode] = useState(false);
  const [elogStatus, setElogStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');

  const { data: truck } = useDemoQuery(
    [`dual-mode-hos-truck-${truckId}`],
    `/api/trucks/${truckId}`,
    {
      enabled: !!truckId,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: latestHosData } = useDemoQuery(
    [`dual-mode-hos-elogs-${truckId}`],
    `/api/elogs/latest/${truckId}`,
    {
      enabled: (truck as any)?.elogsIntegration === 'integrated' && !isManualMode && !!truckId,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Auto-detect if we should use manual mode
  useEffect(() => {
    if ((truck as any)?.elogsIntegration === 'manual' || elogStatus === 'disconnected') {
      setIsManualMode(true);
    }
  }, [(truck as any)?.elogsIntegration, elogStatus]);

  const renderModeSelector = () => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
      <div className="flex items-center space-x-3">
        <Truck className="w-5 h-5 text-blue-500" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            HOS Data Entry Mode
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {(truck as any)?.elogsIntegration === 'integrated' && elogStatus === 'connected' 
              ? 'E-logs connected and syncing automatically'
              : 'Manual entry required'
            }
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {(truck as any)?.elogsIntegration === 'integrated' && (
          <>
            <Badge variant={elogStatus === 'connected' ? 'default' : 'destructive'}>
              {elogStatus === 'connected' && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {elogStatus === 'disconnected' && <AlertCircle className="w-3 h-3 mr-1" />}
              {(truck as any)?.elogsProvider || 'E-logs'} {elogStatus}
            </Badge>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Manual Override</span>
              <Switch
                checked={isManualMode}
                onCheckedChange={setIsManualMode}
                disabled={elogStatus === 'disconnected'}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderAutomaticMode = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span>Automatic E-logs Data</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(latestHosData as any) ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Current Status</div>
              <div className="font-semibold text-green-800 dark:text-green-300">
                {(latestHosData as any)?.dutyStatus || 'Unknown'}
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Drive Time Remaining</div>
              <div className="font-semibold text-blue-800 dark:text-blue-300">
                {(latestHosData as any)?.driveTimeRemaining || 0}h
              </div>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-sm text-orange-600 dark:text-orange-400">On-Duty Remaining</div>
              <div className="font-semibold text-orange-800 dark:text-orange-300">
                {(latestHosData as any)?.onDutyRemaining || 0}h
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400">Cycle Hours</div>
              <div className="font-semibold text-purple-800 dark:text-purple-300">
                {(latestHosData as any)?.cycleHoursRemaining || 0}h
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p>Waiting for E-logs data...</p>
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {(latestHosData as any)?.timestamp 
            ? new Date((latestHosData as any).timestamp).toLocaleString()
            : 'Never'
          }
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {renderModeSelector()}
      
      {isManualMode ? (
        <div>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Using manual entry mode. Data will be synchronized with your cost calculations.
          </div>
          <ManualHOSEntry />
        </div>
      ) : (
        renderAutomaticMode()
      )}
    </div>
  );
}