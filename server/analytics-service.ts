import { storage } from "./storage";
import type { 
  InsertDataInputTracking, 
  InsertUserAnalytics, 
  InsertFeatureAnalytics,
  InsertSystemMetrics
} from "@shared/schema";

export class AnalyticsService {
  // Track all data inputs across the system
  static async trackDataInput(params: {
    userId: string;
    inputType: 'truck' | 'load' | 'driver' | 'fuel_purchase' | 'cost_breakdown' | 'load_plan' | 'hos_log';
    inputSubType: 'create' | 'update' | 'delete' | 'view';
    recordId: string;
    dataCategory: 'operational' | 'financial' | 'compliance' | 'planning';
    fieldName?: string;
    previousValue?: string;
    newValue?: string;
    impactLevel?: 'low' | 'medium' | 'high' | 'critical';
    businessFunction: 'fleet_management' | 'cost_control' | 'compliance' | 'planning';
    ipAddress?: string;
    source?: string;
  }) {
    const trackingData: InsertDataInputTracking = {
      userId: params.userId,
      inputType: params.inputType,
      inputSubType: params.inputSubType,
      recordId: params.recordId,
      dataCategory: params.dataCategory,
      fieldName: params.fieldName,
      previousValue: params.previousValue,
      newValue: params.newValue,
      impactLevel: params.impactLevel || 'low',
      businessFunction: params.businessFunction,
      ipAddress: params.ipAddress,
      source: params.source || 'web_app',
    };

    try {
      await storage.trackDataInput(trackingData);
      // console.log(`[Analytics] Tracked data input: ${params.inputType} ${params.inputSubType} by user ${params.userId}`);
    } catch (error) {
      console.error(`[Analytics] Failed to track data input:`, error);
    }
  }

  // Track feature usage
  static async trackFeatureUsage(params: {
    userId: string;
    featureName: string;
    featureCategory: 'core' | 'analytics' | 'planning' | 'compliance';
    actionType: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'calculate';
    timeSpent?: number;
    successful?: boolean;
    errorMessage?: string;
    valueGenerated?: number;
    efficiencyGain?: number;
  }) {
    const featureData: InsertFeatureAnalytics = {
      userId: params.userId,
      featureName: params.featureName,
      featureCategory: params.featureCategory,
      actionType: params.actionType,
      timeSpent: params.timeSpent,
      successful: params.successful ? 1 : 0,
      errorMessage: params.errorMessage,
      valueGenerated: params.valueGenerated || 0,
      efficiencyGain: params.efficiencyGain || 0,
    };

    try {
      await storage.trackFeatureUsage(featureData);
      // console.log(`[Analytics] Tracked feature usage: ${params.featureName} by user ${params.userId}`);
    } catch (error) {
      console.error(`[Analytics] Failed to track feature usage:`, error);
    }
  }

  // Track user session analytics
  static async trackUserSession(params: {
    userId: string;
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
  }) {
    const sessionData: InsertUserAnalytics = {
      userId: params.userId,
      sessionId: params.sessionId,
      sessionStartTime: params.sessionStartTime,
      sessionEndTime: params.sessionEndTime,
      sessionDuration: params.sessionDuration,
      pagesVisited: params.pagesVisited || [],
      featuresUsed: params.featuresUsed || [],
      totalPageViews: params.totalPageViews || 0,
      trucksManaged: params.trucksManaged || 0,
      loadsCreated: params.loadsCreated || 0,
      driversManaged: params.driversManaged || 0,
      fuelPurchasesRecorded: params.fuelPurchasesRecorded || 0,
      userAgent: params.userAgent,
      deviceType: params.deviceType,
      browserName: params.browserName,
      operatingSystem: params.operatingSystem,
    };

    try {
      await storage.trackUserSession(sessionData);
      // console.log(`[Analytics] Tracked user session: ${params.sessionId} for user ${params.userId}`);
    } catch (error) {
      console.error(`[Analytics] Failed to track user session:`, error);
    }
  }

