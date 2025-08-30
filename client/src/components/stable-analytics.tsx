import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, DollarSign, Route, Target, Fuel } from "lucide-react";
import { useDemoApi } from "@/hooks/useDemoApi";

export function StableAnalytics() {
  const { useDemoQuery } = useDemoApi();
  
  // Demo-aware queries with aggressive caching to prevent infinite loops
  const { data: metrics = {} } = useDemoQuery(
    ['stable-analytics-metrics'],
    '/api/metrics',
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  
  const { data: fleetSummary = {} } = useDemoQuery(
    ['stable-analytics-fleet-summary'],
    '/api/fleet-summary',
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: trucks = [] } = useDemoQuery(
    ['stable-analytics-trucks'],
    '/api/trucks',
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: loads = [] } = useDemoQuery(
    ['stable-analytics-loads'],
    '/api/loads',
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Fleet Analytics - Stable Version</span>
            <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600/40">
              Demo-Aware
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--dark-elevated)] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Total Revenue</span>
              </div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(fleetSummary.totalRevenue || 0)}
              </div>
              <div className="text-xs text-gray-500">
                Fleet revenue
              </div>
            </div>

            <div className="bg-[var(--dark-elevated)] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Route className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Total Miles</span>
              </div>
              <div className="text-xl font-bold text-white">
                {(fleetSummary.totalMiles || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Operational miles
              </div>
            </div>

            <div className="bg-[var(--dark-elevated)] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Cost Per Mile</span>
              </div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(metrics.costPerMile || 0)}
              </div>
              <div className="text-xs text-gray-500">
                Operating cost
              </div>
            </div>

            <div className="bg-[var(--dark-elevated)] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Fuel className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">Fleet Size</span>
              </div>
              <div className="text-xl font-bold text-white">
                {trucks.length} Trucks
              </div>
              <div className="text-xs text-gray-500">
                Total fleet
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-[var(--dark-elevated)] rounded-lg">
            <h3 className="text-white font-medium mb-3">Fleet Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-gray-400 text-xs">Total Loads</div>
                <div className="text-white font-semibold text-lg">{loads.length}</div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-gray-400 text-xs">Active Trucks</div>
                <div className="text-white font-semibold text-lg">{fleetSummary.activeTrucks || 0}</div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-gray-400 text-xs">Utilization</div>
                <div className="text-white font-semibold text-lg">{fleetSummary.utilizationRate || 0}%</div>
              </div>
            </div>
          </div>

          {/* Data Status */}
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="text-blue-300 text-sm font-medium">Data Status</div>
            <div className="text-blue-200 text-xs mt-1">
              Metrics: {metrics.costPerMile ? '✓ Loaded' : '✗ Empty'} | 
              Fleet: {fleetSummary.totalTrucks ? '✓ Loaded' : '✗ Empty'} | 
              Trucks: {trucks.length ? '✓ Loaded' : '✗ Empty'} | 
              Loads: {loads.length ? '✓ Loaded' : '✗ Empty'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}