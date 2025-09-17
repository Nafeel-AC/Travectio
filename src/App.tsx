import { Switch, Route, useLocation } from "wouter";
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
import FounderDriverOverview from "@/pages/founder-driver-overview";
import UserGuide from "@/pages/user-guide";
import EnhancedLanding from "@/components/enhanced-landing";
import LoginPage from "@/components/login-page";
import ModernLayout from "@/components/modern-layout";
import UnifiedDashboard from "@/components/unified-dashboard";
import LoadMatcher from "@/pages/load-matcher";
import DriversPage from "@/pages/drivers";
import EnvDebug from "@/components/env-debug";
import AdminDashboard from "@/pages/admin-dashboard";
import BetaInvitesPage from "@/pages/beta-invites";
import BetaAccessPage from "@/pages/beta-access";
import PricingPage from "@/pages/pricing";
import InviteRedeemPage from "@/pages/invite";
import RouteGuard from "@/components/route-guard";
import { useAuth } from "@/hooks/useSupabase";
import { useFounderAccess } from "@/hooks/useFounderAccess";

function Router() {
  const { isAuthenticated, loading } = useAuth();
  const { isFounder, isAdmin } = useFounderAccess();

  // Debug logging
  console.log(
    "[Router] Loading state:",
    loading,
    "Authenticated:",
    isAuthenticated,
    "isFounder:",
    isFounder,
    "isAdmin:",
    isAdmin
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
          <p className="text-white text-sm mt-2">
            Please wait while we authenticate...
          </p>
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

  // Component to handle dashboard routing based on user role
  function DashboardRouter() {
    const [location] = useLocation();

    // If accessing root ("/"), redirect based on user role
    if (location === "/") {
      // If user is founder, redirect to owner dashboard by default
      if (isFounder) {
        return <OwnerDashboard />;
      }
      // If user is admin but not founder, show admin dashboard
      else if (isAdmin) {
        return <AdminDashboard />;
      }
      // Regular customers get the unified dashboard
      else {
        return <UnifiedDashboard />;
      }
    }

    // For any other route, return null (let other routes handle it)
    return null;
  }

  return (
    <ModernLayout>
      <Switch>
        <Route path="/" component={DashboardRouter} />
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/customer-dashboard" component={UnifiedDashboard} />
        <Route path="/fleet-analytics" component={FleetAnalytics} />
        <Route path="/enhanced-dashboard" component={EnhancedDashboard} />
        <Route path="/profile" component={Profile} />

        {/* Customer-only routes */}
        <Route path="/add-truck">
          <RouteGuard requireCustomer>
            <GuidedTruckAddition />
          </RouteGuard>
        </Route>
        <Route path="/truck-profiles">
          <RouteGuard requireCustomer>
            <TruckProfiles />
          </RouteGuard>
        </Route>
        <Route
          path="/truck/:id"
          component={(params: any) => (
            <RouteGuard requireCustomer>
              <TruckProfile {...params} />
            </RouteGuard>
          )}
        />
        <Route
          path="/trucks/:truckId/cost-breakdown"
          component={(params: any) => (
            <RouteGuard requireCustomer>
              <TruckCostBreakdown {...params} />
            </RouteGuard>
          )}
        />
        <Route path="/hos-management">
          <RouteGuard requireCustomer>
            <HOSManagement />
          </RouteGuard>
        </Route>
        <Route path="/load-management">
          <RouteGuard requireCustomer>
            <LoadManagement />
          </RouteGuard>
        </Route>
        <Route path="/load-matcher">
          <RouteGuard requireCustomer>
            <LoadMatcher />
          </RouteGuard>
        </Route>
        <Route path="/drivers">
          <RouteGuard>
            <DriversPage />
          </RouteGuard>
        </Route>
        <Route path="/fuel-management">
          <RouteGuard requireCustomer>
            <FuelManagement />
          </RouteGuard>
        </Route>
        <Route path="/fleet-analytics">
          <RouteGuard requireCustomer>
            <FleetAnalytics />
          </RouteGuard>
        </Route>
        <Route path="/enhanced-dashboard">
          <RouteGuard requireCustomer>
            <EnhancedDashboard />
          </RouteGuard>
        </Route>

        {/* Admin-only routes */}
        <Route path="/user-management">
          <RouteGuard requireAdmin>
            <UserManagement />
          </RouteGuard>
        </Route>
        <Route path="/session-management">
          <RouteGuard requireAdmin>
            <SessionManagement />
          </RouteGuard>
        </Route>
        <Route path="/beta-invites">
          <RouteGuard requireAdmin>
            <BetaInvitesPage />
          </RouteGuard>
        </Route>
        <Route path="/beta-access">
          <RouteGuard requireFounder>
            <BetaAccessPage />
          </RouteGuard>
        </Route>
        <Route path="/integration-management">
          <RouteGuard requireAdmin>
            <IntegrationManagement />
          </RouteGuard>
        </Route>

        {/* Founder-only routes */}
        <Route path="/owner-dashboard">
          <RouteGuard requireFounder>
            <OwnerDashboard />
          </RouteGuard>
        </Route>
        <Route path="/founder-driver-overview">
          <RouteGuard requireFounder>
            <FounderDriverOverview />
          </RouteGuard>
        </Route>

        {/* General routes */}
        <Route path="/pricing" component={PricingPage} />
        <Route path="/invite" component={InviteRedeemPage} />
        <Route
          path="/integration-onboarding"
          component={IntegrationOnboarding}
        />
        <Route path="/api-credentials-guide" component={APICredentialsGuide} />
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
