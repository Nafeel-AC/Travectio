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
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { useDemo } from "@/lib/demo-context";
import { Switch } from "@/components/ui/switch";
import CustomerAccess from "./customer-access";

interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon: any;
  badge?: string;
  founderOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Fleet overview and analytics",
    icon: Home
  },
  {
    href: "/hos-management", 
    label: "HOS Management",
    description: "Driver hours and compliance",
    icon: Clock
  },
  {
    href: "/load-management",
    label: "Load Management", 
    description: "Load tracking and entry",
    icon: Route
  },
  {
    href: "/load-matcher",
    label: "Load Matcher",
    description: "AI-powered load recommendations",
    icon: Target
  },
  {
    href: "/fuel-management",
    label: "Fuel Management",
    description: "Fuel purchases and tracking",
    icon: Fuel
  },
  {
    href: "/fleet-analytics",
    label: "Fleet Analytics",
    description: "Performance metrics and insights",
    icon: BarChart3
  },
  {
    href: "/integration-management",
    label: "Integrations",
    description: "DAT & ELD integrations", 
    icon: Settings
  },
  {
    href: "/add-truck",
    label: "Add Truck",
    description: "Register new vehicle",
    icon: Plus,
    badge: "Active"
  },
  {
    href: "/user-management",
    label: "User Management",
    description: "Admin: View system users",
    icon: Users,
    founderOnly: true
  },
  {
    href: "/session-management", 
    label: "Session Management",
    description: "Admin: Active sessions",
    icon: Monitor,
    founderOnly: true
  },
  {
    href: "/profile",
    label: "Profile",
    description: "Account settings",
    icon: User
  }
];

export default function ModernSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isFounder } = useFounderAccess();
  const { isDemoMode, setDemoMode, getDisplayMode } = useDemo();
  
  // Debug logs to troubleshoot the demo switcher visibility

  const filteredItems = navigationItems.filter(item => 
    !item.founderOnly || (item.founderOnly && isFounder)
  );

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
          const isActive = location === item.href || 
            (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer group
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }
              `}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
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
                {(user as any)?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {(user as any)?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-slate-400">
                {getDisplayMode(isFounder)}
              </div>
            </div>
          </div>

          {/* Demo Mode Switcher - Only for Founder */}
          {isFounder && (
            <div className="space-y-2 p-3 bg-blue-800/30 rounded-lg border border-blue-700">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">Demo Mode</div>
                  <div className="text-xs text-slate-400 truncate">
                    {isDemoMode ? 'Sample fleet data' : 'Founder analytics'}
                  </div>
                </div>
                <Switch
                  checked={isDemoMode}
                  onCheckedChange={setDemoMode}
                  className="data-[state=checked]:bg-blue-600 flex-shrink-0"
                />
              </div>
              {isDemoMode && (
                <div className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded border border-blue-800">
                  💡 Big Purple/Marty + Big Brown/Edward
                </div>
              )}
            </div>
          )}

          {/* Customer Access Helper - Only for Founder in Development */}
          {isFounder && !new URLSearchParams(window.location.search).get('dev_user') && (
            <CustomerAccess />
          )}

          {/* Logout Button - Always Visible and Prominent */}
          <Button
            onClick={() => {
              console.log('Logout button clicked - User:', user);
              window.location.href = '/api/logout';
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