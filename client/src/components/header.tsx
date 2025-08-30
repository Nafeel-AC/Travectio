import { Truck, Bell, User, Menu, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { User as UserType } from "@shared/schema";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth() as { user: UserType | null };
  const [, setLocation] = useLocation();
  
  return (
    <header className="bg-[var(--dark-surface)] border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-white hover:bg-[var(--dark-elevated)]"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--primary-blue)] rounded-lg flex items-center justify-center">
              <Truck className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Travectio</h1>
              <p className="text-sm text-gray-400">Enterprise Fleet Management</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-[var(--dark-elevated)]"
          >
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm text-gray-300 cursor-pointer hover:text-white" onClick={() => window.location.href = '/profile'}>
                {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName}` : (user as any)?.email || 'Fleet Manager'}
              </span>
              <span className="text-xs text-gray-500">{(user as any).title || 'View Profile'}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              className="text-gray-400 hover:text-white hover:bg-[var(--dark-elevated)]"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
