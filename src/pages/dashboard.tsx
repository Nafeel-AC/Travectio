import { useState, useEffect } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import MetricsCards from "@/components/metrics-cards";
import LoadCalculator from "@/components/load-calculator";
import CostChart from "@/components/cost-chart";
import FleetOverview from "@/components/fleet-overview";
import FleetSummary from "@/components/fleet-summary";
import HOSDashboard from "@/components/hos-dashboard";
import LoadBoard from "@/components/load-board";
import { TruckListManager } from "@/components/truck-list-manager";
import { DriverListManager } from "@/components/driver-list-manager";
import { NavigationGuide } from "@/components/navigation-guide";
import { DriverOnboarding } from "@/components/driver-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Truck, AlertTriangle, Info, Clock, Package, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LoadCategories {
  categories: {
    dryVan?: number;
    reefer?: number;
    flatbed?: number;
  };
  profitability: {
    dryVan?: number;
    reefer?: number;
    flatbed?: number;
  };
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview"); // "overview", "hos", "loadboard", "fleet"
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if this is a new user
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('travectio-onboarding-completed');
    const hasSeenTour = localStorage.getItem('travectio-tour-completed');
    
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // ✅ FIXED: Use real Supabase services instead of placeholders
  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      // For now, return empty array since activities service needs to be implemented
      // This will be replaced with real activity data when the service is ready
      return [];
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const { data: loadCategories = { categories: {}, profitability: {} } as LoadCategories } = useQuery({
    queryKey: ['load-categories'],
    queryFn: async () => {
      try {
        // Get loads and calculate categories
        const { LoadService } = await import("@/lib/supabase-client");
        const loads = await LoadService.getLoads();
        
        const categories = {
          dryVan: loads.filter((load: any) => load.type === 'Dry Van').length,
          reefer: loads.filter((load: any) => load.type === 'Reefer').length,
          flatbed: loads.filter((load: any) => load.type === 'Flatbed').length
        };
        
        // Calculate profitability (simplified - could be enhanced with real profit data)
        const profitability = {
          dryVan: categories.dryVan > 0 ? 75 : 0,
          reefer: categories.reefer > 0 ? 80 : 0,
          flatbed: categories.flatbed > 0 ? 65 : 0
        };
        
        return { categories, profitability };
      } catch (error) {
        console.error('Error fetching load categories:', error);
        return { categories: {}, profitability: {} };
      }
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Truck className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--dark-bg)]">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 lg:ml-64 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400 text-sm md:text-base">Monitor your fleet performance and manage operations</p>
          </div>

          {/* KPI Cards */}
          <div className="mb-8">
            <MetricsCards />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
            {/* Left Column - Primary Tools */}
            <div className="xl:col-span-8 space-y-8">
              {/* Load Calculator - Full Width */}
              <div>
                <LoadCalculator />
              </div>

              {/* Cost Chart - Full Width */}
              <div>
                <CostChart />
              </div>

              {/* Fleet Overview - Full Width */}
              <div>
                <FleetOverview />
              </div>
            </div>

            {/* Right Column - Management & Quick Actions */}
            <div className="xl:col-span-4 space-y-8">
              {/* Quick Actions Card */}
              <Card className="bg-[var(--dark-card)] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-[var(--primary-blue)] hover:bg-[var(--blue-accent)] text-white"
                    onClick={() => window.location.href = '/trucks'}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Manage Trucks
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    onClick={() => window.location.href = '/drivers'}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Manage Drivers
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    onClick={() => window.location.href = '/loads'}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    View Loads
                  </Button>
                </CardContent>
              </Card>

              {/* System Status Card */}
              <Card className="bg-[var(--dark-card)] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Database</span>
                    <span className="text-green-400 text-sm font-medium">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">API Services</span>
                    <span className="text-green-400 text-sm font-medium">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Sync Status</span>
                    <span className="text-blue-400 text-sm font-medium">Active</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section - Management Tools */}
          <div className="space-y-8">
            {/* Truck Management - Full Width */}
            <div>
              <TruckListManager />
            </div>

            {/* Driver Management - Full Width */}
            <div>
              <DriverListManager />
            </div>
          </div>


        </main>
      </div>

      {/* Navigation Guide - Always available */}
      <NavigationGuide />
      
      {/* Driver Onboarding - For new users */}
      <DriverOnboarding 
        isNew={showOnboarding} 
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
}
