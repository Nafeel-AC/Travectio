import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Truck, 
  BarChart3,
  Plus,
  Package,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAuth, useFleetMetrics, useTrucks, useLoads } from "@/hooks/useSupabase";
import BottomNavigation from "@/components/bottom-navigation";
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function DashboardTabs() {
  const { user } = useAuth();
  const { metrics, summary: fleetSummary, loading: metricsLoading } = useFleetMetrics();
  const { trucks, loading: trucksLoading } = useTrucks();
  const { loads, loading: loadsLoading } = useLoads();
  const isMobile = useIsMobile();

  const isLoading = metricsLoading || trucksLoading || loadsLoading;

  // Quick Actions
  const quickActions = [
    {
      label: "Add Load",
      icon: Package,
      href: "/operations-tabs?tab=loads",
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      label: "Add Truck",
      icon: Truck,
      href: "/operations-tabs?tab=fleet",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      label: "Add Driver",
      icon: Users,
      href: "/operations-tabs?tab=drivers",
      color: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="pb-20 md:pb-0"> {/* Add bottom padding for mobile navigation only */}
        {/* Header */}
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
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

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  className={`${action.color} text-white`}
                  onClick={() => window.location.href = action.href}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-800 border-slate-700">
              <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {/* Top KPIs */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Total Revenue"
                  value={`$${((metrics as any)?.totalRevenue ?? (fleetSummary as any)?.totalRevenue ?? 0).toLocaleString()}`}
                  description="This period"
                  icon={DollarSign}
                  trend={((metrics as any)?.totalRevenue ?? (fleetSummary as any)?.totalRevenue ?? 0) >= 0 ? "up" : "down"}
                />
                <MetricCard
                  title="Cost per Mile"
                  value={`$${((metrics as any)?.costPerMile ?? 0).toFixed(2)}`}
                  description="Fleet average"
                  icon={TrendingUp}
                  trend="neutral"
                />
                <MetricCard
                  title="Profit Margin"
                  value={`${((metrics as any)?.profitMargin ?? 0).toFixed(1)}%`}
                  description="Current profitability"
                  icon={BarChart3}
                  trend={((metrics as any)?.profitMargin ?? 0) >= 0 ? "up" : "down"}
                />
                <MetricCard
                  title="Fleet Utilization"
                  value={`${((metrics as any)?.utilizationRate ?? (fleetSummary as any)?.utilizationRate ?? 0).toFixed(1)}%`}
                  description="Active vs total trucks"
                  icon={Truck}
                  trend={((metrics as any)?.utilizationRate ?? 0) > 80 ? "up" : "down"}
                />
              </div>

              {/* Fleet Overview */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Truck className="h-5 w-5" />
                      Fleet Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Active Trucks</span>
                      <span className="font-semibold text-white">
                        {(metrics as any)?.activeTrucks ?? (fleetSummary as any)?.activeTrucks ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Total Trucks</span>
                      <span className="font-semibold text-white">
                        {(metrics as any)?.totalTrucks ?? (trucks as any[]).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Total Loads</span>
                      <span className="font-semibold text-white">
                        {(loads as any[]).length}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Package className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(loads as any[])?.length > 0 ? (
                      <div className="space-y-3">
                        {(loads as any[]).slice(0, 3).map((load: any) => (
                          <div key={load.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                            <div>
                              <div className="text-sm text-white">
                                {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                              </div>
                              <div className="text-xs text-slate-400">
                                {load.miles} miles • {load.status}
                              </div>
                            </div>
                            <div className="text-green-400 font-semibold">
                              ${load.pay?.toLocaleString() ?? '0'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p>No loads recorded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg mb-2">Trends Coming Soon</p>
                    <p className="text-sm">Advanced analytics and trend visualization will be available in the next update.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      {isMobile && <BottomNavigation />}
    </div>
  );
}