  // Generate daily system metrics
  static async generateSystemMetrics(metricDate: Date = new Date()) {
    try {
      // Get all users
      const allUsers = await storage.getAllUsers();
      const allTrucks = await storage.getTrucks();
      const allLoads = await storage.getLoads();
      const allDrivers = await storage.getDrivers();
      const allFuelPurchases = await storage.getFuelPurchases();

      // Calculate system-wide metrics
      const totalRevenueTracked = allLoads.reduce((sum, load) => sum + (load.pay || 0), 0);
      const totalMilesTracked = allLoads.reduce((sum, load) => sum + (load.miles || 0), 0);
      const totalFleetValue = allTrucks.reduce((sum, truck) => sum + (truck.fixedCosts * 52), 0); // Estimate annual fixed costs as fleet value

      // Calculate average cost per mile across all trucks
      const activeTrucks = allTrucks.filter(truck => truck.isActive);
      const averageCostPerMile = activeTrucks.length > 0 
        ? activeTrucks.reduce((sum, truck) => {
            // Fixed and variable costs are weekly, divide by standard weekly miles
            const standardWeeklyMiles = 3000;
            const cpm = (truck.fixedCosts + truck.variableCosts) / standardWeeklyMiles;
            return sum + cpm;
          }, 0) / activeTrucks.length
        : 0;

      const systemMetrics: InsertSystemMetrics = {
        metricDate,
        totalActiveUsers: allUsers.length,
        newUsersToday: 0, // Would need date filtering
        averageSessionDuration: 30, // Default - would calculate from session data
        totalSessions: 0, // Would calculate from session data
        totalTrucksInSystem: allTrucks.length,
        totalLoadsInSystem: allLoads.length,
        totalDriversInSystem: allDrivers.length,
        totalFuelPurchases: allFuelPurchases.length,
        totalFleetValue,
        totalRevenueTracked,
        totalMilesTracked,
        averageCostPerMile,
        apiRequestsToday: 0, // Would track from middleware
        dataInputsToday: 0, // Would calculate from data input tracking
        systemErrors: 0, // Would track from error logging
      };

      await storage.recordSystemMetrics(systemMetrics);
      // console.log(`[Analytics] Generated system metrics for ${metricDate.toDateString()}`);
      
      return systemMetrics;
    } catch (error) {
      console.error(`[Analytics] Failed to generate system metrics:`, error);
      throw error;
    }
  }

  // Get comprehensive analytics dashboard data
  static async getAnalyticsDashboard(userId?: string) {
    try {
      const dashboardData = {
        // System overview
        systemMetrics: await storage.getLatestSystemMetrics(),
        
        // User-specific analytics (if userId provided)
        userAnalytics: userId ? await storage.getUserAnalytics(userId) : null,
        userFeatureUsage: userId ? await storage.getUserFeatureUsage(userId) : null,
        userDataInputs: userId ? await storage.getUserDataInputs(userId) : null,

        // System-wide feature usage
        topFeatures: await storage.getTopFeatures(),
        
        // Data input trends
        dataInputTrends: await storage.getDataInputTrends(),
        
        // Business impact metrics
        businessImpactMetrics: await storage.getBusinessImpactMetrics(),
      };

      // console.log(`[Analytics] Generated analytics dashboard ${userId ? `for user ${userId}` : 'system-wide'}`;
      return dashboardData;
    } catch (error) {
      console.error(`[Analytics] Failed to generate analytics dashboard:`, error);
      throw error;
    }
  }

  // Real-time metrics for monitoring
  static async getRealTimeMetrics() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      return {
        activeUsersToday: await storage.getActiveUsersCount(todayStart),
        dataInputsToday: await storage.getDataInputsCount(todayStart),
        featuresUsedToday: await storage.getFeaturesUsedCount(todayStart),
        systemHealthScore: await storage.getSystemHealthScore(),
        timestamp: now,
      };
    } catch (error) {
      console.error(`[Analytics] Failed to get real-time metrics:`, error);
      throw error;
    }
  }
}

// Middleware to automatically track API requests and data inputs
export function createAnalyticsMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Track the request
    res.on('finish', async () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Extract user ID from session if available
      const userId = req.user?.claims?.sub;
      
      if (userId && req.method !== 'GET') {
        // Determine input type based on URL
        let inputType: string | null = null;
        let businessFunction: string = 'fleet_management';
        let dataCategory: string = 'operational';
        
        if (req.url.includes('/trucks')) {
          inputType = 'truck';
          businessFunction = 'fleet_management';
          dataCategory = 'operational';
        } else if (req.url.includes('/loads')) {
          inputType = 'load';
          businessFunction = 'fleet_management';
          dataCategory = 'operational';
        } else if (req.url.includes('/drivers')) {
          inputType = 'driver';
          businessFunction = 'compliance';
          dataCategory = 'compliance';
        } else if (req.url.includes('/fuel')) {
          inputType = 'fuel_purchase';
          businessFunction = 'cost_control';
          dataCategory = 'financial';
        } else if (req.url.includes('/cost-breakdown')) {
          inputType = 'cost_breakdown';
          businessFunction = 'cost_control';
          dataCategory = 'financial';
        }
        
        if (inputType) {
          const inputSubType = req.method === 'POST' ? 'create' : 
                             req.method === 'PUT' || req.method === 'PATCH' ? 'update' : 
                             req.method === 'DELETE' ? 'delete' : 'view';
          
          // Track the data input
          await AnalyticsService.trackDataInput({
            userId,
            inputType: inputType as any,
            inputSubType: inputSubType as any,
            recordId: req.params.id || 'unknown',
            dataCategory: dataCategory as any,
            businessFunction: businessFunction as any,
            ipAddress: req.ip,
            source: 'web_app',
            impactLevel: inputSubType === 'delete' ? 'high' : 'medium',
          });
        }
      }
    });
    
    next();
  };
}