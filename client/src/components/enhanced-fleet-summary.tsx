import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Fuel, 
  Target,
  CheckCircle2,
  AlertTriangle,
  Users,
  Route
} from "lucide-react";
import { useDemoApi } from "@/hooks/useDemoApi";

export default function EnhancedFleetSummary() {
  const { useDemoQuery } = useDemoApi();
  
  const { data: fleetSummary = {} } = useDemoQuery(
    ['enhanced-fleet-summary'],
    '/api/fleet-summary',
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: metrics = {} } = useDemoQuery(
    ['enhanced-metrics'],
    '/api/metrics',
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: trucks = [] } = useDemoQuery(
    ['enhanced-trucks'],
    '/api/trucks',
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const performanceScore = Math.round(
    ((fleetSummary?.profitMargin || 0) * 0.4 + 
     (fleetSummary?.utilizationRate || 0) * 0.4 + 
     ((metrics?.fuelEfficiencyRating === 'Excellent' ? 100 : 
       metrics?.fuelEfficiencyRating === 'Good' ? 80 : 
       metrics?.fuelEfficiencyRating === 'Average' ? 60 : 40) * 0.2))
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Attention";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Fleet Overview */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-blue-600" />
            <span>Fleet Overview</span>
          </CardTitle>
          <CardDescription>
            Complete operational summary for your fleet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {fleetSummary?.totalTrucks || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Trucks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {fleetSummary?.activeTrucks || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {(fleetSummary?.totalMiles || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Miles</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${(fleetSummary?.totalRevenue || 0) >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                ${(fleetSummary?.totalRevenue || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Revenue</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fleet Utilization</span>
              <span className="text-sm font-bold">{fleetSummary?.utilizationRate || 0}%</span>
            </div>
            <Progress value={fleetSummary?.utilizationRate || 0} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Performance Score */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-green-600" />
            <span>Fleet Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="relative">
            <div className={`text-6xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              out of 100
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={`${
              performanceScore >= 80 
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                : performanceScore >= 60
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
            }`}
          >
            {getScoreLabel(performanceScore)}
          </Badge>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Based on profit margin, utilization, and efficiency metrics
          </div>
        </CardContent>
      </Card>
    </div>
  );
}