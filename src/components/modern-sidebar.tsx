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
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { supabase } from "@/lib/supabase";

interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon: any;
  badge?: string;
  founderOnly?: boolean;
  adminOnly?: boolean;
  customerOnly?: boolean;
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
    href: "/truck-profiles",
    label: "Truck Profiles",
    description: "View and manage truck details",
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
    href: "/add-truck",
    label: "Add Truck",
    description: "Register new vehicle",
    icon: Plus,
    badge: "Active",
    customerOnly: true,
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "Subscription plans and billing",
    icon: CreditCard,
    customerOnly: true,
  },
  {
    href: "/profile",
    label: "Profile",
    description: "Account settings",
    icon: User,
  },
];

export default function ModernSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isFounder, isAdmin } = useFounderAccess();
  

  // Debug logs to troubleshoot the demo switcher visibility

  const filteredItems = navigationItems.filter((item) => {
    // Founder sees everything in a logical order: admin items first, then customer items
    if (isFounder) {
      return true; // Show all items for founders
    }

    // Admin (non-founder) sees only admin items and general items
    if (isAdmin) {
      return item.adminOnly || (!item.founderOnly && !item.customerOnly);
    }

    // Regular customers see customer items and general items
    return item.customerOnly || (!item.founderOnly && !item.adminOnly);
  });

  return (
    <div className="flex flex-col h-screen w-80 bg-slate-800 border-r border-slate-700 overflow-hidden relative">
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

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer group
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }
              `}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div
                    className={`text-xs ${
                      isActive
                        ? "text-blue-100"
                        : "text-slate-500 group-hover:text-slate-400"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
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
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
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

          {/* Founder-only helper blocks removed */}

          {/* Logout Button - Always Visible and Prominent */}
          <Button
            onClick={async () => {
              console.log("Logout button clicked - User:", user);
              try {
                // Use the proper Supabase logout method
                await supabase.auth.signOut();
                // Redirect to landing page after successful logout
                window.location.href = "/";
              } catch (error) {
                console.error("Logout error:", error);
                // Fallback to redirect even if there's an error
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
  );
}
