import { cn } from "@/lib/utils";
import {
  Home,
  Clock,
  Package,
  Plus,
  User,
  Users,
  X,
  Fuel,
  Truck,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useSupabase";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNavigation = (isAdmin: boolean) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/", icon: Home, current: true },
    {
      name: "HOS Management",
      href: "/hos-management",
      icon: Clock,
      current: false,
    },
    {
      name: "Load Management",
      href: "/load-management",
      icon: Package,
      current: false,
    },
    {
      name: "Truck Profiles",
      href: "/truck-profiles",
      icon: Truck,
      current: false,
    },
    {
      name: "Fuel Management",
      href: "/fuel-management",
      icon: Fuel,
      current: false,
    },
    { name: "Add Truck", href: "/add-truck", icon: Plus, current: false },
    { name: "Pricing", href: "/pricing", icon: CreditCard, current: false },
  ];

  if (isAdmin) {
    baseNavigation.push({
      name: "User Management",
      href: "/user-management",
      icon: Users,
      current: false,
    });
  }

  baseNavigation.push({
    name: "Profile",
    href: "/profile",
    icon: User,
    current: false,
  });

  return baseNavigation;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  const navigation = getNavigation((user as any)?.isAdmin || false);
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-[var(--dark-surface)] border-r border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 lg:hidden">
          <span className="text-lg font-semibold text-white">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-[var(--dark-elevated)]"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="space-y-2 p-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = item.href;
                }}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                  item.current
                    ? "bg-[var(--dark-elevated)] text-[var(--blue-light)]"
                    : "text-gray-400 hover:text-white hover:bg-[var(--dark-card)]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
