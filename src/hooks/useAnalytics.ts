import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './useSupabase';

export interface FeatureUsageParams {
  featureName: string;
  featureCategory: 'core' | 'analytics' | 'planning' | 'compliance';
  actionType: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'calculate';
  timeSpent?: number;
  successful?: boolean;
  errorMessage?: string;
  valueGenerated?: number;
  efficiencyGain?: number;
}

export interface UserSessionParams {
  sessionId: string;
  sessionStartTime: Date;
  sessionEndTime?: Date;
  sessionDuration?: number;
  pagesVisited?: string[];
  featuresUsed?: string[];
  totalPageViews?: number;
  trucksManaged?: number;
  loadsCreated?: number;
  driversManaged?: number;
  fuelPurchasesRecorded?: number;
  userAgent?: string;
  deviceType?: string;
  browserName?: string;
  operatingSystem?: string;
}

export function useAnalytics() {
  const { user, isAuthenticated } = useAuth();

  // Track feature usage
  const trackFeatureUsage = useMutation({
    mutationFn: async (params: FeatureUsageParams) => {
      if (!isAuthenticated) return;
      
      const response = await fetch('/api/analytics/feature-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to track feature usage: ${response.statusText}`);
      }
      
      return response.json();
    },
    onError: (error) => {
      console.warn('Failed to track feature usage:', error);
    },
  });

  // Track user session
  const trackUserSession = useMutation({
    mutationFn: async (params: UserSessionParams) => {
      if (!isAuthenticated) return;
      
      const response = await fetch('/api/analytics/user-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to track user session: ${response.statusText}`);
      }
      
      return response.json();
    },
    onError: (error) => {
      console.warn('Failed to track user session:', error);
    },
  });

  // Helper functions for automatic tracking
  const trackPageView = (pageName: string) => {
    if (!isAuthenticated) return;
    
    trackFeatureUsage.mutate({
      featureName: `page_${pageName}`,
      featureCategory: 'core',
      actionType: 'view',
      successful: true,
    });
  };

  const trackAction = (
    featureName: string, 
    actionType: FeatureUsageParams['actionType'],
    options?: Partial<FeatureUsageParams>
  ) => {
    if (!isAuthenticated) return;
    
    trackFeatureUsage.mutate({
      featureName,
      featureCategory: options?.featureCategory || 'core',
      actionType,
      successful: true,
      ...options,
    });
  };

  const trackError = (
    featureName: string,
    errorMessage: string,
    actionType: FeatureUsageParams['actionType'] = 'view'
  ) => {
    if (!isAuthenticated) return;
    
    trackFeatureUsage.mutate({
      featureName,
      featureCategory: 'core',
      actionType,
      successful: false,
      errorMessage,
    });
  };

  const trackBusinessValue = (
    featureName: string,
    actionType: FeatureUsageParams['actionType'],
    valueGenerated?: number,
    efficiencyGain?: number
  ) => {
    if (!isAuthenticated) return;
    
    trackFeatureUsage.mutate({
      featureName,
      featureCategory: 'core',
      actionType,
      successful: true,
      valueGenerated,
      efficiencyGain,
    });
  };

  return {
    // Direct mutations
    trackFeatureUsage: trackFeatureUsage.mutate,
    trackUserSession: trackUserSession.mutate,
    
    // Helper functions
    trackPageView,
    trackAction,
    trackError,
    trackBusinessValue,
    
    // Status
    isTracking: trackFeatureUsage.isPending || trackUserSession.isPending,
    user,
    isAuthenticated,
  };
}

// Session manager for automatic session tracking
class SessionManager {
  private sessionId: string;
  private sessionStartTime: Date;
  private pagesVisited: Set<string> = new Set();
  private featuresUsed: Set<string> = new Set();
  private pageViewCount = 0;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = new Date();
    this.startTracking();
  }

  private startTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.endSession();
      }
    });

    // Track when user leaves
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Auto-end session after 30 minutes of inactivity
    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.endSession();
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Reset timer on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();
  }

  addPageVisit(pageName: string) {
    this.pagesVisited.add(pageName);
    this.pageViewCount++;
  }

  addFeatureUsage(featureName: string) {
    this.featuresUsed.add(featureName);
  }

  private endSession() {
    const sessionEndTime = new Date();
    const sessionDuration = Math.floor((sessionEndTime.getTime() - this.sessionStartTime.getTime()) / 1000);

    // Get browser info
    const userAgent = navigator.userAgent;
    const deviceType = /Mobile|Android|iP(hone|od|ad)/.test(userAgent) ? 'mobile' : 
                      /Tablet|iPad/.test(userAgent) ? 'tablet' : 'desktop';
    
    const browserName = (() => {
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      return 'Unknown';
    })();

    const operatingSystem = (() => {
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
      return 'Unknown';
    })();

    // Send session data (this will be handled by the useAnalytics hook)
    const sessionData: UserSessionParams = {
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime,
      sessionEndTime,
      sessionDuration,
      pagesVisited: Array.from(this.pagesVisited),
      featuresUsed: Array.from(this.featuresUsed),
      totalPageViews: this.pageViewCount,
      userAgent,
      deviceType,
      browserName,
      operatingSystem,
    };

    // Store session data for the next component that uses useAnalytics
    localStorage.setItem('pendingSessionData', JSON.stringify(sessionData));
  }

  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime,
      pagesVisited: Array.from(this.pagesVisited),
      featuresUsed: Array.from(this.featuresUsed),
      pageViewCount: this.pageViewCount,
    };
  }
}

// Global session manager
export const sessionManager = new SessionManager();

// Hook to automatically handle pending session data
export function useSessionTracking() {
  const { trackUserSession } = useAnalytics();

  // Check for pending session data on mount
  React.useEffect(() => {
    const pendingData = localStorage.getItem('pendingSessionData');
    if (pendingData) {
      try {
        const sessionData = JSON.parse(pendingData);
        trackUserSession(sessionData);
        localStorage.removeItem('pendingSessionData');
      } catch (error) {
        console.warn('Failed to process pending session data:', error);
      }
    }
  }, [trackUserSession]);
}