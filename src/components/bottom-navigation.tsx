import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Package, 
  Shield, 
  DollarSign, 
  Globe, 
  Settings,
  Plus,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

interface BottomNavProps {
  className?: string;
}

const bottomNavItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    description: 'Fleet overview and KPIs'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Package,
    href: '/operations',
    description: 'Loads, drivers, and fleet'
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: Shield,
    href: '/compliance',
    description: 'HOS and regulations'
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    href: '/finance',
    description: 'Fuel, expenses, and reports'
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: Globe,
    href: '/marketplace',
    description: 'Load matching and boards'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'Account and preferences'
  }
];

export default function BottomNavigation({ className = "" }: BottomNavProps) {
  const [location] = useLocation();
  const { isFounder, isAdmin } = useFounderAccess();
  const { isSubscribed } = useSubscriptionLimits();
  
  // Determine which tab is active based on current route
  const getActiveTab = () => {
    if (location === '/' || location.startsWith('/dashboard')) return 'dashboard';
    if (location.startsWith('/operations') || location.startsWith('/load-management') || location.startsWith('/drivers') || location.startsWith('/truck-profiles') || location.startsWith('/add-truck')) return 'operations';
    if (location.startsWith('/compliance') || location.startsWith('/hos-management')) return 'compliance';
    if (location.startsWith('/finance') || location.startsWith('/fuel-management')) return 'finance';
    if (location.startsWith('/marketplace') || location.startsWith('/load-matcher')) return 'marketplace';
    if (location.startsWith('/settings') || location.startsWith('/profile') || location.startsWith('/pricing')) return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  // Filter items based on user permissions
  const filteredItems = bottomNavItems.filter(item => {
    // Show all items to founders and admins
    if (isFounder || isAdmin) return true;
    
    // For customers, hide marketplace if not subscribed
    if (item.id === 'marketplace' && !isSubscribed) return false;
    
    return true;
  });

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50 md:hidden ${className}`}>
      <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isDisabled = !isSubscribed && !isFounder && !isAdmin && (item.id === 'operations' || item.id === 'finance');
          
          return (
            <Link key={item.id} href={isDisabled ? "#" : item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center h-auto p-2 min-w-0 max-w-[80px] ${
                  isActive 
                    ? "text-blue-400 bg-blue-900/20" 
                    : isDisabled 
                    ? "text-slate-500 opacity-50" 
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
                disabled={isDisabled}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-1" />
                  {item.id === 'marketplace' && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 w-3 h-3 p-0 text-xs bg-orange-500 text-white"
                    >
                      •
                    </Badge>
                  )}
                </div>
                <span className="text-xs truncate max-w-[60px] leading-tight">
                  {item.label}
                </span>
                {isDisabled && (
                  <span className="text-xs text-slate-500">Pro</span>
                )}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Hook to get current active tab
export const useActiveBottomTab = () => {
  const [location] = useLocation();
  
  if (location === '/' || location.startsWith('/dashboard')) return 'dashboard';
  if (location.startsWith('/operations') || location.startsWith('/load-management') || location.startsWith('/drivers') || location.startsWith('/truck-profiles') || location.startsWith('/add-truck')) return 'operations';
  if (location.startsWith('/compliance') || location.startsWith('/hos-management')) return 'compliance';
  if (location.startsWith('/finance') || location.startsWith('/fuel-management')) return 'finance';
  if (location.startsWith('/marketplace') || location.startsWith('/load-matcher')) return 'marketplace';
  if (location.startsWith('/settings') || location.startsWith('/profile') || location.startsWith('/pricing')) return 'settings';
  
  return 'dashboard';
};