import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";
import WelcomeOnboarding from "./welcome-onboarding";
import LoadCalculator from "./load-calculator";
import IntegrationSetupCard from "./integration-setup-card";
import { useDemoApi } from "@/hooks/useDemoApi";

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
    <Card className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-slate-700 bg-slate-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-white">{value}</div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-xs ${trendColors[trend]}`}>
              <TrendIcon className="h-3 w-3" />
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const { useDemoQuery } = useDemoApi();
  // FIXED: Demo-aware queries with stable caching
  const { data: metrics = {}, isLoading: metricsLoading } = useDemoQuery(
    ['unified-dashboard-metrics'],
    '/api/metrics',
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 10, // 10 minutes caching instead of 0
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: fleetSummary = {}, isLoading: fleetLoading } = useDemoQuery(
    ['unified-dashboard-fleet-summary'],
    '/api/fleet-summary',
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 10, // 10 minutes caching
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: trucks = [], isLoading: trucksLoading } = useDemoQuery(
    ['unified-dashboard-trucks'],
    '/api/trucks',
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 10, // 10 minutes caching instead of 0
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: loads = [], isLoading: loadsLoading } = useDemoQuery(
    ['unified-dashboard-loads'],
    '/api/loads',
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 10, // 10 minutes caching
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // For new users, show welcome onboarding if they have no trucks and no loads
  const isFirstTime = !((trucks as any[])?.length) && !((loads as any[])?.length);
  const isLoading = metricsLoading || fleetLoading || trucksLoading || loadsLoading;
  

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-slate-600 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isFirstTime) {
    return (
      <div className="p-6">
        <WelcomeOnboarding />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {(user as any)?.firstName ? `Welcome back, ${(user as any).firstName}!` : "Dashboard"}
          </h1>
          <p className="text-slate-400">
            Here's what's happening with your fleet today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-slate-700 text-slate-300 hidden sm:flex">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Cost Per Mile"
          value={`$${((metrics as any)?.costPerMile ?? 0).toFixed(2)}`}
          description="Average operational cost"
          icon={DollarSign}
          trend="neutral"
        />
        <MetricCard
          title="Profit Margin"
          value={`${((metrics as any)?.profitMargin ?? 0).toFixed(1)}%`}
          description="Current profitability"
          icon={TrendingUp}
          trend={((metrics as any)?.profitMargin ?? 0) >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="Active Trucks"
          value={`${(metrics as any)?.activeTrucks ?? (fleetSummary as any)?.activeTrucks ?? 0}/${(metrics as any)?.totalTrucks ?? (fleetSummary as any)?.totalTrucks ?? (trucks as any[]).length}`}
          description="Fleet utilization"
          icon={Truck}
          trend="neutral"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${((metrics as any)?.totalRevenue ?? (fleetSummary as any)?.totalRevenue ?? 0).toLocaleString()}`}
          description="This period"
          icon={BarChart3}
          trend={((metrics as any)?.totalRevenue ?? (fleetSummary as any)?.totalRevenue ?? 0) >= 0 ? "up" : "down"}
        />
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Fleet Status */}
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Truck className="h-5 w-5" />
              Fleet Status
            </CardTitle>
            <CardDescription className="text-slate-400">
              Current fleet utilization and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Utilization Rate</span>
              <Badge variant={((metrics as any)?.utilizationRate ?? (fleetSummary as any)?.utilizationRate ?? 0) > 80 ? 'default' : 'secondary'} 
                     className="bg-blue-600 text-white">
                {((metrics as any)?.utilizationRate ?? (fleetSummary as any)?.utilizationRate ?? 0).toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Active Trucks</span>
              <span className="font-semibold text-white">{(metrics as any)?.activeTrucks ?? (fleetSummary as any)?.activeTrucks ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total Trucks</span>
              <span className="font-semibold text-white">{(metrics as any)?.totalTrucks ?? (fleetSummary as any)?.totalTrucks ?? (trucks as any[]).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Inactive Trucks</span>
              <span className="font-semibold text-slate-400">
                {((fleetSummary as any)?.totalTrucks ?? 0) - ((fleetSummary as any)?.activeTrucks ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Load Calculator */}
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Route className="h-5 w-5" />
              Load Calculator
            </CardTitle>
            <CardDescription className="text-slate-400">
              Calculate profitability for potential loads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadCalculator />
          </CardContent>
        </Card>

        {/* Integration Setup */}
        <IntegrationSetupCard userHasTrucks={(trucks as any[])?.length > 0} />
      </div>

      {/* Revenue Breakdown */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Revenue Breakdown - ${((fleetSummary as any)?.totalRevenue ?? 0).toLocaleString()}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Detailed breakdown of revenue by individual loads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(loads as any[])?.length > 0 ? (
            <div className="space-y-3">
              {(loads as any[]).map((load: any) => (
                <div key={load.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                        </div>
                        <div className="text-sm text-slate-400">
                          {load.miles} miles • {load.commodity}
                          {load.weight && ` • ${load.weight.toLocaleString()} lbs`}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Load #{load.id.substring(0, 8)}... • Status: {load.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-400 text-lg">
                          ${load.pay?.toLocaleString() ?? '0'}
                        </div>
                        <div className="text-sm text-slate-400">
                          ${((load.pay ?? 0) / (load.miles ?? 1)).toFixed(2)}/mile
                        </div>
                        {load.profit !== undefined && (
                          <div className={`text-sm font-medium ${load.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            Profit: {load.profit >= 0 ? '+' : ''}${load.profit.toFixed(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 font-medium">Total Revenue from {(loads as any[]).length} loads:</span>
                  <span className="text-2xl font-bold text-blue-400">
                    ${(loads as any[]).reduce((sum: number, load: any) => sum + (load.pay ?? 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-300">Average per load:</span>
                  <span className="font-semibold text-blue-400">
                    ${((loads as any[]).reduce((sum: number, load: any) => sum + (load.pay ?? 0), 0) / (loads as any[]).length).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p>No loads recorded yet</p>
              <p className="text-sm">Revenue breakdown will appear when loads are added</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5" />
              Financial Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Cost Per Mile</span>
              <span className="font-semibold text-white">
                ${((metrics as any)?.costPerMile ?? 0).toFixed(3)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Revenue Per Mile</span>
              <span className="font-semibold text-white">
                ${((metrics as any)?.revenuePerMile ?? 0).toFixed(3)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Profit Per Mile</span>
              <span className={`font-semibold ${(((metrics as any)?.revenuePerMile ?? 0) - ((metrics as any)?.costPerMile ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${(((metrics as any)?.revenuePerMile ?? 0) - ((metrics as any)?.costPerMile ?? 0)).toFixed(3)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              Load Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total Loads</span>
              <span className="font-semibold text-white">{(metrics as any)?.totalLoads ?? (loads as any[]).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">This Week</span>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {(loads as any[])?.length ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Fuel className="h-5 w-5" />
              Fuel Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Cost Per Mile</span>
              <span className="font-semibold text-white">
                ${((metrics as any)?.costPerMile ?? 0).toFixed(3)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total Miles</span>
              <span className="font-semibold text-white">
                {((metrics as any)?.totalOperationalMiles ?? (metrics as any)?.totalMiles ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Avg MPG</span>
              <Badge variant={((metrics as any)?.actualMPG ?? 0) > ((metrics as any)?.averageMPG ?? 0) ? 'default' : 'secondary'}
                     className="bg-green-600 text-white">
                {((metrics as any)?.fuelEfficiencyRating ?? 'Good')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5" />
            Fleet Overview Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <span className="text-slate-300 font-medium">Fleet Utilization</span>
            <div className="text-2xl font-bold text-white">
              {((metrics as any)?.utilizationRate ?? 0) > 80 ? 
                <span className="text-green-400">{((metrics as any)?.utilizationRate ?? 0).toFixed(1)}%</span> :
                <span className="text-yellow-400">{((metrics as any)?.utilizationRate ?? 0).toFixed(1)}%</span>
              }
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-slate-300 font-medium">Total Revenue</span>
            <div className="text-2xl font-bold text-green-400">
              ${((metrics as any)?.totalRevenue ?? (fleetSummary as any)?.totalRevenue ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-slate-300 font-medium">Profit Margin</span>
            <div className={`text-2xl font-bold ${((metrics as any)?.profitMargin ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {((metrics as any)?.profitMargin ?? 0).toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(trucks as any[])?.length > 0 ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-slate-300">
                  {(trucks as any[])?.length} truck{(trucks as any[])?.length !== 1 ? 's' : ''} in fleet
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-slate-300">No trucks registered yet</span>
              </div>
            )}
            
            {(loads as any[])?.length > 0 ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-slate-300">
                  {(loads as any[])?.length} load{(loads as any[])?.length !== 1 ? 's' : ''} this period
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-slate-300">No loads recorded yet</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}