import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimeFilterProvider } from "@/lib/time-filter-context";
import { DemoProvider } from "@/lib/demo-context";
// import { AntiPollingWrapper } from "@/components/anti-polling-wrapper";
import EnhancedDashboard from "@/pages/enhanced-dashboard";
import Profile from "@/pages/profile";

import GuidedTruckAddition from "@/pages/guided-truck-addition";
import TruckProfile from "@/pages/truck-profile";
import TruckProfiles from "@/pages/truck-profiles";
import TruckCostBreakdown from "@/pages/truck-cost-breakdown";
import NotFound from "@/pages/not-found";
import HOSManagement from "@/pages/hos-management";
import LoadManagement from "@/pages/load-management";
import FuelManagement from "@/pages/fuel-management";
import UserManagement from "@/pages/user-management";
import SessionManagement from "@/pages/session-management";
import FleetAnalytics from "@/pages/fleet-analytics";
import IntegrationManagement from "@/pages/integration-management";
import IntegrationOnboarding from "@/pages/integration-onboarding";
import APICredentialsGuide from "@/components/api-credentials-guide";
import OwnerDashboard from "@/pages/owner-dashboard";
import UserGuide from "@/pages/user-guide";
import EnhancedLanding from "@/components/enhanced-landing";
import LoginPage from "@/components/login-page";
import ModernLayout from "@/components/modern-layout";
import UnifiedDashboard from "@/components/unified-dashboard";
import LoadMatcher from "@/pages/load-matcher";
import DriversPage from "@/pages/drivers";
import EnvDebug from "@/components/env-debug";
import { useAuth } from "@/hooks/useSupabase";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  // Debug logging
  console.log('[Router] Loading state:', loading, 'Authenticated:', isAuthenticated);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
          <p className="text-white text-sm mt-2">Please wait while we authenticate...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route path="/about" component={EnhancedLanding} />
        <Route path="/debug" component={EnvDebug} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  return (
    <ModernLayout>
      <Switch>
        <Route path="/" component={UnifiedDashboard} />
        <Route path="/fleet-analytics" component={FleetAnalytics} />
        <Route path="/enhanced-dashboard" component={EnhancedDashboard} />
        <Route path="/profile" component={Profile} />

        <Route path="/add-truck" component={GuidedTruckAddition} />
        <Route path="/truck-profiles" component={TruckProfiles} />
        <Route path="/truck/:id" component={TruckProfile} />
        <Route
          path="/trucks/:truckId/cost-breakdown"
          component={TruckCostBreakdown}
        />
        <Route path="/hos-management" component={HOSManagement} />
        <Route path="/load-management" component={LoadManagement} />
        <Route path="/load-matcher" component={LoadMatcher} />
        <Route path="/drivers" component={DriversPage} />
        <Route path="/fuel-management" component={FuelManagement} />
        <Route path="/user-management" component={UserManagement} />
        <Route path="/session-management" component={SessionManagement} />
        <Route
          path="/integration-management"
          component={IntegrationManagement}
        />
        <Route
          path="/integration-onboarding"
          component={IntegrationOnboarding}
        />
        <Route path="/api-credentials-guide" component={APICredentialsGuide} />
        <Route path="/owner-dashboard" component={OwnerDashboard} />
        <Route path="/user-guide" component={UserGuide} />
        <Route path="/debug" component={EnvDebug} />
        <Route component={NotFound} />
      </Switch>
    </ModernLayout>
  );
}

function App() {
  return (
    <div className="dark">
      <QueryClientProvider client={queryClient}>
        <DemoProvider>
          {/* <AntiPollingWrapper> */}
          <TimeFilterProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </TimeFilterProvider>
          {/* </AntiPollingWrapper> */}
        </DemoProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
