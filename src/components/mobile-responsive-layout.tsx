import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Menu, 
  X, 
  Home, 
  Truck, 
  Clock, 
  Package, 
  Fuel,
  Plus,
  Users,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  BookOpen
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useSupabase";
import { useSyncStatus } from "@/lib/offline-sync";
import { useDemo } from "@/lib/demo-context";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function MobileResponsiveLayout({ children }: MobileResponsiveLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { isFounder } = useFounderAccess();
  const { isDemoMode, setDemoMode, getDisplayMode } = useDemo();
  
  // Debug logs
  console.log('[MobileResponsiveLayout] isFounder:', isFounder);
  console.log('[MobileResponsiveLayout] isDemoMode:', isDemoMode);
  
  // Type assertion for user properties
  interface AuthUser {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
  }
  
  const typedUser = user as AuthUser;
  const syncStatus = useSyncStatus();

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Chronological workflow navigation
  const navigationItems = [
    // SETUP PHASE - Get your fleet ready
    { 
      label: "Dashboard", 
      href: "/", 
      icon: Home,
      description: "Fleet overview and key metrics",
      phase: "overview"
    },
    { 
      label: "1. Add Trucks", 
      href: "/add-truck", 
      icon: Truck,
      description: "Start here: Set up your fleet",
      phase: "setup"
    },
    
    // OPERATIONS PHASE - Daily fleet management
    { 
      label: "2. Plan Loads", 
      href: "/load-management", 
      icon: Package,
      description: "Find and assign profitable loads",
      phase: "operations"
    },
    { 
      label: "3. Track HOS", 
      href: "/hos-management", 
      icon: Clock,
      description: "Monitor driver hours and compliance",
      phase: "operations"
    },
    { 
      label: "4. Log Fuel", 
      href: "/fuel-management", 
      icon: Fuel,
      description: "Track fuel purchases and efficiency",
      phase: "operations"
    },
    
    // ANALYSIS PHASE - Review performance
    { 
      label: "5. Review Performance", 
      href: "/fleet-analytics", 
      icon: RefreshCw,
      description: "Analyze profitability and trends",
      phase: "analysis"
    },
    
    // TOOLS & SETTINGS
    { 
      label: "Settings", 
      href: "/profile", 
      icon: User,
      description: "Account and preferences",
      phase: "tools"
    },
    { 
      label: "Help Guide", 
      href: "/user-guide", 
      icon: BookOpen,
      description: "Step-by-step tutorials",
      phase: "tools"
    },
  ];

  // Add admin items if user is admin
  if (typedUser?.isAdmin) {
    navigationItems.push({
      label: "User Management",
      href: "/user-management", 
      icon: Users,
      description: "Manage system users",
      phase: "admin"
    });
  }

  // Add owner dashboard for founder-level users
  if ((typedUser as any)?.isFounder) {
    navigationItems.push({
      label: "Owner Dashboard",
      href: "/owner-dashboard", 
      icon: Users,
      description: "Complete system oversight",
      phase: "admin"
    });
  }

  const renderSyncStatus = () => (
    <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
      {syncStatus.isOnline ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {syncStatus.isOnline ? 'Online' : 'Offline'}
        </div>
        {syncStatus.pendingCount > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {syncStatus.pendingCount} pending sync{syncStatus.pendingCount > 1 ? 's' : ''}
          </div>
        )}
        {syncStatus.lastSyncTime > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Last sync: {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
          </div>
        )}
      </div>
      {syncStatus.hasConflicts && (
        <AlertTriangle className="w-4 h-4 text-orange-500" />
      )}
    </div>
  );

  const renderNavigation = () => {
    // Group navigation items by phase
    const groupedItems = navigationItems.reduce((acc, item) => {
      if (!acc[item.phase]) {
        acc[item.phase] = [];
      }
      acc[item.phase].push(item);
      return acc;
    }, {} as Record<string, typeof navigationItems>);

    const phaseOrder = ['overview', 'setup', 'operations', 'analysis', 'tools', 'admin'];
    const phaseLabels: Record<string, string> = {
      overview: 'Overview',
      setup: 'Setup Phase',
      operations: 'Daily Operations',
      analysis: 'Performance Review',
      tools: 'Tools & Settings',
      admin: 'Administration'
    };

    return (
      <nav className="space-y-4">
        {phaseOrder.map((phase) => {
          const items = groupedItems[phase];
          if (!items || items.length === 0) return null;

          return (
            <div key={phase} className="space-y-2">
              {phase !== 'overview' && (
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3">
                  {phaseLabels[phase]}
                </div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                    )}>
                      <Icon className="w-5 h-5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{item.label}</div>
                        {!isMobile && (
                          <div className="text-xs opacity-70">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    );
  };

  const renderUserProfile = () => (
    <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
        <User className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {typedUser?.firstName || typedUser?.email?.split('@')[0] || 'User'}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {typedUser?.email}
        </div>
        {typedUser?.isAdmin && (
          <Badge variant="secondary" className="text-xs mt-1">Admin</Badge>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-primary" />
                      <span>Travectio</span>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-6">
                    {typedUser && renderUserProfile()}
                    
                    <Separator />
                    
                    {/* Demo Mode Switcher - Only for Founder (Mobile) */}
                    {isFounder && (
                      <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">Demo Mode</div>
                            <div className="text-xs text-slate-400">
                              {getDisplayMode(isFounder)}
                            </div>
                          </div>
                          <Switch
                            checked={isDemoMode}
                            onCheckedChange={setDemoMode}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                        {isDemoMode && (
                          <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded border border-blue-800">
                            💡 Demo fleet: Big Purple/Marty + Big Brown/Edward
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Separator />
                    
                    {renderSyncStatus()}
                    
                    <Separator />
                    
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {renderNavigation()}
                    </ScrollArea>
                    
                    <Separator />
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => window.location.href = "/api/logout"}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              <div>
                <h1 className="text-lg font-semibold">Travectio</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Sync Status Indicator */}
              <div className="flex items-center space-x-1">
                {syncStatus.isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                {syncStatus.pendingCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {syncStatus.pendingCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="p-4 pb-20">
          {children}
        </main>

        {/* Mobile Bottom Navigation (for quick access) */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
          <div className="flex items-center justify-around p-2">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="flex flex-col h-auto p-2 min-w-0"
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-xs truncate max-w-16">
                      {item.label.split(' ')[0]}
                    </span>
                  </Button>
                </Link>
              );
            })}
            
            {/* More button for additional items */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="flex flex-col h-auto p-2">
                  <Plus className="w-4 h-4 mb-1" />
                  <span className="text-xs">More</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[300px]">
                <div className="grid grid-cols-3 gap-4 p-4">
                  {navigationItems.slice(4).map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className="flex flex-col h-auto p-4 text-center"
                        >
                          <Icon className="w-6 h-6 mb-2" />
                          <span className="text-sm">{item.label}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout (existing sidebar layout)
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - improved width and styling */}
      <aside className="w-80 bg-card border-r border-border flex flex-col shadow-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Travectio</h1>
              <p className="text-sm text-muted-foreground">Fleet Management</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 space-y-8">
          {typedUser && renderUserProfile()}
          
          <Separator />
          
          {/* Demo Mode Switcher - Only for Founder (Desktop) */}
          {isFounder && (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Demo Mode</div>
                  <div className="text-xs text-slate-400">
                    {isDemoMode ? 'Viewing sample fleet data' : 'Viewing founder analytics'}
                  </div>
                </div>
                <Switch
                  checked={isDemoMode}
                  onCheckedChange={setDemoMode}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              {isDemoMode && (
                <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded border border-blue-800">
                  💡 Demo fleet: Big Purple/Marty + Big Brown/Edward
                </div>
              )}
            </div>
          )}
          
          <Separator />
          
          {renderSyncStatus()}
          
          <Separator />
          
          <ScrollArea className="flex-1 pr-2">
            {renderNavigation()}
          </ScrollArea>
        </div>
        
        <div className="p-6 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.location.href = "/api/logout"}
          >
            <X className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Desktop Content - improved padding and layout */}
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}