import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type TimePeriod = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'bi-annually' | 'yearly';

interface TimeFilterContextType {
  currentPeriod: TimePeriod;
  startDate: Date;
  endDate: Date;
  setTimePeriod: (period: TimePeriod, start: Date, end: Date) => void;
  getFilteredQueryKey: (baseKey: string) => string[];
  isFilterActive: boolean;
}

const TimeFilterContext = createContext<TimeFilterContextType | undefined>(undefined);

interface TimeFilterProviderProps {
  children: ReactNode;
}

export function TimeFilterProvider({ children }: TimeFilterProviderProps) {
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>('weekly');
  // Initialize with stable dates using useMemo to prevent recreation
  const initialDates = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return { now, weekAgo };
  }, []);
  
  const [startDate, setStartDate] = useState<Date>(initialDates.weekAgo);
  const [endDate, setEndDate] = useState<Date>(initialDates.now);
  const [isFilterActive, setIsFilterActive] = useState(false); // Keep disabled by default
  const queryClient = useQueryClient();

  // Initialize with current week - remove useEffect to avoid double initialization
  // useEffect(() => {
  //   const end = new Date();
  //   const start = new Date();
  //   start.setDate(end.getDate() - 7);
  //   setStartDate(start);
  //   setEndDate(end);
  // }, []);

  const setTimePeriod = (period: TimePeriod, start: Date, end: Date) => {
    setCurrentPeriod(period);
    setStartDate(start);
    setEndDate(end);
    setIsFilterActive(true);

    // Invalidate all queries when time period changes to trigger refetch with new filters
    // Use setTimeout to batch invalidations and prevent multiple rapid calls
    setTimeout(() => {
      queryClient.invalidateQueries();
    }, 0);
  };

  // Memoize the query key function to prevent recreation
  const getFilteredQueryKey = useMemo(() => (baseKey: string): string[] => {
    if (!isFilterActive) return [baseKey];
    
    return [
      baseKey,
      'filtered',
      currentPeriod,
      startDate.getTime().toString(), // Use timestamp for stability
      endDate.getTime().toString()
    ];
  }, [isFilterActive, currentPeriod, startDate?.getTime(), endDate?.getTime()]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TimeFilterContextType = useMemo(() => ({
    currentPeriod,
    startDate,
    endDate,
    setTimePeriod,
    getFilteredQueryKey,
    isFilterActive
  }), [currentPeriod, startDate, endDate, getFilteredQueryKey, isFilterActive]);

  return (
    <TimeFilterContext.Provider value={contextValue}>
      {children}
    </TimeFilterContext.Provider>
  );
}

export function useTimeFilter() {
  const context = useContext(TimeFilterContext);
  if (context === undefined) {
    throw new Error('useTimeFilter must be used within a TimeFilterProvider');
  }
  return context;
}

// Helper function to check if a date falls within the current filter range
export function isDateInRange(date: Date | string, startDate: Date, endDate: Date): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return checkDate >= startDate && checkDate <= endDate;
}

// Helper function to format time period for display
export function formatTimePeriod(period: TimePeriod): string {
  const periodMap: Record<TimePeriod, string> = {
    'weekly': 'Weekly',
    'bi-weekly': 'Bi-Weekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'bi-annually': 'Bi-Annually',
    'yearly': 'Yearly'
  };
  return periodMap[period];
}