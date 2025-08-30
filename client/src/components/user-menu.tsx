import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, ShieldCheck, Users2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { getCustomerModeState, setCustomerMode } from "@/utils/customer-mode";
import { useState, useEffect } from "react";

export default function UserMenu() {
  const { user } = useAuth();
  const { isFounder } = useFounderAccess();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleAccountSwitch = (mode: 'founder' | 'customer') => {
    setCustomerMode(mode);
    setIsInCustomerMode(mode === 'customer'); // Update state immediately
    
    // Also set URL parameter for immediate server-side recognition
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    
    if (mode === 'customer') {
      params.set('dev_user', 'customer');
    } else {
      params.delete('dev_user');
    }
    
    currentUrl.search = params.toString();
    window.location.href = currentUrl.toString();
  };

  // Use state to track customer mode and make it reactive
  const [isInCustomerMode, setIsInCustomerMode] = useState(false);
  
  // Update customer mode state when component mounts and when storage changes
  useEffect(() => {
    const updateCustomerMode = () => {
      const { isCustomerMode } = getCustomerModeState();
      setIsInCustomerMode(isCustomerMode);
    };
    
    updateCustomerMode();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'travectio_view_mode') {
        updateCustomerMode();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Handle both numeric (1/0) and boolean values from database - force true for founder email
  const rawIsFounder = (user as any)?.isFounder;
  const emailIsFounder = (user as any)?.email === 'rrivera@travectiosolutions.com';
  const actualIsFounder = emailIsFounder || Boolean(rawIsFounder === 1 || rawIsFounder === true);

  if (!user) return null;

  const initials = (user as any).firstName && (user as any).lastName 
    ? `${(user as any).firstName[0]}${(user as any).lastName[0]}`.toUpperCase()
    : (user as any).email?.substring(0, 2).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={(user as any).profileImageUrl || ""} alt={(user as any).email || ""} />
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {(user as any).firstName && (user as any).lastName 
                  ? `${(user as any).firstName} ${(user as any).lastName}`
                  : "User"
                }
              </p>
              {actualIsFounder && (
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500 font-medium">
                    {isInCustomerMode ? 'Customer View' : 'Founder'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {(user as any).email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        {actualIsFounder && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-medium px-2 py-1.5">
              Customer Support
            </DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => handleAccountSwitch('founder')}
              className={!isInCustomerMode ? 'bg-blue-50 dark:bg-blue-950' : ''}
            >
              <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" />
              <span>Founder View</span>
              {!isInCustomerMode && <span className="ml-auto text-xs text-blue-500">Active</span>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleAccountSwitch('customer')}
              className={isInCustomerMode ? 'bg-green-50 dark:bg-green-950' : ''}
            >
              <Users2 className="mr-2 h-4 w-4 text-green-600" />
              <span>Customer View</span>
              {isInCustomerMode && <span className="ml-auto text-xs text-green-600">Active</span>}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}