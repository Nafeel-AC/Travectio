import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Users, Package, TrendingUp, TrendingDown, DollarSign, Gauge, Building } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FleetMetricsService } from "@/lib/supabase-client";

interface FleetSummary {
  fleetSize: string;
  totalTrucks: number;
  activeTrucks: number;
  totalDrivers: number;
  activeDrivers: number;
  totalLoads: number;
  totalMiles: number;
  totalRevenue: number;
  avgCostPerMile: number;
  utilizationRate: number;
  profitMargin: number;
}

export default function FleetSummary() {
  // ✅ FIXED: Use real Supabase service instead of placeholder
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['fleet-summary'],
    queryFn: async () => {
      const fleetSummary = await FleetMetricsService.getFleetSummary();
      return {
        totalTrucks: fleetSummary.totalTrucks || 0,
        activeTrucks: fleetSummary.activeTrucks || 0,
        totalDrivers: fleetSummary.totalDrivers || 0,
        activeDrivers: fleetSummary.activeDrivers || 0,
        totalMiles: fleetSummary.totalMiles || 0,
        totalRevenue: fleetSummary.totalRevenue || 0,
        totalCosts: fleetSummary.totalCosts || 0,
        profitMargin: fleetSummary.profitMargin || 0,
        utilizationRate: fleetSummary.utilizationRate || 0,
        fleetSize: fleetSummary.fleetSize || 'solo',
        totalLoads: fleetSummary.totalLoads || 0,
        avgCostPerMile: fleetSummary.avgCostPerMile || 0
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Debug logging

  const getFleetSizeInfo = (size: string) => {
    switch (size) {
      case "solo":
        return {
          label: "Solo Operator",
          color: "bg-blue-600",
          icon: Truck,
          description: "Single truck operation"
        };
      case "small":
        return {
          label: "Small Fleet",
          color: "bg-green-600",
          icon: Truck,
          description: "2-10 trucks"
        };
      case "medium":
        return {
          label: "Medium Fleet",
          color: "bg-yellow-600",
          icon: Building,
          description: "11-50 trucks"
        };
      case "large":
        return {
          label: "Large Fleet",
          color: "bg-orange-600",
          icon: Building,
          description: "51-200 trucks"
        };
      case "enterprise":
        return {
          label: "Enterprise Fleet",
          color: "bg-purple-600",
          icon: Building,
          description: "200+ trucks"
        };
      default:
        return {
          label: "Fleet",
          color: "bg-gray-600",
          icon: Truck,
          description: "Fleet operation"
        };
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return "text-green-400";
    if (rate >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin < 0) return "text-red-400"; // Negative margins should always be red
    if (margin >= 15) return "text-green-400";
    if (margin >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  if (isLoading) {
    return (
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-600 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || isLoading) {
    return (
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">Unable to load fleet summary</p>
        </CardContent>
      </Card>
    );
  }

  const fleetInfo = getFleetSizeInfo(summary?.fleetSize || 'solo');
  const FleetIcon = fleetInfo.icon;

  return (
    <div className="space-y-6">
      {/* Fleet Classification Header */}
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 ${fleetInfo.color} rounded-lg flex items-center justify-center`}>
                <FleetIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{fleetInfo.label}</h2>
                <p className="text-gray-400">{fleetInfo.description}</p>
                <Badge className={`${fleetInfo.color} text-white mt-2`}>
                  {summary?.totalTrucks || 0} truck{(summary?.totalTrucks || 0) !== 1 ? 's' : ''} in fleet
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${(summary?.totalRevenue || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${(summary?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trucks */}
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Trucks</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.activeTrucks || 0}/{summary?.totalTrucks || 0}
                </p>
                <p className={`text-sm font-medium ${getUtilizationColor(summary?.utilizationRate || 0)}`}>
                  {summary?.utilizationRate || 0}% utilization
                </p>
              </div>
              <Truck className="w-8 h-8 text-[var(--primary-blue)]" />
            </div>
          </CardContent>
        </Card>

        {/* Drivers */}
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Drivers</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.activeDrivers || 0}/{summary?.totalDrivers || 0}
                </p>
                <p className="text-sm text-gray-400">
                  {(summary?.totalDrivers || 0) > 0 ? 
                    Math.round(((summary?.activeDrivers || 0) / (summary?.totalDrivers || 0)) * 100) : 0}% active
                </p>
              </div>
              <Users className="w-8 h-8 text-[var(--primary-blue)]" />
            </div>
          </CardContent>
        </Card>

        {/* Loads */}
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Loads</p>
                <p className="text-2xl font-bold text-white">{summary?.totalLoads || 0}</p>
                <p className="text-sm text-gray-400">
                  {(summary?.activeTrucks || 0) > 0 ? 
                    ((summary?.totalLoads || 0) / (summary?.activeTrucks || 0)).toFixed(1) : 0} per truck
                </p>
              </div>
              <Package className="w-8 h-8 text-[var(--primary-blue)]" />
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Profit Margin</p>
                <p className={`text-2xl font-bold ${getProfitMarginColor(summary?.profitMargin || 0)}`}>
                  {(summary?.profitMargin || 0).toFixed(1)}%
                </p>
                <p className={`text-sm ${getProfitMarginColor(summary?.profitMargin || 0)}`}>
                  ${(((summary?.totalRevenue || 0) * (summary?.profitMargin || 0)) / 100).toLocaleString()} {(summary?.profitMargin || 0) >= 0 ? 'profit' : 'loss'}
                </p>
              </div>
              {(summary?.profitMargin || 0) >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Gauge className="w-5 h-5" />
              <span>Efficiency Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Cost Per Mile</span>
                <span className="text-white font-semibold">${summary?.avgCostPerMile || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Miles</span>
                <span className="text-white font-semibold">{(summary?.totalMiles || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Miles per Truck</span>
                <span className="text-white font-semibold">
                  {(summary?.totalTrucks || 0) > 0 ? 
                    Math.round((summary?.totalMiles || 0) / (summary?.totalTrucks || 0)).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Revenue Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Revenue per Truck</span>
                <span className="text-white font-semibold">
                  ${(summary?.totalTrucks || 0) > 0 ? 
                    Math.round((summary?.totalRevenue || 0) / (summary?.totalTrucks || 0)).toLocaleString() : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Revenue per Mile</span>
                <span className={`font-semibold ${
                  (summary?.totalMiles || 0) > 0 
                    ? (((summary?.totalRevenue || 0) / (summary?.totalMiles || 0)) > (summary?.avgCostPerMile || 0)
                      ? 'text-green-400'
                      : 'text-red-400')
                    : 'text-white'
                }`}>
                  ${(summary?.totalMiles || 0) > 0 ? 
                    ((summary?.totalRevenue || 0) / (summary?.totalMiles || 0)).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Revenue per Load</span>
                <span className="text-white font-semibold">
                  ${(summary?.totalLoads || 0) > 0 ? 
                    Math.round((summary?.totalRevenue || 0) / (summary?.totalLoads || 0)).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Fleet Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Fleet Utilization</span>
                <span className={`font-semibold ${getUtilizationColor(summary?.utilizationRate || 0)}`}>
                  {summary?.utilizationRate || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Driver Coverage</span>
                <span className="text-white font-semibold">
                  {(summary?.totalTrucks || 0) > 0 ? 
                    Math.round(((summary?.totalDrivers || 0) / (summary?.totalTrucks || 0)) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Loads per Driver</span>
                <span className="text-white font-semibold">
                  {(summary?.activeDrivers || 0) > 0 ? 
                    ((summary?.totalLoads || 0) / (summary?.activeDrivers || 0)).toFixed(1) : '0.0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Size Recommendations */}
      {(summary?.fleetSize || 'solo') === "solo" && (
        <Card className="bg-blue-500/10 border-blue-500/20 border">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <h3 className="text-blue-400 font-semibold">Growth Opportunity</h3>
                <p className="text-gray-300 text-sm">
                  Consider expanding to a small fleet (2-10 trucks) to increase revenue potential and operational efficiency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(summary?.utilizationRate || 0) < 75 && (
        <Card className="bg-yellow-500/10 border-yellow-500/20 border">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Gauge className="w-5 h-5 text-yellow-400 mt-1" />
              <div>
                <h3 className="text-yellow-400 font-semibold">Utilization Alert</h3>
                <p className="text-gray-300 text-sm">
                  Fleet utilization is below optimal levels. Consider load board integration or route optimization to improve efficiency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}