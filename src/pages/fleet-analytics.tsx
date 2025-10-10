import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, TrendingDown, Truck, Package, DollarSign, Fuel, Users, Route, Clock, AlertTriangle, BarChart3, Receipt, Plus, Download, FileText, Lock, Eye } from "lucide-react";
import { Link } from "wouter";
import { useDemo } from "@/lib/demo-context";
import { useFleetMetrics, useTrucks, useLoads } from "@/hooks/useSupabase";
import { useRoleAccess } from "@/hooks/useOrgData";
import { useOrgRole } from "@/lib/org-role-context";

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

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

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
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FleetAnalytics() {
  const [activeTab, setActiveTab] = useState("performance");
  const { isDemoMode, getDemoUserId } = useDemo();
  const { role } = useOrgRole();
  const roleAccess = useRoleAccess();

  // Check if user has access to analytics
  if (!roleAccess.canViewAnalytics && role !== 'owner') {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <Lock className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-red-300 mb-2">Access Restricted</h2>
          <p className="text-red-400 mb-4">
            Analytics are only available to organization owners.
          </p>
          <p className="text-slate-400 text-sm">
            Contact your organization owner for access to fleet analytics and business insights.
          </p>
        </div>
      </div>
    );
  }

  // Use new Supabase hooks instead of old fetchAPI calls
  const { metrics, summary, loading: metricsLoading } = useFleetMetrics();
  const { trucks, loading: trucksLoading } = useTrucks();
  const { loads, loading: loadsLoading } = useLoads();

  // Use the summary data from the hook, with fallbacks
  const fleetSummary = summary || {
    totalTrucks: trucks?.length || 0,
    totalLoads: loads?.length || 0,
    activeTrucks: trucks?.filter(truck => truck.status === 'active')?.length || 0,
    totalMiles: 0,
    totalRevenue: 0,
    avgCostPerMile: 0,
    profitMargin: 0,
    utilizationRate: 0
  };

  // Debug logging to verify data is being read correctly
  console.log('Fleet Analytics Debug:', {
    summary,
    metrics,
    trucks: trucks?.length,
    loads: loads?.length,
    fleetSummary,
    trucksData: trucks?.slice(0, 2), // Show first 2 trucks for debugging
    loadsData: loads?.slice(0, 2)    // Show first 2 loads for debugging
  });

  const isLoading = metricsLoading || trucksLoading || loadsLoading;

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
            {role === 'owner' 
              ? 'Monitor your fleet performance and profitability' 
              : 'Operational fleet metrics and performance data'
            }
          </p>
          
          {/* Role-based access indicator */}
          {role === 'owner' && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 text-blue-300">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Owner View: Full business analytics and financial insights</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Current Period: This Week
          </Button>
          {role === 'owner' && (
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Key Performance Metrics with enhanced styling */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${(fleetSummary as any)?.totalRevenue?.toLocaleString() || '0'}`}
          description="Period revenue"
          icon={DollarSign}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
        />
        <MetricCard
          title="Cost Per Mile"
          value={`$${(fleetSummary as any)?.avgCostPerMile?.toFixed(2) || '0.00'}`}
          description="Operating efficiency"
          icon={Fuel}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
        />
        <MetricCard
          title="Profit Margin"
          value={`${(fleetSummary as any)?.profitMargin?.toFixed(1) || 0}%`}
          description="Net profitability"
          icon={Package}
          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
        />
        <MetricCard
          title="Fleet Utilization"
          value={`${(fleetSummary as any)?.utilizationRate?.toFixed(1) || 0}%`}
          description="Asset efficiency"
          icon={Users}
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
                    <span className="font-medium">${(fleetSummary as any)?.avgCostPerMile?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Miles</span>
                    <span className="font-medium">{(fleetSummary as any)?.totalMiles?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg MPG</span>
                    <span className="font-medium">{(fleetSummary as any)?.avgMPG?.toFixed(1) || '0.0'}</span>
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
                  <Package className="h-5 w-5 text-green-500" />
                  <span>Load Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {(fleetSummary as any)?.totalLoads || 0}
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
                      ${(fleetSummary as any)?.totalLoads > 0 ? ((fleetSummary as any)?.totalRevenue / (fleetSummary as any)?.totalLoads)?.toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-8">
          {/* Financial Overview Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${(fleetSummary as any)?.totalRevenue?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-400">
                      ${((fleetSummary as any)?.totalRevenue || 0) - ((fleetSummary as any)?.netProfit || 0)}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Net Profit</p>
                    <p className={`text-2xl font-bold ${((fleetSummary as any)?.netProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(fleetSummary as any)?.netProfit?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Profit Margin</p>
                    <p className={`text-2xl font-bold ${((fleetSummary as any)?.profitMargin || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(fleetSummary as any)?.profitMargin?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Management Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700">
              <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="expenses" className="text-slate-300 data-[state=active]:text-white">
                Expense Management
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-slate-300 data-[state=active]:text-white">
                P&L Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Load Revenue</span>
                        <span className="text-white font-semibold">
                          ${(fleetSummary as any)?.totalRevenue?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Loads</span>
                        <span className="text-white">{(fleetSummary as any)?.totalLoads || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Revenue/Load</span>
                        <span className="text-white">
                          ${(fleetSummary as any)?.totalLoads > 0 ? 
                            (((fleetSummary as any)?.totalRevenue || 0) / (fleetSummary as any)?.totalLoads).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Cost Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cost Per Mile</span>
                        <span className="text-white font-semibold">
                          ${(fleetSummary as any)?.avgCostPerMile?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Miles</span>
                        <span className="text-white">{(fleetSummary as any)?.totalMiles?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fleet Utilization</span>
                        <span className="text-white">{(fleetSummary as any)?.utilizationRate?.toFixed(1) || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Expense Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Expense Tracking</h3>
                    <p className="text-slate-400 mb-4">
                      Track and manage all fleet expenses including fuel, maintenance, insurance, and more.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Link href="/fuel-management">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Fuel className="w-4 h-4 mr-2" />
                          Fuel Management
                        </Button>
                      </Link>
                      <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Expense
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">P&L Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Profit & Loss Reports</h3>
                    <p className="text-slate-400 mb-4">
                      Generate detailed financial reports and export data for accounting purposes.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export P&L
                      </Button>
                      <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        Custom Period
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="operational" className="space-y-8">
          {/* Operational Overview Section */}
          <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
            {/* Active Operations */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Users className="h-5 w-5 text-green-600" />
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
                  {(fleetSummary as any)?.avgMPG?.toFixed(1) || '0.0'}
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
                    {(fleetSummary as any)?.totalMiles?.toLocaleString() || 0}
                  </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Miles</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      ((fleetSummary as any)?.totalRevenue / (fleetSummary as any)?.totalMiles || 0) > ((fleetSummary as any)?.avgCostPerMile || 0)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${((fleetSummary as any)?.totalRevenue / (fleetSummary as any)?.totalMiles || 0)?.toFixed(2) || '0.00'}
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
                    <Users className="h-4 w-4 mr-2" />
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
                <Package className="h-6 w-6 text-gray-600" />
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
                  <div className="text-2xl font-bold">${(fleetSummary as any)?.avgCostPerMile?.toFixed(2) || '0.00'}</div>
                  {((loads as any[])?.length > 0) ? (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">↓ 5% vs last month</div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">No freight data yet</div>
                  )}
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue Per Load</div>
                  <div className={`text-2xl font-bold ${
                    ((fleetSummary as any)?.totalLoads > 0 ? ((fleetSummary as any)?.totalRevenue / (fleetSummary as any)?.totalLoads) : 0) > (((fleetSummary as any)?.avgCostPerMile || 0) * 673)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>${(fleetSummary as any)?.totalLoads > 0 ? ((fleetSummary as any)?.totalRevenue / (fleetSummary as any)?.totalLoads)?.toLocaleString() : '0'}</div>
                  {((loads as any[])?.length > 0) ? (
                    <div className={`text-xs mt-1 ${
                      ((fleetSummary as any)?.totalLoads > 0 ? ((fleetSummary as any)?.totalRevenue / (fleetSummary as any)?.totalLoads) : 0) > (((fleetSummary as any)?.avgCostPerMile || 0) * 673)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>{
                      ((fleetSummary as any)?.totalLoads > 0 ? ((fleetSummary as any)?.totalRevenue / (fleetSummary as any)?.totalLoads) : 0) > (((fleetSummary as any)?.avgCostPerMile || 0) * 673)
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