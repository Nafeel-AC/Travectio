import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileDashboard from "./mobile-dashboard";
import { useDemoApi } from "@/hooks/useDemoApi";
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
  ArrowDownRight
} from "lucide-react";
import { Link } from "wouter";
import WelcomeOnboarding from "./welcome-onboarding";
import LoadCalculator from "./load-calculator";
import WorkflowProgress from "./workflow-progress";
import NextStepGuide from "./next-step-guide";
import { useAuth } from "@/hooks/useSupabase";

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

export default function StreamlinedDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const { useDemoQuery } = useDemoApi();
  
  // FIXED: Demo-aware queries with aggressive caching
  const { data: metrics = {}, isLoading: metricsLoading } = useDemoQuery(
    ['streamlined-metrics'],
    '/api/metrics',
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: fleetSummary = {}, isLoading: fleetLoading } = useDemoQuery(
    ['streamlined-fleet-summary'],
    '/api/fleet-summary',
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: trucks = [], isLoading: trucksLoading } = useDemoQuery(
    ['streamlined-trucks'],
    '/api/trucks',
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: loads = [], isLoading: loadsLoading } = useDemoQuery(
    ['streamlined-loads'],
    '/api/loads',
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  
  // Use mobile-optimized dashboard on mobile devices
  if (isMobile) {
    return <MobileDashboard />;
  }

  const isFirstTime = !trucks?.length && !loads?.length;
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

  if (isFirstTime) {
    return <WelcomeOnboarding />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.firstName ? `Welcome back, ${user.firstName}!` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your fleet today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="hidden sm:flex">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Summary Metrics (non-financial) */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <MetricCard
          title="Active Trucks"
          value={fleetSummary?.activeTrucks || 0}
          description={`of ${fleetSummary?.totalTrucks || 0} total trucks`}
          icon={Truck}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fleet">Fleet Status</TabsTrigger>
          <TabsTrigger value="loads">Load Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Next Step Guide and Load Calculator */}
          <div className="grid gap-6 lg:grid-cols-2">
            <NextStepGuide />
            <LoadCalculator />
          </div>
          
          {/* Fleet Overview Cards */}
          <div className="grid gap-6 md:grid-cols-2">
              {/* Fleet Health moved to right side */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Fleet Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilization Rate</span>
                    <span className="font-medium">{fleetSummary?.utilizationRate || 0}%</span>
                  </div>
                  <Progress value={fleetSummary?.utilizationRate || 0} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {fleetSummary?.activeTrucks || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {(fleetSummary?.totalTrucks || 0) - (fleetSummary?.activeTrucks || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Inactive</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common fleet management tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Link href="/add-truck">
                  <Button variant="outline" size="sm" className="w-full justify-start h-12">
                    <Truck className="h-4 w-4 mr-2" />
                    Add Truck
                  </Button>
                </Link>
                <Link href="/load-management">
                  <Button variant="outline" size="sm" className="w-full justify-start h-12">
                    <FileText className="h-4 w-4 mr-2" />
                    New Load
                  </Button>
                </Link>
                <Link href="/fuel-management">
                  <Button variant="outline" size="sm" className="w-full justify-start h-12">
                    <Fuel className="h-4 w-4 mr-2" />
                    Fuel Entry
                  </Button>
                </Link>
                <Link href="/fleet-analytics">
                  <Button variant="outline" size="sm" className="w-full justify-start h-12">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Load delivered successfully</span>
                    <span className="text-muted-foreground ml-auto">2h ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Fuel purchase recorded</span>
                    <span className="text-muted-foreground ml-auto">4h ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span>New load assigned</span>
                    <span className="text-muted-foreground ml-auto">6h ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trucks?.map((truck: any) => (
              <Card key={truck.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{truck.name}</CardTitle>
                    <Badge variant={truck.isActive ? "default" : "secondary"}>
                      {truck.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {truck.driver?.name || "No driver assigned"} • {truck.equipmentType}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cost per Mile</span>
                      <span className="font-medium">${truck.costPerMile}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Miles</span>
                      <span className="font-medium">{truck.totalMiles?.toLocaleString()}</span>
                    </div>
                    <Link href={`/truck/${truck.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="loads" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Load Management</h3>
            <Link href="/load-management">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Load
              </Button>
            </Link>
          </div>
          
          <div className="grid gap-4">
            {loads?.slice(0, 5).map((load: any) => (
              <Card key={load.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {load.miles} miles • ${load.pay.toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={load.status === 'delivered' ? 'default' : 'secondary'}>
                      {load.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Cost Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span>Cost Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cost Per Mile</span>
                    <span className="font-medium">${metrics?.costPerMile || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Revenue Per Mile</span>
                    <span className="font-medium">${(metrics?.revenuePerMile || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Profit Per Mile</span>
                    <span className="font-medium text-green-600">
                      ${((metrics?.revenuePerMile || 0) - (metrics?.costPerMile || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Based on {metrics?.totalLoads || 0} completed loads
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <span>Cost Per Mile</span>
                    <span className="font-medium">${metrics?.costPerMile || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Miles</span>
                    <span className="font-medium">{(metrics?.totalOperationalMiles || metrics?.totalMiles || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg MPG</span>
                    <span className="font-medium">{(metrics?.actualMPG || metrics?.averageMPG || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fuel Efficiency</span>
                    <span className="font-medium">{metrics?.fuelEfficiencyRating || 'Good'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilization Rate</span>
                    <span className="font-medium">{fleetSummary?.utilizationRate || 0}%</span>
                  </div>
                  <Progress value={fleetSummary?.utilizationRate || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Revenue Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Revenue</span>
                    <span className="font-medium">${(fleetSummary?.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Profit Margin</span>
                    <span className="font-medium text-green-600">{fleetSummary?.profitMargin || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Load Count</span>
                    <span className="font-medium">{loads?.length || 0} loads</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Link href="/fleet-analytics">
                    <Button variant="outline" size="sm" className="w-full">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Detailed Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}