import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimeFilterProvider } from "@/lib/time-filter-context";
import { DemoProvider } from "@/lib/demo-context";
import { OrgRoleProvider } from "@/lib/org-role-context";
// import { AntiPollingWrapper } from "@/components/anti-polling-wrapper";
import EnhancedDashboard from "@/pages/enhanced-dashboard";
import Profile from "@/pages/profile";

import GuidedTruckAddition from "@/pages/guided-truck-addition";
import TruckProfile from "@/pages/truck-profile";
import TruckProfiles from "@/pages/truck-profiles";
import FleetManagement from "@/pages/fleet-management";
import TruckCostBreakdown from "@/pages/truck-cost-breakdown";
import NotFound from "@/pages/not-found";
import HOSManagement from "@/pages/hos-management";
import LoadManagement from "@/pages/load-management";
import FuelManagement from "@/pages/fuel-management";
import MyLoads from "@/pages/my-loads";
import AssignedTruckPage from "@/pages/assigned-truck";
import UserManagement from "@/pages/user-management";
import SessionManagement from "@/pages/session-management";
import FleetAnalytics from "@/pages/fleet-analytics";
import IntegrationManagement from "@/pages/integration-management";
import IntegrationOnboarding from "@/pages/integration-onboarding";
import APICredentialsGuide from "@/components/api-credentials-guide";
import OwnerDashboard from "@/pages/owner-dashboard";
import FounderDriverOverview from "@/pages/founder-driver-overview";
import OrgMembersPage from "@/pages/org-members";
import UserGuide from "@/pages/user-guide";
import EnhancedLanding from "@/components/enhanced-landing";
import LoginPage from "@/components/login-page";
import ModernLayout from "@/components/modern-layout";
import UnifiedDashboard from "@/components/unified-dashboard";
import MainTabLayout from "@/components/tab-layouts/main-tab-layout";
import LoadMatcher from "@/pages/load-matcher";
import DriversPage from "@/pages/drivers";
import EnvDebug from "@/components/env-debug";
import AdminDashboard from "@/pages/admin-dashboard";
import PricingPage from "@/pages/pricing";
import InviteRedeemPage from "@/pages/invite";
import RouteGuard from "@/components/route-guard";
import PendingInviteHandler from "@/components/pending-invite-handler";
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
      <PendingInviteHandler />
      <Switch>
        {/* Routes that use the new tab layout */}
        <Route path="/">
          <MainTabLayout>
            <DashboardRouter />
          </MainTabLayout>
        </Route>
        <Route path="/dashboard">
          <MainTabLayout>
            <DashboardRouter />
          </MainTabLayout>
        </Route>
        <Route path="/operations">
          <MainTabLayout />
        </Route>
        <Route path="/compliance">
          <MainTabLayout />
        </Route>
        <Route path="/finance">
          <MainTabLayout />
        </Route>
        <Route path="/marketplace">
          <MainTabLayout />
        </Route>
        <Route path="/settings">
          <MainTabLayout />
        </Route>

        {/* Legacy routes that map to new tab system */}
        <Route path="/add-truck">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <GuidedTruckAddition />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/truck-profiles">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <FleetManagement />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/fleet-management">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <FleetManagement />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route
          path="/truck/:id"
          component={(params: any) => (
            <MainTabLayout>
              <RouteGuard requireCustomer>
                <TruckProfile {...params} />
              </RouteGuard>
            </MainTabLayout>
          )}
        />
        <Route
          path="/trucks/:truckId/cost-breakdown"
          component={(params: any) => (
            <MainTabLayout>
              <RouteGuard requireCustomer>
                <TruckCostBreakdown {...params} />
              </RouteGuard>
            </MainTabLayout>
          )}
        />
        <Route path="/hos-management">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <HOSManagement />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/load-management">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <LoadManagement />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/my-loads">
          <MainTabLayout>
            <RouteGuard requireCustomer requireDriver>
              <MyLoads />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/assigned-truck">
          <MainTabLayout>
            <RouteGuard requireCustomer requireDriver>
              <AssignedTruckPage />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/load-matcher">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <LoadMatcher />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/drivers">
          <MainTabLayout>
            <RouteGuard>
              <DriversPage />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/fuel-management">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <FuelManagement />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/fleet-analytics">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <FleetAnalytics />
            </RouteGuard>
          </MainTabLayout>
        </Route>
        <Route path="/enhanced-dashboard">
          <MainTabLayout>
            <RouteGuard requireCustomer>
              <EnhancedDashboard />
            </RouteGuard>
          </MainTabLayout>
        </Route>

        {/* Admin routes - keep separate from tab layout */}
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/customer-dashboard" component={UnifiedDashboard} />
        <Route path="/profile" component={Profile} />

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
        <Route path="/integration-management">
          <RouteGuard requireAdmin>
            <IntegrationManagement />
          </RouteGuard>
        </Route>

        {/* Owner-only: Organization Members */}
        <Route path="/org-members">
          <RouteGuard requireOwner>
            <OrgMembersPage />
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
          <OrgRoleProvider>
          {/* <AntiPollingWrapper> */}
          <TimeFilterProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </TimeFilterProvider>
          {/* </AntiPollingWrapper> */}
          </OrgRoleProvider>
        </DemoProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
