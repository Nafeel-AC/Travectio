import { ReactNode, useState } from "react";
import ModernSidebar from "./modern-sidebar";
import MobileSidebar from "./mobile-sidebar";
import MobileHamburgerMenu from "./mobile-hamburger-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { OfflineStatusIndicator } from "./offline-status-indicator";
import { useOrgRole } from "@/lib/org-role-context";

interface ModernLayoutProps {
  children: ReactNode;
}

export default function ModernLayout({ children }: ModernLayoutProps) {
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { activeOrgId } = useOrgRole();
  
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };
  
  if (isMobile) {
    return (
      <div className="flex h-screen bg-slate-900 overflow-hidden">
        {/* Mobile Sidebar */}
        <MobileSidebar 
          isOpen={isMobileSidebarOpen} 
          onClose={closeMobileSidebar} 
        />
        
        {/* Mobile Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <MobileHamburgerMenu 
                isOpen={isMobileSidebarOpen}
                onToggle={toggleMobileSidebar}
              />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.666.804 4.328A1 1 0 0113 20H7a1 1 0 01-.985-1.006l.804-4.328L6.22 15H4a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-lg font-semibold text-white">Travectio</h1>
              </div>
            </div>
            <OfflineStatusIndicator />
          </header>
          
          {/* Mobile Content */}
          <main className="flex-1 overflow-auto bg-slate-900">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
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