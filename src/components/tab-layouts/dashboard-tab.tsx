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
  Clock,
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";
import { useFleetMetrics, useTrucks, useLoads } from "@/hooks/useSupabase";
import LoadCalculator from "@/components/load-calculator";
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
  const { user } = useAuth();
  const { metrics, summary: fleetSummary, loading: metricsLoading } = useFleetMetrics();
  const { trucks, loading: trucksLoading } = useTrucks();
  const { loads, loading: loadsLoading } = useLoads();

  const isLoading = metricsLoading || trucksLoading || loadsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 pb-20 md:pb-6 animate-pulse">
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
    <div className="p-6 space-y-6 pb-20 md:pb-6">
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

      {/* Top KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${((metrics as any)?.totalRevenue ?? (fleetSummary as any)?.totalRevenue ?? 0).toLocaleString()}`}
          description="This period"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Cost Per Mile"
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
          trend="neutral"
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/operations?action=add-load">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Load
              </Button>
            </Link>
            <Link href="/operations?action=add-truck">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Truck
              </Button>
            </Link>
            <Link href="/operations?action=add-driver">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="performance" className="text-slate-300 data-[state=active]:text-white">
            Performance
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-slate-300 data-[state=active]:text-white">
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance KPIs */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Fleet Status */}
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
                  <span className="font-semibold text-white">{(metrics as any)?.activeTrucks ?? (fleetSummary as any)?.activeTrucks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Trucks</span>
                  <span className="font-semibold text-white">{(metrics as any)?.totalTrucks ?? (fleetSummary as any)?.totalTrucks ?? (trucks as any[]).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Utilization</span>
                  <Badge variant={((metrics as any)?.utilizationRate ?? 0) > 80 ? 'default' : 'secondary'} className="bg-blue-600 text-white">
                    {((metrics as any)?.utilizationRate ?? 0).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Load Calculator */}
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package className="h-5 w-5" />
                  Load Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LoadCalculator />
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
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-slate-300">
                        {(trucks as any[])?.length} truck{(trucks as any[])?.length !== 1 ? 's' : ''} in fleet
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-slate-300">No trucks registered yet</span>
                    </div>
                  )}
                  
                  {(loads as any[])?.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-slate-300">
                        {(loads as any[])?.length} load{(loads as any[])?.length !== 1 ? 's' : ''} this period
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-slate-300">No loads recorded yet</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Trends Charts Placeholder */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>Revenue trend charts will be displayed here</p>
                  <p className="text-sm">Integration with charting library pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Cost Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>Cost trend analysis will be displayed here</p>
                  <p className="text-sm">Integration with analytics pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
