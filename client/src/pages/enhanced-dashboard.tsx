import { useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import MetricsCards from "@/components/metrics-cards";
import LoadCalculator from "@/components/load-calculator";
import CostChart from "@/components/cost-chart";
import FleetOverview from "@/components/fleet-overview";
// import FleetSummary from "@/components/fleet-summary"; // Temporarily disabled due to infinite loop
import HOSDashboard from "@/components/hos-dashboard";
import LoadBoard from "@/components/load-board";
import IntelligentLoadMatcher from "@/components/intelligent-load-matcher";
import { TruckCostBreakdown } from "@/components/truck-cost-breakdown";
import { MultiLegLoadPlanner } from "@/components/multi-leg-load-planner";

import { CrossTabConnectivityStatus } from "@/components/cross-tab-connectivity-status";
import { TimePeriodFilter, type TimePeriod } from "@/components/time-period-filter";
import { useTimeFilter } from "@/lib/time-filter-context";
// import { TimeAnalyticsDashboard } from "@/components/time-analytics-dashboard"; // Temporarily disabled due to infinite loop
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavigationLayout } from "@/components/global-navigation";
import { useStableQuery } from "@/hooks/use-stable-query";
import { CheckCircle, Truck, AlertTriangle, Info, Clock, Package, BarChart3, TrendingUp, DollarSign, Calendar, Plus, BookOpen, Fuel } from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function EnhancedDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview"); // "overview", "matcher", "hos", "loadboard", "fleet", "costs", "planning", "analytics"
  const { setTimePeriod, currentPeriod } = useTimeFilter();
  const [, setLocation] = useLocation();

  const { data: activities = [] } = useStableQuery<any[]>(
    ["/api/activities"], 
    () => fetch("/api/activities").then(res => res.json())
  );

  const { data: loadCategories } = useStableQuery<{
    categories?: { dryVan?: number; reefer?: number; flatbed?: number };
    profitability?: { dryVan?: number; reefer?: number; flatbed?: number };
  }>(
    ["/api/load-categories"],
    () => fetch("/api/load-categories").then(res => res.json())
  );

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

  const renderViewContent = () => {
    switch (activeView) {
      case "matcher":
        return <IntelligentLoadMatcher />;
      case "hos":
        return <HOSDashboard />;
      case "loadboard":
        return <LoadBoard />;
      case "fleet":
        return (
          <Card className="bg-[var(--dark-card)] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span>Fleet Summary</span>
                <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40">
                  Under Maintenance
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Fleet summary temporarily disabled while optimizing data synchronization.</p>
            </CardContent>
          </Card>
        );
      case "costs":
        return <TruckCostBreakdown />;
      case "planning":
        return <MultiLegLoadPlanner />;
      case "analytics":
        return (
          <Card className="bg-[var(--dark-card)] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span>Analytics Dashboard</span>
                <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40">
                  Under Maintenance
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Analytics dashboard temporarily disabled while optimizing data synchronization.</p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <>
            {/* Time Period Filter */}
            <div className="mb-6">
              <TimePeriodFilter 
                onPeriodChange={setTimePeriod} 
                currentPeriod={currentPeriod} 
              />
            </div>
            
            {/* KPI Cards */}
            <MetricsCards />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">HOS Management</h3>
                        <p className="text-slate-400 text-sm">Track driver hours and compliance</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setLocation("/hos-management")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Manage HOS
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-600 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Load Management</h3>
                        <p className="text-slate-400 text-sm">Add loads and track freight</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setLocation("/load-management")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Manage Loads
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-600 p-2 rounded-lg">
                        <Fuel className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Fuel Management</h3>
                        <p className="text-slate-400 text-sm">Track fuel purchases and costs</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setLocation("/fuel-management")}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Manage Fuel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fleet Overview */}
              <div className="lg:col-span-2">
                <FleetOverview />
              </div>

              {/* Cross-Tab Connectivity Status */}
              <div className="lg:col-span-1">
                <CrossTabConnectivityStatus />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            {loadCategories?.categories?.dryVan || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-[var(--blue-accent)] rounded-full"></div>
                            <span className="text-gray-300">Reefer</span>
                          </div>
                          <span className="text-white font-semibold">
                            {loadCategories?.categories?.reefer || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span className="text-gray-300">Flatbed</span>
                          </div>
                          <span className="text-white font-semibold">
                            {loadCategories?.categories?.flatbed || 0}
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
                                style={{ width: `${loadCategories?.profitability?.dryVan || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-white">
                              {Math.round(loadCategories?.profitability?.dryVan || 0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Reefer</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${loadCategories?.profitability?.reefer || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-white">
                              {Math.round(loadCategories?.profitability?.reefer || 0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Flatbed</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${loadCategories?.profitability?.flatbed || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-white">
                              {Math.round(loadCategories?.profitability?.flatbed || 0)}%
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
                  {activities.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No recent activities</p>
                  ) : (
                    activities.map((activity: any) => (
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
          </>
        );
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case "matcher":
        return "Intelligent Load Matching";
      case "hos":
        return "Hours of Service Compliance";
      case "loadboard":
        return "Load Board - Available Freight";
      case "fleet":
        return "Fleet Management Overview";
      case "costs":
        return "Truck Cost Breakdown";
      case "planning":
        return "Multi-Leg Load Planning";
      case "analytics":
        return "Time-Based Analytics Dashboard";
      default:
        return "Fleet Management Dashboard";
    }
  };

  return (
    <NavigationLayout currentPath="/">
      <div className="min-h-screen bg-[var(--dark-bg)]">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <main className="flex-1 p-6 space-y-6 lg:ml-64">
          {/* Navigation Tabs */}
          <Card className="bg-[var(--dark-card)] border-gray-700">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h1 className="text-2xl font-bold text-white">{getViewTitle()}</h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {activeView === "overview" && "Monitor your fleet performance and profitability"}
                    {activeView === "analytics" && "View fleet data across weekly, bi-weekly, monthly, quarterly, bi-annual, and yearly time periods with cross-tab synchronization"}
                    {activeView === "matcher" && "AI-powered load recommendations based on cost per mile and HOS compliance"}
                    {activeView === "hos" && "Track driver compliance with DOT regulations"}
                    {activeView === "loadboard" && "Find and assign profitable loads from major load boards"}
                    {activeView === "fleet" && "Comprehensive fleet metrics and scalability insights"}
                    {activeView === "costs" && "Detailed breakdown of fixed and variable costs per truck for driver transparency"}
                    {activeView === "planning" && "Plan 3-5 load legs in advance for weekly scheduling and profit optimization"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setActiveView("overview")}
                    variant={activeView === "overview" ? "default" : "outline"}
                    className={`${
                      activeView === "overview"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    }`}
                    size="sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </Button>
                  <Button
                    onClick={() => setActiveView("analytics")}
                    variant={activeView === "analytics" ? "default" : "outline"}
                    className={`${
                      activeView === "analytics"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    }`}
                    size="sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Time Analytics
                  </Button>
                  <Button
                    onClick={() => setActiveView("matcher")}
                    variant={activeView === "matcher" ? "default" : "outline"}
                    className={`${
                      activeView === "matcher"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    }`}
                    size="sm"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Load Matcher
                  </Button>
                  <Button
                    onClick={() => setActiveView("hos")}
                    variant={activeView === "hos" ? "default" : "outline"}
                    className={`${
                      activeView === "hos"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    }`}
                    size="sm"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    HOS Compliance
                  </Button>
                  <Button
                    onClick={() => setActiveView("loadboard")}
                    variant={activeView === "loadboard" ? "default" : "outline"}
                    className={`${
                      activeView === "loadboard"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    }`}
                    size="sm"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Load Board
                  </Button>
                  <Button
                    onClick={() => setActiveView("fleet")}
                    variant={activeView === "fleet" ? "default" : "outline"}
                    className={`${
                      activeView === "fleet"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    }`}
                    size="sm"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Fleet Analytics
                  </Button>
                  <Button
                    onClick={() => setActiveView("costs")}
                    variant={activeView === "costs" ? "default" : "outline"}
                    className={`${
                      activeView === "costs"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    }`}
                    size="sm"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cost Breakdown
                  </Button>
                  <Button
                    onClick={() => setActiveView("planning")}
                    variant={activeView === "planning" ? "default" : "outline"}
                    className={`${
                      activeView === "planning"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    }`}
                    size="sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Load Planning
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Content Area */}
          {renderViewContent()}
          </main>
        </div>
      </div>
    </NavigationLayout>
  );
}