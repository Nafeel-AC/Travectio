import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDemoApi } from "@/hooks/useDemoApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Truck, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Fuel,
  Clock,
  Plus,
  MapPin,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { MobileLoadEntryForm, MobileHOSEntryForm } from "./mobile-optimized-forms";
import { OfflineStatusIndicator } from "./offline-status-indicator";
import { cn } from "@/lib/utils";

interface FleetMetrics {
  totalTrucks: number;
  activeTrucks: number;
  totalRevenue: number;
  totalProfit: number;
  totalMiles: number;
  avgProfitPerMile: number;
}

interface Load {
  id: string;
  pay: number;
  miles: number;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  status: string;
  profit: number;
  ratePerMile: number;
}

interface Truck {
  id: string;
  name: string;
  totalMiles: number;
  costPerMile: number;
  isActive: number;
}

export default function MobileDashboard() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const { useDemoQuery } = useDemoApi();
  const { data: metrics } = useDemoQuery(
    ["mobile-dashboard-metrics"],
    "/api/metrics",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Provide safe defaults for metrics
  const safeMetrics = {
    totalTrucks: metrics?.totalTrucks || 0,
    activeTrucks: metrics?.activeTrucks || 0,
    totalRevenue: metrics?.totalRevenue || 0,
    totalProfit: metrics?.totalProfit || 0,
    totalMiles: metrics?.totalMiles || 0,
    avgProfitPerMile: metrics?.avgProfitPerMile || 0,
  };

  const { data: trucks = [] } = useDemoQuery(
    ["mobile-dashboard-trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: loads = [] } = useDemoQuery(
    ["mobile-dashboard-loads"],
    "/api/loads",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const recentLoads = loads.slice(0, 3);
  const activeTrucks = trucks.filter(truck => truck.isActive === 1);

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = "default" }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: any;
    color?: "default" | "success" | "warning" | "danger";
  }) => (
    <Card className={cn(
      "relative overflow-hidden",
      color === "success" && "border-green-200 bg-green-50 dark:bg-green-950",
      color === "warning" && "border-orange-200 bg-orange-50 dark:bg-orange-950",
      color === "danger" && "border-red-200 bg-red-50 dark:bg-red-950"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Icon className={cn(
            "w-8 h-8",
            color === "success" && "text-green-600",
            color === "warning" && "text-orange-600",
            color === "danger" && "text-red-600",
            color === "default" && "text-primary"
          )} />
        </div>
      </CardContent>
    </Card>
  );

  const QuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <MobileLoadEntryForm />
          <MobileHOSEntryForm />
          <Button variant="outline" className="w-full touch-target">
            <Fuel className="w-4 h-4 mr-2" />
            Add Fuel Purchase
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const FleetOverview = () => (
    <div className="space-y-4">
      <div className="mobile-grid">
        <MetricCard
          title="Total Revenue"
          value={`$${safeMetrics.totalRevenue.toLocaleString()}`}
          subtitle="This week"
          icon={DollarSign}
          color="success"
        />
        <MetricCard
          title="Total Profit"
          value={`$${safeMetrics.totalProfit.toLocaleString()}`}
          subtitle={`$${safeMetrics.avgProfitPerMile.toFixed(2)}/mile`}
          icon={TrendingUp}
          color={safeMetrics.totalProfit > 0 ? "success" : "danger"}
        />
        <MetricCard
          title="Active Trucks"
          value={`${activeTrucks.length}/${trucks.length}`}
          subtitle="Fleet status"
          icon={Truck}
        />
        <MetricCard
          title="Total Miles"
          value={safeMetrics.totalMiles.toLocaleString()}
          subtitle="This week"
          icon={MapPin}
        />
      </div>

      <QuickActions />
    </div>
  );

  const RecentLoads = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Loads</CardTitle>
      </CardHeader>
      <CardContent>
        {recentLoads.length > 0 ? (
          <div className="space-y-4">
            {recentLoads.map((load) => (
              <div key={load.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {load.miles} miles
                    </div>
                  </div>
                  <Badge variant={load.profit > 0 ? "default" : "destructive"} className="text-xs">
                    {load.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">${load.pay.toLocaleString()}</span>
                  <span className={cn(
                    "font-medium",
                    load.profit > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {load.profit > 0 ? '+' : ''}${load.profit.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2" />
            <p>No recent loads</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const TruckStatus = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fleet Status</CardTitle>
      </CardHeader>
      <CardContent>
        {trucks.length > 0 ? (
          <div className="space-y-3">
            {trucks.map((truck) => (
              <div key={truck.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    truck.isActive ? "bg-green-500" : "bg-gray-400"
                  )} />
                  <div>
                    <div className="font-medium text-sm">{truck.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {truck.totalMiles.toLocaleString()} miles
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${truck.costPerMile.toFixed(2)}/mi
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cost per mile
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="w-8 h-8 mx-auto mb-2" />
            <p>No trucks registered</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isMobile) {
    return (
      <div className="safe-area-top">
        {/* Mobile Header with sync status */}
        <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <OfflineStatusIndicator />
          </div>
        </div>

        {/* Mobile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[73px] z-30 bg-background border-b border-border">
            <TabsList className="grid w-full grid-cols-3 rounded-none h-12">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="loads" className="text-xs">Loads</TabsTrigger>
              <TabsTrigger value="fleet" className="text-xs">Fleet</TabsTrigger>
            </TabsList>
          </div>

          <div className="px-4 pb-4">
            <TabsContent value="overview" className="mt-4">
              <FleetOverview />
            </TabsContent>

            <TabsContent value="loads" className="mt-4">
              <RecentLoads />
            </TabsContent>

            <TabsContent value="fleet" className="mt-4">
              <TruckStatus />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  }

  // Desktop layout (use existing streamlined dashboard)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fleet Dashboard</h1>
        <OfflineStatusIndicator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${safeMetrics.totalRevenue.toLocaleString()}`}
          subtitle="This week"
          icon={DollarSign}
          color="success"
        />
        <MetricCard
          title="Total Profit"
          value={`$${safeMetrics.totalProfit.toLocaleString()}`}
          subtitle={`$${safeMetrics.avgProfitPerMile.toFixed(2)}/mile`}
          icon={TrendingUp}
          color={safeMetrics.totalProfit > 0 ? "success" : "danger"}
        />
        <MetricCard
          title="Active Trucks"
          value={`${activeTrucks.length}/${trucks.length}`}
          subtitle="Fleet status"
          icon={Truck}
        />
        <MetricCard
          title="Total Miles"
          value={safeMetrics.totalMiles.toLocaleString()}
          subtitle="This week"
          icon={MapPin}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLoads />
        <TruckStatus />
      </div>

      <QuickActions />
    </div>
  );
}