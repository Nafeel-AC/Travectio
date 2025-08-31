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
import { useDemoApi } from "@/hooks/useDemoApi";
import { CheckCircle, Truck, AlertTriangle, Info, Clock, Package, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

  const { useDemoQuery } = useDemoApi();

  const { data: activities = [] } = useDemoQuery(
    ["/api/activities"],
    "/api/activities",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: loadCategories = { categories: {}, profitability: {} } } = useDemoQuery(
    ["/api/load-categories"],
    "/api/load-categories",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  ) as { data: { categories: any, profitability: any } };

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
        
        <main className="flex-1 p-6 space-y-6 lg:ml-64">
          {/* KPI Cards */}
          <MetricsCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Load Calculator */}
            <div className="lg:col-span-1">
              <LoadCalculator />
            </div>

            {/* Cost Chart */}
            <div className="lg:col-span-2">
              <CostChart />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fleet Overview */}
            <FleetOverview />

            {/* Truck Management */}
            <TruckListManager />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Driver Management */}
            <DriverListManager />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Load Categories */}
            <Card className="bg-[var(--dark-card)] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Load Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Load Distribution</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-[var(--primary-blue)] rounded-full"></div>
                          <span className="text-gray-300">Dry Van</span>
                        </div>
                        <span className="text-white font-semibold">
                          {loadCategories.categories?.dryVan || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-[var(--blue-accent)] rounded-full"></div>
                          <span className="text-gray-300">Reefer</span>
                        </div>
                        <span className="text-white font-semibold">
                          {loadCategories.categories?.reefer || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-gray-300">Flatbed</span>
                        </div>
                        <span className="text-white font-semibold">
                          {loadCategories.categories?.flatbed || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Profitability</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Dry Van</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${loadCategories.profitability?.dryVan || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white">
                            {Math.round(loadCategories.profitability?.dryVan || 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Reefer</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${loadCategories.profitability?.reefer || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white">
                            {Math.round(loadCategories.profitability?.reefer || 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Flatbed</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full" 
                              style={{ width: `${loadCategories.profitability?.flatbed || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white">
                            {Math.round(loadCategories.profitability?.flatbed || 0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card className="bg-[var(--dark-card)] border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recent Activities</CardTitle>
                <button className="text-[var(--primary-blue)] hover:text-[var(--blue-light)] transition-colors text-sm">
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(activities as any[]).length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No recent activities</p>
                ) : (
                  (activities as any[]).map((activity: any) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 bg-[var(--dark-elevated)] rounded-lg">
                      <div className="w-10 h-10 bg-opacity-20 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-gray-400 text-sm">{activity.description}</p>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
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
