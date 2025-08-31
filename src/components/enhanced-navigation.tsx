import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Truck, 
  BarChart3, 
  FileText, 
  Clock, 
  Fuel, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Calculator,
  TrendingUp,
  LogOut,
  Zap,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";

const navigationItems = [
  { 
    label: "Dashboard", 
    href: "/", 
    icon: Home, 
    description: "Fleet overview and key metrics" 
  },
  { 
    label: "Fleet Analytics", 
    href: "/fleet-analytics", 
    icon: BarChart3, 
    description: "Real-time performance insights" 
  },
  { 
    label: "Load Management", 
    href: "/load-management", 
    icon: FileText, 
    description: "Manage loads and calculate profitability" 
  },
  { 
    label: "Truck Management", 
    href: "/add-truck", 
    icon: Truck, 
    description: "Add and manage your fleet" 
  },
  { 
    label: "Fuel Management", 
    href: "/fuel-management", 
    icon: Fuel, 
    description: "Track fuel purchases and MPG" 
  },
  { 
    label: "HOS Management", 
    href: "/hos-management", 
    icon: Clock, 
    description: "Hours of Service compliance" 
  },
  { 
    label: "Load Calculator", 
    href: "/?tab=calculator", 
    icon: Calculator, 
    description: "Calculate load profitability" 
  },
];

// Admin-only navigation items
const adminNavigationItems = [
  { 
    label: "User Management", 
    href: "/user-management", 
    icon: Users, 
    description: "Manage system users and permissions" 
  },
  { 
    label: "Session Management", 
    href: "/session-management", 
    icon: Shield, 
    description: "Monitor security and active sessions" 
  },
];

export default function EnhancedNavigation() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <div className={`bg-card border-r border-border h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold gradient-text">Travectio</h1>
              <p className="text-xs text-muted-foreground">Fleet Management Solutions</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Pro Fleet
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href || (item.href.includes('?tab') && location === '/' && item.href.includes('calculator'));
            const IconComponent = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}`} />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{item.label}</p>
                      <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                  {isActive && !collapsed && (
                    <div className="w-1 h-6 bg-primary-foreground rounded-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* Admin Section */}
        {user?.isAdmin && (
          <div className="space-y-1 mt-4">
            {!collapsed && (
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </h3>
              </div>
            )}
            {adminNavigationItems.map((item) => {
              const isActive = location === item.href;
              const IconComponent = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950 dark:hover:text-orange-300'
                    }`}
                  >
                    <IconComponent className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.label}</p>
                        <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {item.description}
                        </p>
                      </div>
                    )}
                    {isActive && !collapsed && (
                      <div className="w-1 h-6 bg-white rounded-full" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/add-truck">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Truck className="h-4 w-4 mr-2" />
                  Add Truck
                </Button>
              </Link>
              <Link href="/load-management">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  New Load
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          )}
          <a href="/api/logout">
            <Button variant="ghost" size="sm" className={collapsed ? "w-full" : ""}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}