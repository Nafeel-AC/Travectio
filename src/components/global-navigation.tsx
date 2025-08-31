import { useState } from "react";
import { useLocation } from "wouter";
import { 
  BarChart3, 
  Truck, 
  Clock, 
  Package, 
  User, 
  Users,
  Home, 
  Menu, 
  X, 
  Plus,
  LogOut
} from "lucide-react";
import UserMenu from "./user-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useSupabase";

const getNavigationItems = (isAdmin: boolean) => {
  const baseItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/",
      description: "Fleet overview and analytics"
    },
    {
      id: "hos-management", 
      label: "HOS Management",
      icon: Clock,
      path: "/hos-management",
      description: "Driver hours and compliance"
    },
    {
      id: "load-management",
      label: "Load Management", 
      icon: Package,
      path: "/load-management",
      description: "Load tracking and entry"
    },
    {
      id: "add-truck",
      label: "Add Truck",
      icon: Plus,
      path: "/add-truck",
      description: "Register new vehicle"
    },
    {
      id: "integration-management",
      label: "Integrations", 
      icon: Package, // Using existing Package icon as placeholder
      path: "/integration-management",
      description: "DAT & ELD integrations"
    },
  ];

  if (isAdmin) {
    baseItems.push({
      id: "user-management",
      label: "User Management",
      icon: Users,
      path: "/user-management",
      description: "Admin: View system users"
    });
  }

  baseItems.push({
    id: "profile",
    label: "Profile",
    icon: User,
    path: "/profile", 
    description: "Account settings"
  });

  return baseItems;
};

interface GlobalNavigationProps {
  currentPath?: string;
  compact?: boolean;
}

export default function GlobalNavigation({ currentPath, compact = false }: GlobalNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setLocation] = useLocation();
  
  const { user, signOut } = useAuth();

  const navigationItems = getNavigationItems((user as any)?.user_metadata?.isAdmin || (user as any)?.user_metadata?.isFounder || false);

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsExpanded(false); // Close mobile menu after navigation
  };

  const handleLogout = async () => {
    await signOut();
    setLocation("/");
  };

  if (compact) {
    // Compact horizontal navigation for mobile
    return (
      <div className="lg:hidden">
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-blue-400" />
              <span className="text-white font-semibold">Travectio</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-300 hover:text-white"
            >
              {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          
          {isExpanded && (
            <div className="mt-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path || 
                  (item.path === "/" && currentPath === "/enhanced-dashboard");
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </button>
                );
              })}
              
              <div className="border-t border-slate-600 pt-2 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-red-300 hover:bg-red-900/20 hover:text-red-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full desktop navigation
  return (
    <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-50">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Travectio</h1>
            <p className="text-slate-400 text-sm">Fleet Management</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || 
              (item.path === "/" && currentPath === "/enhanced-dashboard");
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400"
                )} />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={cn(
                    "text-xs transition-colors",
                    isActive ? "text-blue-100" : "text-slate-500"
                  )}>
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="bg-blue-500 text-white">
                    Active
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white text-sm font-medium">Account</div>
            <UserMenu />
          </div>
          <Card className="bg-slate-700 border-slate-600 p-4">
            <div className="text-slate-300 text-sm mb-3">
              <div className="font-medium text-white">Quick Actions</div>
              <div>Access all platform features</div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Layout wrapper component
export function NavigationLayout({ children, currentPath }: { children: React.ReactNode; currentPath?: string }) {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Desktop Navigation */}
      <GlobalNavigation currentPath={currentPath} />
      
      {/* Mobile Navigation */}
      <GlobalNavigation currentPath={currentPath} compact />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}