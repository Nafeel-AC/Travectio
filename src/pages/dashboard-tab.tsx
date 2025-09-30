import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Truck, 
  Activity,
  Plus,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useFleetMetrics, useTrucks, useLoads } from "@/hooks/useSupabase";
import { Link } from "wouter";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  description: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, description, icon: Icon, trend = 'neutral' }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground'
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-slate-700 bg-slate-800">
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

export default function DashboardTab() {
  const { metrics, summary: fleetSummary, loading: metricsLoading } = useFleetMetrics();
  const { trucks, loading: trucksLoading } = useTrucks();
  const { loads, loading: loadsLoading } = useLoads();

  const isLoading = metricsLoading || trucksLoading || loadsLoading;

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-slate-400">
            Fleet overview and key performance indicators
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${((metrics as any)?.totalRevenue ?? (fleetSummary as any)?.totalRevenue ?? 0).toLocaleString()}`}
          description="This period"
          icon={DollarSign}
          trend={((metrics as any)?.totalRevenue ?? 0) >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="Cost per Mile"
          value={`$${((metrics as any)?.costPerMile ?? 0).toFixed(2)}`}
          description="Fleet average"
          icon={Truck}
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
          title="Fleet Utilization"
          value={`${((metrics as any)?.utilizationRate ?? (fleetSummary as any)?.utilizationRate ?? 0).toFixed(1)}%`}
          description="Active trucks"
          icon={Activity}
          trend={((metrics as any)?.utilizationRate ?? 0) > 80 ? "up" : "down"}
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/load-management">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Load
              </Button>
            </Link>
            <Link href="/add-truck">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Truck
              </Button>
            </Link>
            <Link href="/drivers">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Internal Dashboard Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
          <TabsTrigger value="performance" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-blue-600">
            <Calendar className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6 mt-6">
          {/* Performance KPIs */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Fleet Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Active Trucks</span>
                  <span className="font-semibold text-white">
                    {(metrics as any)?.activeTrucks ?? (trucks as any[])?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Loads</span>
                  <span className="font-semibold text-white">
                    {(loads as any[])?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Avg Revenue/Load</span>
                  <span className="font-semibold text-white">
                    ${(loads as any[])?.length > 0 
                      ? ((loads as any[]).reduce((sum: number, load: any) => sum + (load.pay ?? 0), 0) / (loads as any[]).length).toLocaleString()
                      : '0'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Revenue per Mile</span>
                  <span className="font-semibold text-white">
                    ${((metrics as any)?.revenuePerMile ?? 0).toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Profit per Mile</span>
                  <span className={`font-semibold ${(((metrics as any)?.revenuePerMile ?? 0) - ((metrics as any)?.costPerMile ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(((metrics as any)?.revenuePerMile ?? 0) - ((metrics as any)?.costPerMile ?? 0)).toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Miles</span>
                  <span className="font-semibold text-white">
                    {((metrics as any)?.totalMiles ?? 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Operational Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Utilization Rate</span>
                  <Badge variant={((metrics as any)?.utilizationRate ?? 0) > 80 ? 'default' : 'secondary'} 
                         className="bg-blue-600 text-white">
                    {((metrics as any)?.utilizationRate ?? 0).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Load Success Rate</span>
                  <span className="font-semibold text-green-400">
                    {((loads as any[])?.filter((l: any) => l.status === 'delivered').length ?? 0) / Math.max((loads as any[])?.length ?? 1, 1) * 100}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Avg Load Distance</span>
                  <span className="font-semibold text-white">
                    {(loads as any[])?.length > 0 
                      ? ((loads as any[]).reduce((sum: number, load: any) => sum + (load.miles ?? 0), 0) / (loads as any[]).length).toLocaleString()
                      : '0'
                    } miles
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          {/* Trends and Analytics */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-lg font-medium mb-2">Trends Coming Soon</p>
                <p className="text-sm">
                  Historical performance charts and trend analysis will be available here.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(loads as any[])?.slice(0, 5).map((load: any) => (
                  <div key={load.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        Load #{load.id.substring(0, 8)}...
                      </div>
                      <div className="text-sm text-slate-400">
                        {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-400">
                        ${load.pay?.toLocaleString() ?? '0'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {load.status}
                      </div>
                    </div>
                  </div>
                ))}
                {(loads as any[])?.length === 0 && (
                  <div className="text-center py-4 text-slate-400">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
