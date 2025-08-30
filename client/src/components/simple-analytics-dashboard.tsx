import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, DollarSign, Route, Target, Fuel } from "lucide-react";
import { useDemoApi } from "@/hooks/useDemoApi";

export function SimpleAnalyticsDashboard() {
  const { useDemoQuery } = useDemoApi();
  
  // FIXED: Demo-aware queries with aggressive caching to prevent infinite loops
  const { data: metrics, isLoading: metricsLoading } = useDemoQuery(
    ['simple-analytics-metrics'],
    '/api/metrics',
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  
  const { data: trucks = [] } = useDemoQuery(
    ['simple-analytics-trucks'],
    '/api/trucks',
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  
  const { data: loads = [] } = useDemoQuery(
    ['simple-analytics-loads'],
    '/api/loads',
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  
  const { data: fleetSummary = {} } = useDemoQuery(
    ['simple-analytics-fleet-summary'],
    '/api/fleet-summary',
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  if (metricsLoading) {
    return (
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Business Analytics</span>
            <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600/40">
              Stable Data
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--dark-elevated)] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Total Revenue</span>
              </div>
              <div className="text-xl font-bold text-white">
                {formatCurrency((metrics as any)?.totalRevenue || 0)}
              </div>
            </div>

            <div className="bg-[var(--dark-elevated)] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Route className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Total Miles</span>
              </div>
              <div className="text-xl font-bold text-white">
                {((metrics as any)?.totalOperationalMiles || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-[var(--dark-elevated)] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Cost Per Mile</span>
              </div>
              <div className="text-xl font-bold text-white">
                {formatCurrency((metrics as any)?.costPerMile || 0)}
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
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-[var(--dark-elevated)] rounded-lg">
            <h3 className="text-white font-medium mb-2">Fleet Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Loads:</span>
                <span className="text-white ml-2">{loads.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Active Trucks:</span>
                <span className="text-white ml-2">{(fleetSummary as any)?.activeTrucks || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Utilization:</span>
                <span className="text-white ml-2">{(fleetSummary as any)?.utilizationRate || 0}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}