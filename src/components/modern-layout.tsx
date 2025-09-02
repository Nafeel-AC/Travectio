import { ReactNode } from "react";
import ModernSidebar from "./modern-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileDashboard from "./mobile-dashboard";

interface ModernLayoutProps {
  children: ReactNode;
}

export default function ModernLayout({ children }: ModernLayoutProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileDashboard />;
  }
  
  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <ModernSidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}