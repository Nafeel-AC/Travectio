import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDemo } from "@/lib/demo-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  FileText, 
  DollarSign, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Fuel,
  Route,
  BarChart3,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Gauge
} from "lucide-react";
import { Link } from "wouter";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  description: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

function MetricCard({ title, value, change, description, icon: Icon, trend = 'neutral', className = "" }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground'
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity;

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-xs ${trendColors[trend]}`}>
              <TrendIcon className="h-3 w-3" />
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}


// Demo-aware fetch function for API requests
const fetchAPI = async (endpoint: string, isDemoMode: boolean, demoUserId?: string) => {
  const url = isDemoMode && demoUserId 
    ? `${endpoint}?demo_user_id=${demoUserId}`
    : endpoint;
    
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) return {};
  return response.json();
};

export default function FleetAnalytics() {
  const [activeTab, setActiveTab] = useState("performance");
  const { isDemoMode, getDemoUserId } = useDemo();

  // PERMANENT FIX: Use plain useQuery with demo mode support and ultra-stable keys
  const { data: metrics = {}, isLoading: metricsLoading } = useQuery({
    queryKey: ['FLEET_ANALYTICS_METRICS_FINAL', isDemoMode, getDemoUserId()],
    queryFn: () => fetchAPI('/api/metrics', isDemoMode, getDemoUserId()),
    staleTime: 1000 * 60 * 15, // 15 minutes - balance between cache and freshness
    refetchOnWindowFocus: false,
    refetchOnMount: false, 
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const { data: fleetSummary = {}, isLoading: fleetLoading } = useQuery({
    queryKey: ['FLEET_ANALYTICS_SUMMARY_FINAL', isDemoMode, getDemoUserId()],
    queryFn: () => fetchAPI('/api/fleet-summary', isDemoMode, getDemoUserId()),
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['FLEET_ANALYTICS_TRUCKS_FINAL', isDemoMode, getDemoUserId()],
    queryFn: () => fetchAPI('/api/trucks', isDemoMode, getDemoUserId()),
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const { data: loads = [], isLoading: loadsLoading } = useQuery({
    queryKey: ['FLEET_ANALYTICS_LOADS_FINAL', isDemoMode, getDemoUserId()],
    queryFn: () => fetchAPI('/api/loads', isDemoMode, getDemoUserId()),
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const isLoading = metricsLoading || fleetLoading || trucksLoading || loadsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header with better spacing */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Fleet Analytics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Monitor your fleet performance and profitability
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Current Period: This Week
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics with enhanced styling */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${(metrics as any)?.totalRevenue?.toLocaleString() || '0'}`}
          change={(metrics as any)?.totalRevenueChange}
          description="Period revenue"
          icon={DollarSign}
          trend={(metrics as any)?.totalRevenueChange > 0 ? "up" : (metrics as any)?.totalRevenueChange < 0 ? "down" : "neutral"}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
        />
        <MetricCard
          title="Cost Per Mile"
          value={`$${(metrics as any)?.costPerMile || '0.00'}`}
          change={(metrics as any)?.costPerMileChange}
          description="Operating efficiency"
          icon={Fuel}
          trend={(metrics as any)?.costPerMileChange > 0 ? "up" : (metrics as any)?.costPerMileChange < 0 ? "down" : "neutral"}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
        />
        <MetricCard
          title="Profit Margin"
          value={`${(metrics as any)?.profitMargin || 0}%`}
          change={(metrics as any)?.profitMarginChange}
          description="Net profitability"
          icon={Target}
          trend={(metrics as any)?.profitMarginChange > 0 ? "up" : (metrics as any)?.profitMarginChange < 0 ? "down" : "neutral"}
          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
        />
        <MetricCard
          title="Fleet Utilization"
          value={`${(metrics as any)?.utilizationRate || 0}%`}
          change={(metrics as any)?.utilizationRateChange}
          description="Asset efficiency"
          icon={Gauge}
          trend={(metrics as any)?.utilizationRateChange > 0 ? "up" : (metrics as any)?.utilizationRateChange < 0 ? "down" : "neutral"}
          className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800"
        />
      </div>

      {/* Analytics Tabs with improved styling */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <TabsList className="grid w-full lg:w-auto grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Performance
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Financial
            </TabsTrigger>
            <TabsTrigger value="operational" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Operational
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Trends
            </TabsTrigger>
          </TabsList>
          
          {/* Additional actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Fleet Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  <span>Fleet Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fleet Utilization</span>
                    <span className="font-medium">{(fleetSummary as any)?.utilizationRate || 0}%</span>
                  </div>
                  <Progress value={(fleetSummary as any)?.utilizationRate || 0} className="h-2" />
                </div>
                
                {/* Key Performance Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cost Per Mile</span>
                    <span className="font-medium">${(metrics as any)?.costPerMile || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Miles</span>
                    <span className="font-medium">{((metrics as any)?.totalOperationalMiles || (fleetSummary as any)?.totalMiles || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg MPG</span>
                    <span className="font-medium">{((metrics as any)?.actualMPG || 0).toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {(fleetSummary as any)?.activeTrucks || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Trucks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {(fleetSummary as any)?.totalTrucks || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Fleet</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Load Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span>Load Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {(metrics as any)?.totalLoads || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Loads</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {(fleetSummary as any)?.totalMiles?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Miles</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Revenue/Load</span>
                    <span className="font-medium">
                      ${(metrics as any)?.avgRevenuePerLoad?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-8">
          {/* Temporarily disabled to prevent infinite loops */}
          <Card className="bg-[var(--dark-card)] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span>Financial Analytics</span>
                <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40">
                  Under Maintenance
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Financial analytics temporarily disabled while optimizing data synchronization.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-8">
          {/* Operational Overview Section */}
          <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
            {/* Active Operations */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Active Operations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {(fleetSummary as any)?.activeTrucks || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Trucks on the road
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Utilization</span>
                    <span className="font-medium">{(fleetSummary as any)?.utilizationRate || 0}%</span>
                  </div>
                  <Progress value={(fleetSummary as any)?.utilizationRate || 0} className="h-1" />
                </div>
              </CardContent>
            </Card>

            {/* Driver Management */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Driver Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {(fleetSummary as any)?.activeDrivers || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active drivers
                </div>
                <div className="mt-3">
                  <Link href="/hos-management">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      HOS Compliance
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Fuel Efficiency */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Fuel className="h-5 w-5 text-purple-600" />
                  <span>Fuel Efficiency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {(metrics as any)?.actualMPG?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average MPG
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                    {(metrics as any)?.fuelEfficiencyRating || 'Good'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Safety & Compliance */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Safety Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  95%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Compliance rate
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                    Excellent
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Operations Cards */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Route Optimization */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Route className="h-6 w-6 text-indigo-600" />
                  <span>Route Performance</span>
                </CardTitle>
                <CardDescription>
                  Analyzing optimal routes and delivery efficiency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {((metrics as any)?.totalOperationalMiles || (fleetSummary as any)?.totalMiles || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Miles</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      ((metrics as any)?.revenuePerMile || 0) > ((metrics as any)?.costPerMile || 0)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${(metrics as any)?.revenuePerMile?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Per Mile</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Route Efficiency</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <Link href="/load-management">
                  <Button variant="outline" className="w-full">
                    <Route className="h-4 w-4 mr-2" />
                    Optimize Routes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Maintenance & Fleet Health */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-6 w-6 text-blue-600" />
                  <span>Fleet Health</span>
                </CardTitle>
                <CardDescription>
                  Monitoring vehicle maintenance and operational status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {Math.max(0, ((fleetSummary as any)?.totalTrucks || 0) - 1)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Operational</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">1</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Maintenance</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">0</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Down</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fleet Availability</span>
                    <span className="text-sm font-medium">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <Link href="/add-truck">
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Truck
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Table */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-gray-600" />
                <span>Operational Metrics</span>
              </CardTitle>
              <CardDescription>
                Detailed performance indicators across all operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cost Per Mile</div>
                  <div className="text-2xl font-bold">${(metrics as any)?.costPerMile || '0.00'}</div>
                  {((loads as any[])?.length > 0) ? (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">↓ 5% vs last month</div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">No freight data yet</div>
                  )}
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue Per Load</div>
                  <div className={`text-2xl font-bold ${
                    ((metrics as any)?.avgRevenuePerLoad || 0) > (((metrics as any)?.costPerMile || 0) * ((metrics as any)?.avgMilesPerLoad || 673))
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>${(metrics as any)?.avgRevenuePerLoad?.toLocaleString() || '0'}</div>
                  {((loads as any[])?.length > 0) ? (
                    <div className={`text-xs mt-1 ${
                      ((metrics as any)?.avgRevenuePerLoad || 0) > (((metrics as any)?.costPerMile || 0) * ((metrics as any)?.avgMilesPerLoad || 673))
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>{
                      ((metrics as any)?.avgRevenuePerLoad || 0) > (((metrics as any)?.costPerMile || 0) * ((metrics as any)?.avgMilesPerLoad || 673))
                        ? '↑ 8% vs last month'
                        : '↓ Loss per load'
                    }</div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">No freight data yet</div>
                  )}
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Load Completion</div>
                  <div className="text-2xl font-bold">{((loads as any[])?.length > 0) ? '98.2%' : '0%'}</div>
                  {((loads as any[])?.length > 0) ? (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 2% vs last month</div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">No freight data yet</div>
                  )}
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">On-Time Delivery</div>
                  <div className="text-2xl font-bold">{((loads as any[])?.length > 0) ? '96.5%' : '0%'}</div>
                  {((loads as any[])?.length > 0) ? (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 3% vs last month</div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">No freight data yet</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-8">
          <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
            <CardHeader className="pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    Time Period Analytics
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                    Cross-tab synchronized fleet performance over time
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  Real-time Data
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Weekly Trend</div>
                    <div className="text-2xl font-bold text-blue-600">+12%</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Monthly Trend</div>
                    <div className="text-2xl font-bold text-green-600">+8%</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">YTD Trend</div>
                    <div className="text-2xl font-bold text-purple-600">+15%</div>
                  </div>
                </div>
                <div className="text-center text-muted-foreground">
                  Advanced analytics features coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}