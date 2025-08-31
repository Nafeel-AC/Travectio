import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, MapPin, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import ManualLoadEntry from "./manual-load-entry";
import { useDemoApi } from "@/hooks/useDemoApi";

interface DualModeLoadEntryProps {
  truckId: string;
}

export default function DualModeLoadEntry({ truckId }: DualModeLoadEntryProps) {
  const { useDemoQuery } = useDemoApi();
  const [isManualMode, setIsManualMode] = useState(false);
  const [loadBoardStatus, setLoadBoardStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');
  const [searchCriteria, setSearchCriteria] = useState({
    originRadius: 150,
    destinationRadius: 150,
    minRate: 2.50,
    equipmentType: 'Dry Van'
  });

  const { data: truck } = useDemoQuery(
    [`dual-mode-load-truck-${truckId}`],
    `/api/trucks/${truckId}`,
    {
      enabled: !!truckId,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: availableLoads = [] } = useDemoQuery(
    [`dual-mode-load-board-${truckId}`],
    `/api/load-board/available/${truckId}`,
    {
      enabled: (truck as any)?.loadBoardIntegration === 'integrated' && !isManualMode && !!truckId,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Auto-detect if we should use manual mode
  useEffect(() => {
    if ((truck as any)?.loadBoardIntegration === 'manual' || loadBoardStatus === 'disconnected') {
      setIsManualMode(true);
    }
  }, [(truck as any)?.loadBoardIntegration, loadBoardStatus]);

  const renderModeSelector = () => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
      <div className="flex items-center space-x-3">
        <MapPin className="w-5 h-5 text-green-500" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Load Entry Mode
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {(truck as any)?.loadBoardIntegration === 'integrated' && loadBoardStatus === 'connected' 
              ? `Connected to ${(truck as any)?.preferredLoadBoard || 'Load Board'} - Auto-matching loads`
              : 'Manual load entry'
            }
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {(truck as any)?.loadBoardIntegration === 'integrated' && (
          <>
            <Badge variant={loadBoardStatus === 'connected' ? 'default' : 'destructive'}>
              {loadBoardStatus === 'connected' && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {loadBoardStatus === 'disconnected' && <AlertCircle className="w-3 h-3 mr-1" />}
              {(truck as any)?.preferredLoadBoard || 'Load Board'} {loadBoardStatus}
            </Badge>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Manual Override</span>
              <Switch
                checked={isManualMode}
                onCheckedChange={setIsManualMode}
                disabled={loadBoardStatus === 'disconnected'}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderAutomaticMode = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Search Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minRate">Minimum Rate ($/mile)</Label>
            <Input
              id="minRate"
              type="number"
              step="0.10"
              value={searchCriteria.minRate}
              onChange={(e) => setSearchCriteria(prev => ({
                ...prev,
                minRate: parseFloat(e.target.value)
              }))}
            />
          </div>
          <div>
            <Label htmlFor="originRadius">Origin Radius (miles)</Label>
            <Input
              id="originRadius"
              type="number"
              value={searchCriteria.originRadius}
              onChange={(e) => setSearchCriteria(prev => ({
                ...prev,
                originRadius: parseInt(e.target.value)
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Available Loads</span>
            <Badge variant="outline">{(availableLoads as any[])?.length || 0} loads found</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(availableLoads as any[]) && (availableLoads as any[]).length > 0 ? (
            <div className="space-y-3">
              {(availableLoads as any[]).slice(0, 5).map((load: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {load.miles} miles • {load.commodity} • {load.weight} lbs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        ${load.pay.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${load.ratePerMile.toFixed(2)}/mile
                      </div>
                    </div>
                    <Button size="sm" className="ml-4">
                      Book Load
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <p>No loads match your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      {renderModeSelector()}
      
      {isManualMode ? (
        <div>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Using manual entry mode. Miles will be calculated using city-to-city distances and routing factors.
          </div>
          <ManualLoadEntry />
        </div>
      ) : (
        renderAutomaticMode()
      )}
    </div>
  );
}