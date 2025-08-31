import { createContext, useContext, useState, ReactNode } from "react";

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  getDemoUserId: () => string;
  getDisplayMode: (isFounder?: boolean) => string;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
    console.log(`[DemoMode] ${enabled ? 'Enabled' : 'Disabled'} demo mode`);
    
    // No page reload - let React Query handle cache invalidation properly
  };

  const getDemoUserId = () => {
    return 'demo-user-001';
  };

  const getDisplayMode = (isFounder: boolean = false) => {
    if (isDemoMode) {
      return 'Demo Fleet';
    }
    return isFounder ? 'Founder Analytics' : 'Fleet Operations';
  };

  const contextValue: DemoContextType = {
    isDemoMode,
    setDemoMode,
    getDemoUserId,
    getDisplayMode
  };

  return (
    <DemoContext.Provider value={contextValue}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}