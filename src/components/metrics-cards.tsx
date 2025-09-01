import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Package, Truck, PieChart, TrendingUp, TrendingDown, Fuel, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FleetMetricsService } from "@/lib/supabase-client";

export default function MetricsCards() {
  // ✅ FIXED: Use real Supabase service instead of placeholder
  const { data: metrics = {}, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const fleetSummary = await FleetMetricsService.getFleetSummary();
      const fleetMetrics = await FleetMetricsService.getFleetMetrics();
      
      console.log('Metrics Cards Debug - Fleet Summary:', fleetSummary);
      
      // Calculate metrics from real data
      const result = {
        costPerMile: fleetSummary.avgCostPerMile || 0,
        totalLoads: fleetSummary.totalLoads || 0,
        totalTrucks: fleetSummary.totalTrucks || 0,
        activeTrucks: fleetSummary.activeTrucks || 0,
        utilization: fleetSummary.utilizationRate || 0,
        totalRevenue: fleetSummary.totalRevenue || 0,
        profitMargin: fleetSummary.profitMargin || 0
      };
      
      console.log('Metrics Cards Debug - Calculated Result:', result);
      return result;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Check if we have any actual data
  const hasData = metrics && (
    (metrics as any)?.totalLoads > 0 || 
    (metrics as any)?.activeTrucks > 0 ||
    (metrics as any)?.costPerMile > 0
  );

  const cards = [
    {
      title: "Total Cost Per Mile",
      value: `$${(metrics as any)?.costPerMile || "0.00"}`,
      icon: DollarSign,
      change: hasData ? (metrics as any)?.costPerMileChange : null,
      changeText: "from last week"
    },
    {
      title: "Total Loads",
      value: (metrics as any)?.totalLoads?.toString() || "0",
      icon: Package,
      change: hasData ? (metrics as any)?.totalLoadsChange : null,
      changeText: "from last week"
    },
    {
      title: "Active Trucks",
      value: `${(metrics as any)?.activeTrucks || 0}/${(metrics as any)?.totalTrucks || 0}`,
      icon: Truck,
      change: hasData ? (metrics as any)?.activeTrucksChange : null,
      changeText: "from last week"
    },
    {
      title: "Fleet Utilization",
      value: `${(metrics as any)?.utilization || 0}%`,
      icon: PieChart,
      change: hasData ? (metrics as any)?.utilizationChange : null,
      changeText: "from last week"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-[var(--dark-card)] border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-4"></div>
                <div className="h-8 bg-gray-600 rounded mb-4"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const hasValidChange = card.change !== null && card.change !== undefined;
        const isPositive = hasValidChange && card.change > 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="bg-[var(--dark-card)] border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                </div>
                <div className="w-12 h-12 bg-[var(--primary-blue)] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Icon className="text-[var(--primary-blue)] h-6 w-6" />
                </div>
              </div>
              {hasValidChange ? (
                <div className="flex items-center mt-4 text-sm">
                  <span className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendIcon className="w-3 h-3 mr-1" />
                    {Math.abs(card.change)}%
                  </span>
                  <span className="text-gray-400 ml-2">{card.changeText}</span>
                </div>
              ) : (
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-gray-500">No historical data available</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
