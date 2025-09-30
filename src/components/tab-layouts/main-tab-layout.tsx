import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useSupabase";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import BottomNavigation from "@/components/bottom-navigation";
import DashboardTab from "@/components/tab-layouts/dashboard-tab";
import OperationsTab from "@/components/tab-layouts/operations-tab";
import ComplianceTab from "@/components/tab-layouts/compliance-tab";
import FinanceTab from "@/components/tab-layouts/finance-tab";
import MarketplaceTab from "@/components/tab-layouts/marketplace-tab";
import SettingsTab from "@/components/tab-layouts/settings-tab";

interface MainTabLayoutProps {
  children?: React.ReactNode;
}

export default function MainTabLayout({ children }: MainTabLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isSubscribed } = useSubscriptionLimits();

  // Determine which tab content to show based on current route
  const getCurrentTabContent = () => {
    // Handle specific routes that should show tab content
    if (location === '/' || location.startsWith('/dashboard')) {
      return <DashboardTab />;
    }
    
    if (location.startsWith('/operations')) {
      return <OperationsTab />;
    }
    
    // These routes are handled by dedicated pages in App.tsx, so show children
    if (children) {
      return children;
    }
    
    if (location.startsWith('/compliance') || location.startsWith('/hos-management')) {
      return <ComplianceTab />;
    }
    
    if (location.startsWith('/finance') || location.startsWith('/fuel-management')) {
      return <FinanceTab />;
    }
    
    if (location.startsWith('/marketplace') || location.startsWith('/load-matcher')) {
      return <MarketplaceTab />;
    }
    
    if (location.startsWith('/settings') || location.startsWith('/profile') || location.startsWith('/pricing')) {
      return <SettingsTab />;
    }

    // For other routes, show children or redirect to dashboard
    if (children) {
      return children;
    }

    // Default to dashboard
    return <DashboardTab />;
  };

  // Check if user should see subscription prompt
  const shouldShowSubscriptionPrompt = !isSubscribed && 
    (location.startsWith('/operations') || 
     location.startsWith('/finance') || 
     location.startsWith('/marketplace') ||
     location.startsWith('/fleet-analytics'));

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Main Content */}
      <div className="pb-20 md:pb-0">
        {shouldShowSubscriptionPrompt && (
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-slate-700">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Upgrade to Pro</h3>
                  <p className="text-blue-200 text-sm">
                    Access advanced operations, finance, and marketplace features
                  </p>
                </div>
                <Link href="/pricing">
                  <button className="bg-white text-blue-900 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                    Upgrade Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-screen">
          {getCurrentTabContent()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
