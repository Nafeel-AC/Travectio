import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Home,
  Clock,
  Route,
  Fuel,
  BarChart3,
  Settings,
  User,
  Users,
  LogOut,
  Plus,
  Monitor,
  Target,
  Shield,
  Building,
  Package,
  CreditCard,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useOrgRole } from "@/lib/org-role-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon: any;
  badge?: string;
  founderOnly?: boolean;
  adminOnly?: boolean;
  customerOnly?: boolean;
  driverOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Fleet overview and analytics",
    icon: Home,
  },
  {
    href: "/customer-dashboard",
    label: "Customer View",
    description: "Switch to customer dashboard",
    icon: Building,
    founderOnly: true,
  },
  {
    href: "/owner-dashboard",
    label: "Owner Dashboard",
    description: "System-wide business intelligence",
    icon: Shield,
    founderOnly: true,
  },
  {
    href: "/founder-driver-overview",
    label: "Driver Overview",
    description: "Complete driver and truck assignment details",
    icon: Users,
    founderOnly: true,
  },
  {
    href: "/user-management",
    label: "User Management",
    description: "Manage system users and permissions",
    icon: Users,
    adminOnly: true,
  },
  {
    href: "/session-management",
    label: "Session Management",
    description: "Monitor active sessions and security",
    icon: Monitor,
    adminOnly: true,
  },
  {
    href: "/integration-management",
    label: "Integration Management",
    description: "System integrations and APIs",
    icon: Settings,
    adminOnly: true,
  },
  // Customer-only features (hidden from admins)
  {
    href: "/drivers",
    label: "Driver Management",
    description: "Manage fleet drivers and assignments",
    icon: Users,
    customerOnly: true,
  },
  {
    href: "/hos-management",
    label: "HOS Management",
    description: "Driver hours and compliance",
    icon: Clock,
    customerOnly: true,
  },
  {
    href: "/load-management",
    label: "Load Management",
    description: "Load tracking and entry",
    icon: Route,
    customerOnly: true,
  },
  {
    href: "/my-loads",
    label: "My Loads",
    description: "View and manage your assigned loads",
    icon: Package,
    customerOnly: true,
    driverOnly: true,
  },
  {
    href: "/assigned-truck",
    label: "Assigned Truck",
    description: "Details of the truck assigned to you",
    icon: Truck,
    customerOnly: true,
    driverOnly: true,
  },
  {
    href: "/fleet-management",
    label: "Fleet Management",
    description: "Manage fleet, drivers, HOS, loads, and fuel",
    icon: Truck,
    customerOnly: true,
  },
  {
    href: "/load-matcher",
    label: "Load Matcher",
    description: "AI-powered load recommendations",
    icon: Target,
    customerOnly: true,
  },
  {
    href: "/fuel-management",
    label: "Fuel Management",
    description: "Fuel purchases and tracking",
    icon: Fuel,
    customerOnly: true,
  },
  {
    href: "/fleet-analytics",
    label: "Fleet Analytics",
    description: "Performance metrics and insights",
    icon: BarChart3,
    customerOnly: true,
  },
  
  {
    href: "/pricing",
    label: "Pricing",
    description: "Subscription plans and billing",
    icon: CreditCard,
  },
  {
    href: "/profile",
    label: "Profile",
    description: "Account settings",
    icon: User,
  },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isFounder, isAdmin } = useFounderAccess();
  const { isSubscribed, truckLimit, currentTruckCount, canAddTrucks, remainingTrucks, isLoading } = useSubscriptionLimits();
  const { role } = useOrgRole();

  const filteredItems = navigationItems.filter((item) => {
    // Founder sees everything in a logical order: admin items first, then customer items
    if (isFounder) {
      return true; // Show all items for founders
    }

    // Admin (non-founder) sees only admin items and general items
    if (isAdmin) {
      return item.adminOnly || (!item.founderOnly && !item.customerOnly);
    }

    // Role-based gating for organization roles
    const isOwner = role === "owner";
    const isDispatcher = role === "dispatcher"; 
    const isDriver = role === "driver";

    // Define allowed items per role based on exact requirements
    if (isOwner) {
      // Owner: Full access (Dashboard, Fleet Mgmt, Loads, HOS, Fuel, Analytics, Account/Billing)
      if (item.driverOnly) return false; // Hide driver-only such as Assigned Truck
      return !item.founderOnly && !item.adminOnly; // Show all customer + general items
    }
    
    if (isDispatcher) {
      // Dispatcher: All fleet management, NO billing/account
      if (item.label === "Pricing") return false; // Hide billing
      if (item.ownerOnly) return false; // Hide owner-only features
      if (item.driverOnly) return false; // Hide driver-only features
      return item.customerOnly || (!item.founderOnly && !item.adminOnly && !item.ownerOnly);
    }
    
    if (isDriver) {
      // Driver: Only Dashboard, Assigned Truck, My Loads, HOS, Fuel Data, Profile
      const driverAllowedItems = [
        "Dashboard", 
        "Assigned Truck",
        "My Loads",  // Driver-specific loads view
        "HOS Management", 
        "Fuel Management", 
        "Profile"
      ];
      return driverAllowedItems.includes(item.label) && !item.founderOnly && !item.adminOnly && !item.ownerOnly;
    }

    // Default: regular customer items for users without organization roles
    return item.customerOnly || (!item.founderOnly && !item.adminOnly && !item.ownerOnly);
  });

  const handleLinkClick = () => {
    onClose(); // Close sidebar when a link is clicked
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-80 bg-slate-800 border-r border-slate-700 transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Travectio</h1>
              <p className="text-sm text-slate-400">Fleet Management</p>
            </div>
          </div>

          {/* Subscription Status */}
          {!isFounder && !isAdmin && (
            <div className="px-6 py-4 border-b border-slate-700">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                </div>
              ) : isSubscribed ? (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-green-400">Active Subscription</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {currentTruckCount} / {truckLimit} trucks used
                    {remainingTrucks > 0 && (
                      <span className="text-green-400 ml-1">({remainingTrucks} remaining)</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">No Active Subscription</span>
                  </div>
                  <div className="text-xs text-slate-300 mb-2">
                    Subscribe to access fleet management features
                  </div>
                  <Link href="/pricing" onClick={handleLinkClick}>
                    <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                      View Plans
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));

              // Check if this item should be disabled due to no subscription
              const isDisabled = !isFounder && !isAdmin && !isSubscribed && item.customerOnly;

              return (
                <Link key={item.href} href={isDisabled ? "#" : item.href} onClick={handleLinkClick}>
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
                      isDisabled
                        ? "text-slate-500 cursor-not-allowed opacity-50"
                        : isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 cursor-pointer"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                    )}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isDisabled
                          ? "text-slate-600"
                          : isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {item.label}
                        {isDisabled && (
                          <Lock className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "text-xs truncate",
                          isDisabled
                            ? "text-slate-600"
                            : isActive
                            ? "text-blue-100"
                            : "text-slate-500 group-hover:text-slate-400"
                        )}
                      >
                        {isDisabled ? "Subscription required" : item.description}
                      </div>
                    </div>
                    {item.badge && !isDisabled && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Account Section */}
          <div className="p-4 border-t border-slate-700 flex-shrink-0 bg-slate-800">
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-300">Account</div>

              <div className="flex items-center gap-3 p-2 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-white">
                    {(user as any)?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {(user as any)?.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {isFounder ? "Founder" : isAdmin ? "Administrator" : "Customer"}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                onClick={async () => {
                  console.log("Logout button clicked - User:", user);
                  try {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  } catch (error) {
                    console.error("Logout error:", error);
                    window.location.href = "/";
                  }
                }}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-800 hover:border-red-700 mt-3 min-h-[40px] bg-red-950/20"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


