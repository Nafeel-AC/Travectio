import { 
  type User, type UpsertUser, 
  type Truck, type InsertTruck, 
  type Load, type InsertLoad, 
  type LoadStop, type InsertLoadStop,
  type Activity, type InsertActivity,
  type Driver, type InsertDriver,
  type HosLog, type InsertHosLog,
  type LoadBoardItem, type InsertLoadBoard,
  type FleetMetrics, type InsertFleetMetrics,
  type TruckCostBreakdown, type InsertTruckCostBreakdown,
  type LoadPlan, type InsertLoadPlan,
  type LoadPlanLeg, type InsertLoadPlanLeg,
  type FuelPurchase, type InsertFuelPurchase,
  type UserAnalytics, type InsertUserAnalytics,
  type DataInputTracking, type InsertDataInputTracking,
  type SystemMetrics, type InsertSystemMetrics,
  type FeatureAnalytics, type InsertFeatureAnalytics,
  type UserSession, type InsertUserSession,
  type SessionAuditLog, type InsertSessionAuditLog,
  trucks, drivers, loads, loadStops, activities, hosLogs, loadBoard, fleetMetrics, truckCostBreakdown, loadPlans, loadPlanLegs, fuelPurchases, users, userAnalytics, dataInputTracking, systemMetrics, featureAnalytics, userSessions, sessionAuditLogs
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, sql, lt, gt, count, inArray, asc, gte, lte, or, isNull, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updateData: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Multi-user fleet operations for system-wide functionality (alias methods)
  getTrucksForUser(userId: string): Promise<Truck[]>;
  getLoadsForUser(userId: string): Promise<Load[]>;
  getDriversForUser(userId: string): Promise<Driver[]>;
  
  // Session management operations
  createUserSession(sessionData: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionId: string): Promise<UserSession | undefined>;
  getUserSessionByToken(sessionToken: string): Promise<UserSession | undefined>;
  updateUserSession(sessionId: string, updates: Partial<UserSession>): Promise<void>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  getUserActiveSessions(userId: string): Promise<UserSession[]>;
  getExpiredSessions(): Promise<UserSession[]>;
  createSessionAuditLog(logData: InsertSessionAuditLog): Promise<SessionAuditLog>;
  getSessionAuditLogs(userId: string, limit?: number): Promise<SessionAuditLog[]>;
  getSessionStatistics(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    recentLogins: number;
    averageSessionDuration: number;
  }>;
  
  // Trucks
  getTrucks(): Promise<Truck[]>;
  getTrucksByUser(userId: string): Promise<Truck[]>;
  getTruck(id: string): Promise<Truck | undefined>;
  createTruck(truck: InsertTruck): Promise<Truck>;
  updateTruck(id: string, truck: Partial<InsertTruck>): Promise<Truck | undefined>;
  deleteTruck(id: string): Promise<boolean>;
  
  // Loads
  getLoads(): Promise<Load[]>;
  getLoadsByUser(userId: string): Promise<Load[]>;
  getLoad(id: string): Promise<Load | undefined>;
  getLoadsByTruck(truckId: string): Promise<Load[]>;
  createLoad(load: InsertLoad): Promise<Load>;
  updateLoad(id: string, load: Partial<InsertLoad>): Promise<Load | undefined>;
  deleteLoad(id: string): Promise<boolean>;
  
  // Load Stops (Multi-stop support)
  getLoadStops(loadId: string): Promise<LoadStop[]>;
  createLoadStop(stop: InsertLoadStop): Promise<LoadStop>;
  updateLoadStop(id: string, stop: Partial<InsertLoadStop>): Promise<LoadStop | undefined>;
  deleteLoadStop(id: string): Promise<boolean>;
  deleteLoadStops(loadId: string): Promise<boolean>;
  
  // Drivers
  getDrivers(): Promise<Driver[]>;
  getDriversByUser(userId: string): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<boolean>;
  
  // HOS Logs
  getHosLogs(driverId?: string, truckId?: string): Promise<HosLog[]>;
  createHosLog(hosLog: InsertHosLog): Promise<HosLog>;
  updateHosLog(id: string, hosLog: Partial<InsertHosLog>): Promise<HosLog | undefined>;
  getLatestHosStatus(driverId: string): Promise<HosLog | undefined>;
  
  // Load Board
  getLoadBoardItems(): Promise<LoadBoardItem[]>;
  getAvailableLoads(equipmentType?: string, userId?: string): Promise<LoadBoardItem[]>;
  createLoadBoardItem(item: InsertLoadBoard): Promise<LoadBoardItem>;
  updateLoadBoardStatus(id: string, status: string): Promise<LoadBoardItem | undefined>;
  
  // Fleet Metrics
  getFleetMetrics(fleetSize?: string): Promise<FleetMetrics[]>;
  createFleetMetrics(metrics: InsertFleetMetrics): Promise<FleetMetrics>;
  getLatestFleetMetrics(): Promise<FleetMetrics | undefined>;
  
  // Activities
  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Truck Cost Breakdown (Weekly basis)
  getTruckCostBreakdowns(truckId: string): Promise<TruckCostBreakdown[]>;
  getTruckCostBreakdownByWeek(truckId: string, weekStarting: Date): Promise<TruckCostBreakdown | undefined>;
  createTruckCostBreakdown(breakdown: InsertTruckCostBreakdown): Promise<TruckCostBreakdown>;
  updateTruckCostBreakdown(id: string, breakdown: Partial<InsertTruckCostBreakdown>): Promise<TruckCostBreakdown | undefined>;
  deleteTruckCostBreakdown(id: string): Promise<boolean>;
  getLatestTruckCostBreakdown(truckId: string): Promise<TruckCostBreakdown | undefined>;
  
  // Load Plans (Multi-leg planning)
  getLoadPlans(truckId?: string, driverId?: string): Promise<LoadPlan[]>;
  getLoadPlan(id: string): Promise<LoadPlan | undefined>;
  createLoadPlan(plan: InsertLoadPlan): Promise<LoadPlan>;
  
  // Fuel Purchases
  getFuelPurchases(loadId?: string, truckId?: string): Promise<FuelPurchase[]>;
  getFuelPurchasesByUser(userId: string, loadId?: string, truckId?: string): Promise<FuelPurchase[]>;
  createFuelPurchase(purchase: InsertFuelPurchase): Promise<FuelPurchase>;
  updateFuelPurchase(id: string, purchase: Partial<InsertFuelPurchase>): Promise<FuelPurchase | undefined>;
  deleteFuelPurchase(id: string): Promise<boolean>;
  updateLoadFuelCosts(loadId: string): Promise<Load | undefined>;
  updateLoadPlan(id: string, plan: Partial<InsertLoadPlan>): Promise<LoadPlan | undefined>;
  deleteLoadPlan(id: string): Promise<boolean>;
  
  // Load Plan Legs
  getLoadPlanLegs(loadPlanId: string): Promise<LoadPlanLeg[]>;
  createLoadPlanLeg(leg: InsertLoadPlanLeg): Promise<LoadPlanLeg>;
  updateLoadPlanLeg(id: string, leg: Partial<InsertLoadPlanLeg>): Promise<LoadPlanLeg | undefined>;
  deleteLoadPlanLeg(id: string): Promise<boolean>;
  
  // Helper methods
  updateTruckTotalMiles(truckId: string): Promise<void>;
  
  // Deadhead calculation support
  getTruckLastKnownLocation(truckId: string): Promise<{ city: string; state: string } | null>;
  
  // Analytics and Tracking Methods
  getAllUsers(): Promise<User[]>;
  trackDataInput(data: InsertDataInputTracking): Promise<DataInputTracking>;
  trackFeatureUsage(data: InsertFeatureAnalytics): Promise<FeatureAnalytics>;
  trackUserSession(data: InsertUserAnalytics): Promise<UserAnalytics>;
  recordSystemMetrics(data: InsertSystemMetrics): Promise<SystemMetrics>;
  
  // Analytics Queries (Privacy-controlled)
  getUserAnalytics(userId: string): Promise<UserAnalytics | undefined>;
  getAllUserAnalytics(): Promise<UserAnalytics[]>; // Founder-only
  createUserAnalytics(data: InsertUserAnalytics): Promise<UserAnalytics>;
  updateUserAnalytics(id: string, data: Partial<UserAnalytics>): Promise<UserAnalytics | undefined>;
  getUserFeatureUsage(userId: string): Promise<FeatureAnalytics[]>;
  getUserDataInputs(userId: string): Promise<DataInputTracking[]>;
  getLatestSystemMetrics(): Promise<SystemMetrics | undefined>;
  getTopFeatures(): Promise<any[]>;
  getDataInputTrends(): Promise<any[]>;
  getBusinessImpactMetrics(): Promise<any>;
  getActiveUsersCount(fromDate: Date): Promise<number>;
  getDataInputsCount(fromDate: Date): Promise<number>;
  getFeaturesUsedCount(fromDate: Date): Promise<number>;
  getSystemHealthScore(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private trucks: Map<string, Truck>;
  private loads: Map<string, Load>;
  private drivers: Map<string, Driver>;
  private hosLogs: Map<string, HosLog>;
  private loadBoard: Map<string, LoadBoardItem>;
  private fleetMetrics: Map<string, FleetMetrics>;
  private activities: Map<string, Activity>;
  private truckCostBreakdowns: Map<string, TruckCostBreakdown>;
  private loadPlans: Map<string, LoadPlan>;
  private loadPlanLegs: Map<string, LoadPlanLeg>;
  private fuelPurchases: Map<string, FuelPurchase>;
  private loadStops: Map<string, LoadStop>;
  private userSessions: Map<string, UserSession>;
  private sessionAuditLogs: Map<string, SessionAuditLog>;
  private userAnalytics: Map<string, UserAnalytics>;
  private dataInputTracking: Map<string, DataInputTracking>;
  private systemMetrics: Map<string, SystemMetrics>;
  private featureAnalytics: Map<string, FeatureAnalytics>;

  constructor() {
    this.users = new Map();
    this.trucks = new Map();
    this.loads = new Map();
    this.drivers = new Map();
    this.hosLogs = new Map();
    this.loadBoard = new Map();
    this.fleetMetrics = new Map();
    this.activities = new Map();
    this.truckCostBreakdowns = new Map();
    this.loadPlans = new Map();
    this.loadPlanLegs = new Map();
    this.fuelPurchases = new Map();
    this.loadStops = new Map();
    this.userSessions = new Map();
    this.sessionAuditLogs = new Map();
    this.userAnalytics = new Map();
    this.dataInputTracking = new Map();
    this.systemMetrics = new Map();
    this.featureAnalytics = new Map();
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Sample drivers
    const driver1: Driver = {
      id: "driver-001",
      name: "John Smith",
      cdlNumber: "CDL123456789",
      phone: "(555) 123-4567",
      email: "john.smith@trucking.com",
      isActive: 1,
      createdAt: new Date()
    };
    
    const driver2: Driver = {
      id: "driver-002", 
      name: "Maria Rodriguez",
      cdlNumber: "CDL987654321",
      phone: "(555) 987-6543",
      email: "maria.rodriguez@trucking.com",
      isActive: 1,
      createdAt: new Date()
    };

    this.drivers.set(driver1.id, driver1);
    this.drivers.set(driver2.id, driver2);

    // No sample trucks - clean slate for user to add their own trucks

    // No sample loads - clean slate for user to add their own loads

    // Loads will be added by users

    // Sample HOS logs
    const now = new Date();
    const hosLogs: HosLog[] = [
      {
        id: "hos-1",
        driverId: "driver-001",
        truckId: "truck-101",
        dutyStatus: "DRIVING",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        latitude: 32.7767,
        longitude: -96.7970,
        address: "Dallas, TX",
        driveTimeRemaining: 9.0,
        onDutyRemaining: 12.0,
        cycleHoursRemaining: 58.5,
        violations: [],
        annotations: null,
        createdAt: new Date()
      },
      {
        id: "hos-2",
        driverId: "driver-002",
        truckId: "truck-204",
        dutyStatus: "ON_DUTY",
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        latitude: 29.7604,
        longitude: -95.3698,
        address: "Houston, TX",
        driveTimeRemaining: 10.5,
        onDutyRemaining: 13.2,
        cycleHoursRemaining: 62.8,
        violations: [],
        annotations: "Loading at shipper",
        createdAt: new Date()
      }
    ];

    hosLogs.forEach(log => this.hosLogs.set(log.id, log));

    // Sample load board items
    const loadBoardItems: LoadBoardItem[] = [
      {
        id: "lb-1",
        loadBoardSource: "DAT",
        externalId: "DAT-12345",
        equipmentType: "Dry Van",
        originCity: "Dallas",
        originState: "TX",
        destinationCity: "Atlanta",
        destinationState: "GA",
        miles: 925,
        rate: 2500,
        ratePerMile: 2.70,
        pickupDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
        deliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
        weight: 35000,
        commodity: "Electronics",
        brokerName: "National Freight Co",
        brokerMc: "MC-123456",
        status: "available",
        createdAt: new Date()
      },
      {
        id: "lb-2",
        loadBoardSource: "123Loadboard",
        externalId: "123LB-67890",
        equipmentType: "Reefer",
        originCity: "Miami",
        originState: "FL",
        destinationCity: "Chicago",
        destinationState: "IL",
        miles: 1375,
        rate: 4125,
        ratePerMile: 3.00,
        pickupDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
        deliveryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
        weight: 42000,
        commodity: "Fresh Produce",
        brokerName: "Cold Chain Logistics",
        brokerMc: "MC-789012",
        status: "available",
        createdAt: new Date()
      },
      {
        id: "lb-3",
        loadBoardSource: "Truckstop",
        externalId: "TS-54321",
        equipmentType: "Flatbed",
        originCity: "Denver",
        originState: "CO",
        destinationCity: "Phoenix",
        destinationState: "AZ",
        miles: 850,
        rate: 2295,
        ratePerMile: 2.70,
        pickupDate: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours
        deliveryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
        weight: 45000,
        commodity: "Steel Beams",
        brokerName: "Heavy Haul Express",
        brokerMc: "MC-345678",
        status: "available",
        createdAt: new Date()
      }
    ];

    loadBoardItems.forEach(item => this.loadBoard.set(item.id, item));

    // Sample fleet metrics for different fleet sizes
    const fleetMetrics: FleetMetrics[] = [
      {
        id: "metrics-small",
        fleetSize: "small",
        totalTrucks: 4,
        activeTrucks: 4,
        totalDrivers: 2,
        activeDrivers: 2,
        totalLoads: 2,
        totalMiles: 41746,
        totalRevenue: 6625,
        avgCostPerMile: 1.97,
        utilizationRate: 85.0,
        reportDate: new Date(),
        createdAt: new Date()
      }
    ];

    fleetMetrics.forEach(metrics => this.fleetMetrics.set(metrics.id, metrics));

    // Sample activities
    const activities: Activity[] = [
      {
        id: "activity-1",
        title: "Load TRK-2024-001 completed successfully",
        description: "Truck 204 delivered cargo from Dallas to Miami",
        type: "success",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        relatedDriverId: null,
        relatedTruckId: null,
        relatedLoadId: null
      },
      {
        id: "activity-2",
        title: "New truck added to fleet",
        description: "Truck 501 registered and ready for dispatch",
        type: "info",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        relatedDriverId: null,
        relatedTruckId: null,
        relatedLoadId: null
      },
      {
        id: "activity-3",
        title: "Maintenance reminder for Truck 307",
        description: "Scheduled maintenance due in 1,000 miles",
        type: "warning",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        relatedDriverId: null,
        relatedTruckId: null,
        relatedLoadId: null
      }
    ];

    activities.forEach(activity => this.activities.set(activity.id, activity));

    // Cost breakdowns will be created when users add trucks

    // Load plans will be created when users plan multi-leg trips
  }

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id || randomUUID(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        phone: userData.phone || null,
        company: userData.company || null,
        title: userData.title || null,
        isAdmin: 0, // Default to non-admin
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  async updateUser(id: string, updateData: Partial<UpsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...updateData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Session management operations for MemStorage
  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const session: UserSession = {
      ...sessionData,
      id: sessionData.id || randomUUID(),
      isActive: sessionData.isActive ?? 1,
      ipAddress: sessionData.ipAddress ?? null,
      userAgent: sessionData.userAgent ?? null,
      lastActivity: sessionData.lastActivity ?? new Date(),
      createdAt: new Date(),
    };
    this.userSessions.set(session.id, session);
    return session;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    return this.userSessions.get(sessionId);
  }

  async getUserSessionByToken(sessionToken: string): Promise<UserSession | undefined> {
    return Array.from(this.userSessions.values()).find(session => session.sessionToken === sessionToken);
  }

  async updateUserSession(sessionId: string, updates: Partial<UserSession>): Promise<void> {
    const session = this.userSessions.get(sessionId);
    if (session) {
      const updatedSession = { ...session, ...updates };
      this.userSessions.set(sessionId, updatedSession);
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return Array.from(this.userSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    const now = new Date();
    return Array.from(this.userSessions.values())
      .filter(session => 
        session.userId === userId && 
        session.isActive === 1 && 
        new Date(session.expiresAt) > now
      )
      .sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime());
  }

  async getExpiredSessions(): Promise<UserSession[]> {
    const now = new Date();
    return Array.from(this.userSessions.values())
      .filter(session => session.isActive === 1 && new Date(session.expiresAt) <= now);
  }

  async createSessionAuditLog(logData: InsertSessionAuditLog): Promise<SessionAuditLog> {
    const log: SessionAuditLog = {
      ...logData,
      id: randomUUID(),
      ipAddress: logData.ipAddress ?? null,
      userAgent: logData.userAgent ?? null,
      endpoint: logData.endpoint ?? null,
      metadata: logData.metadata ?? null,
      timestamp: new Date(),
    };
    this.sessionAuditLogs.set(log.id, log);
    return log;
  }

  async getSessionAuditLogs(userId: string, limit: number = 50): Promise<SessionAuditLog[]> {
    return Array.from(this.sessionAuditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, limit);
  }

  async getSessionStatistics(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    recentLogins: number;
    averageSessionDuration: number;
  }> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const activeSessions = Array.from(this.userSessions.values())
      .filter(session => session.isActive === 1 && new Date(session.expiresAt) > now);
    
    const recentLogins = Array.from(this.sessionAuditLogs.values())
      .filter(log => log.action === 'login' && new Date(log.timestamp || 0) > twentyFourHoursAgo);

    return {
      totalActiveSessions: activeSessions.length,
      totalUsers: this.users.size,
      recentLogins: recentLogins.length,
      averageSessionDuration: 0, // Simplified for MemStorage
    };
  }

  // Analytics methods stub implementations
  async trackDataInput(data: InsertDataInputTracking): Promise<DataInputTracking> {
    const record: DataInputTracking = {
      ...data,
      id: randomUUID(),
      ipAddress: data.ipAddress ?? null,
      inputSubType: data.inputSubType ?? null,
      fieldName: data.fieldName ?? null,
      previousValue: data.previousValue ?? null,
      newValue: data.newValue ?? null,
      impactLevel: data.impactLevel ?? "low",
      source: data.source ?? "web_app",
      timestamp: data.timestamp ?? new Date(),
      createdAt: new Date(),
    };
    this.dataInputTracking.set(record.id, record);
    return record;
  }

  async trackFeatureUsage(data: InsertFeatureAnalytics): Promise<FeatureAnalytics> {
    const record: FeatureAnalytics = {
      ...data,
      id: randomUUID(),
      timestamp: data.timestamp ?? new Date(),
      timeSpent: data.timeSpent ?? null,
      successful: data.successful ?? 1,
      errorMessage: data.errorMessage ?? null,
      valueGenerated: data.valueGenerated ?? null,
      efficiencyGain: data.efficiencyGain ?? null,
      createdAt: new Date(),
    };
    this.featureAnalytics.set(record.id, record);
    return record;
  }

  async trackUserSession(data: InsertUserAnalytics): Promise<UserAnalytics> {
    const record: UserAnalytics = {
      ...data,
      id: randomUUID(),
      userAgent: data.userAgent ?? null,
      sessionEndTime: data.sessionEndTime ?? null,
      sessionDuration: data.sessionDuration ?? null,
      deviceType: data.deviceType ?? null,
      browserName: data.browserName ?? null,
      operatingSystem: data.operatingSystem ?? null,
      pagesVisited: data.pagesVisited ?? null,
      featuresUsed: data.featuresUsed ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userAnalytics.set(record.id, record);
    return record;
  }

  async recordSystemMetrics(data: InsertSystemMetrics): Promise<SystemMetrics> {
    const record: SystemMetrics = {
      ...data,
      id: randomUUID(),
      totalActiveUsers: data.totalActiveUsers ?? 0,
      newUsersToday: data.newUsersToday ?? 0,
      averageSessionDuration: data.averageSessionDuration ?? 0,
      totalSessions: data.totalSessions ?? 0,
      totalTrucksInSystem: data.totalTrucksInSystem ?? 0,
      totalLoadsInSystem: data.totalLoadsInSystem ?? 0,
      totalDriversInSystem: data.totalDriversInSystem ?? 0,
      totalFuelPurchases: data.totalFuelPurchases ?? 0,
      totalFleetValue: data.totalFleetValue ?? 0,
      totalRevenueTracked: data.totalRevenueTracked ?? 0,
      totalMilesTracked: data.totalMilesTracked ?? 0,
      averageCostPerMile: data.averageCostPerMile ?? 0,
      apiRequestsToday: data.apiRequestsToday ?? 0,
      dataInputsToday: data.dataInputsToday ?? 0,
      systemErrors: data.systemErrors ?? 0,
      createdAt: new Date(),
    };
    this.systemMetrics.set(record.id, record);
    return record;
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytics[]> {
    return Array.from(this.userAnalytics.values()).filter(record => record.userId === userId);
  }

  async getUserFeatureUsage(userId: string): Promise<FeatureAnalytics[]> {
    return Array.from(this.featureAnalytics.values()).filter(record => record.userId === userId);
  }

  async getUserDataInputs(userId: string): Promise<DataInputTracking[]> {
    return Array.from(this.dataInputTracking.values()).filter(record => record.userId === userId);
  }

  async getLatestSystemMetrics(): Promise<SystemMetrics | undefined> {
    const metrics = Array.from(this.systemMetrics.values());
    return metrics.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
  }

  async getTopFeatures(): Promise<any[]> {
    // Simplified implementation for MemStorage
    return [];
  }

  async getDataInputTrends(): Promise<any[]> {
    // Simplified implementation for MemStorage
    return [];
  }

  async getBusinessImpactMetrics(): Promise<any> {
    // Simplified implementation for MemStorage
    return {};
  }

  async getActiveUsersCount(fromDate: Date): Promise<number> {
    return Array.from(this.userAnalytics.values())
      .filter(record => new Date(record.createdAt || 0) >= fromDate).length;
  }

  async getDataInputsCount(fromDate: Date): Promise<number> {
    return Array.from(this.dataInputTracking.values())
      .filter(record => new Date(record.createdAt || 0) >= fromDate).length;
  }

  async getFeaturesUsedCount(fromDate: Date): Promise<number> {
    return Array.from(this.featureAnalytics.values())
      .filter(record => new Date(record.createdAt || 0) >= fromDate).length;
  }

  async getSystemHealthScore(): Promise<number> {
    // Simplified implementation for MemStorage
    return 100;
  }

  async getTrucks(): Promise<Truck[]> {
    return Array.from(this.trucks.values());
  }

  async getTruck(id: string): Promise<Truck | undefined> {
    return this.trucks.get(id);
  }

  async createTruck(insertTruck: InsertTruck): Promise<Truck> {
    const id = randomUUID();
    const truck: Truck = {
      ...insertTruck,
      id,
      totalMiles: insertTruck.totalMiles ?? 0,
      isActive: insertTruck.isActive ?? 1,
      vin: insertTruck.vin ?? null,
      licensePlate: insertTruck.licensePlate ?? null,
      eldDeviceId: insertTruck.eldDeviceId ?? null,
      currentDriverId: insertTruck.currentDriverId ?? null,
      equipmentType: insertTruck.equipmentType ?? "Dry Van",
      loadBoardIntegration: insertTruck.loadBoardIntegration ?? null,
      elogsIntegration: insertTruck.elogsIntegration ?? null,
      preferredLoadBoard: insertTruck.preferredLoadBoard ?? null,
      elogsProvider: insertTruck.elogsProvider ?? null
    };
    this.trucks.set(id, truck);
    return truck;
  }

  async updateTruck(id: string, updateData: Partial<InsertTruck>): Promise<Truck | undefined> {
    const truck = this.trucks.get(id);
    if (!truck) return undefined;
    
    const updatedTruck = { ...truck, ...updateData };
    this.trucks.set(id, updatedTruck);
    return updatedTruck;
  }

  async deleteTruck(id: string): Promise<boolean> {
    const deleted = this.trucks.delete(id);
    
    // Also clean up related data
    if (deleted) {
      // Remove related cost breakdowns
      const costBreakdowns = Array.from(this.truckCostBreakdowns.entries());
      costBreakdowns.forEach(([breakdownId, breakdown]) => {
        if (breakdown.truckId === id) {
          this.truckCostBreakdowns.delete(breakdownId);
        }
      });
      
      // Remove related loads
      const loads = Array.from(this.loads.entries());
      loads.forEach(([loadId, load]) => {
        if (load.truckId === id) {
          this.loads.delete(loadId);
        }
      });
    }
    
    return deleted;
  }

  async getLoads(): Promise<Load[]> {
    return Array.from(this.loads.values());
  }

  async getLoad(id: string): Promise<Load | undefined> {
    return this.loads.get(id);
  }

  async getLoadsByTruck(truckId: string): Promise<Load[]> {
    return Array.from(this.loads.values()).filter(load => load.truckId === truckId);
  }

  async createLoad(insertLoad: InsertLoad): Promise<Load> {
    const id = randomUUID();
    const load: Load = { 
      id,
      type: insertLoad.type,
      pay: insertLoad.pay,
      miles: insertLoad.miles,
      driverPayType: insertLoad.driverPayType ?? "percentage",
      driverPayPercentage: insertLoad.driverPayPercentage ?? 70,
      driverPayFlat: insertLoad.driverPayFlat ?? 0,
      calculatedDriverPay: insertLoad.calculatedDriverPay ?? 0,
      isProfitable: insertLoad.isProfitable,
      truckId: insertLoad.truckId ?? null,
      estimatedFuelCost: insertLoad.estimatedFuelCost ?? 0,
      estimatedGallons: insertLoad.estimatedGallons ?? 0,
      actualFuelCost: insertLoad.actualFuelCost ?? 0,
      actualGallons: insertLoad.actualGallons ?? 0,
      status: insertLoad.status ?? "pending",
      originCity: insertLoad.originCity ?? null,
      originState: insertLoad.originState ?? null,
      destinationCity: insertLoad.destinationCity ?? null,
      destinationState: insertLoad.destinationState ?? null,
      // Deadhead miles tracking
      deadheadFromCity: insertLoad.deadheadFromCity ?? null,
      deadheadFromState: insertLoad.deadheadFromState ?? null,
      deadheadMiles: insertLoad.deadheadMiles ?? 0,
      totalMilesWithDeadhead: insertLoad.totalMilesWithDeadhead ?? (insertLoad.miles + (insertLoad.deadheadMiles ?? 0)),
      pickupDate: insertLoad.pickupDate ?? null,
      deliveryDate: insertLoad.deliveryDate ?? null,
      commodity: insertLoad.commodity ?? null,
      weight: insertLoad.weight ?? null,
      brokerName: insertLoad.brokerName ?? null,
      brokerContact: insertLoad.brokerContact ?? null,
      rateConfirmation: insertLoad.rateConfirmation ?? null,
      ratePerMile: insertLoad.ratePerMile ?? 0,
      profit: insertLoad.profit ?? 0,
      actualCostPerMile: insertLoad.actualCostPerMile ?? 0,
      notes: insertLoad.notes ?? null,
      createdAt: new Date()
    };
    this.loads.set(id, load);
    return load;
  }

  async updateLoad(id: string, updateData: Partial<InsertLoad>): Promise<Load | undefined> {
    const load = this.loads.get(id);
    if (!load) return undefined;
    
    const updatedLoad = { ...load, ...updateData };
    this.loads.set(id, updatedLoad);
    return updatedLoad;
  }

  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity, 
      id,
      createdAt: new Date(),
      relatedDriverId: insertActivity.relatedDriverId ?? null,
      relatedTruckId: insertActivity.relatedTruckId ?? null,
      relatedLoadId: insertActivity.relatedLoadId ?? null
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Driver methods
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriversByUser(userId: string): Promise<Driver[]> {
    return Array.from(this.drivers.values()).filter(driver => driver.userId === userId);
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = randomUUID();
    const driver: Driver = { 
      ...insertDriver, 
      id,
      createdAt: new Date(),
      isActive: insertDriver.isActive ?? 1,
      phone: insertDriver.phone ?? null,
      email: insertDriver.email ?? null
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: string, updateData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    
    const updatedDriver = { ...driver, ...updateData };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const driver = this.drivers.get(id);
    if (!driver) return false;

    // First, remove driver assignments from trucks
    for (const truck of Array.from(this.trucks.values())) {
      if (truck.currentDriverId === id) {
        truck.currentDriverId = null;
      }
    }

    // Delete associated HOS logs
    const hosLogsToDelete = Array.from(this.hosLogs.values()).filter(log => log.driverId === id);
    for (const log of hosLogsToDelete) {
      this.hosLogs.delete(log.id);
    }

    // Delete related activities that reference this driver
    const activitiesToDelete = Array.from(this.activities.values()).filter(activity => activity.relatedDriverId === id);
    for (const activity of activitiesToDelete) {
      this.activities.delete(activity.id);
    }

    // Delete related load plans
    const loadPlansToDelete = Array.from(this.loadPlans.values()).filter(plan => plan.driverId === id);
    for (const plan of loadPlansToDelete) {
      // Delete associated legs first
      const legs = Array.from(this.loadPlanLegs.values()).filter(leg => leg.loadPlanId === plan.id);
      for (const leg of legs) {
        this.loadPlanLegs.delete(leg.id);
      }
      this.loadPlans.delete(plan.id);
    }

    // Finally, delete the driver
    return this.drivers.delete(id);
  }

  // HOS Log methods
  async getHosLogs(driverId?: string, truckId?: string): Promise<HosLog[]> {
    let logs = Array.from(this.hosLogs.values());
    
    if (driverId) {
      logs = logs.filter(log => log.driverId === driverId);
    }
    
    if (truckId) {
      logs = logs.filter(log => log.truckId === truckId);
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createHosLog(insertHosLog: InsertHosLog): Promise<HosLog> {
    const id = randomUUID();
    const hosLog: HosLog = { 
      id,
      driverId: insertHosLog.driverId,
      truckId: insertHosLog.truckId,
      dutyStatus: insertHosLog.dutyStatus,
      timestamp: insertHosLog.timestamp,
      latitude: insertHosLog.latitude ?? null,
      longitude: insertHosLog.longitude ?? null,
      address: insertHosLog.address ?? null,
      driveTimeRemaining: insertHosLog.driveTimeRemaining ?? null,
      onDutyRemaining: insertHosLog.onDutyRemaining ?? null,
      cycleHoursRemaining: insertHosLog.cycleHoursRemaining ?? null,
      violations: insertHosLog.violations ?? null,
      annotations: insertHosLog.annotations ?? null,
      createdAt: new Date()
    };
    this.hosLogs.set(id, hosLog);
    return hosLog;
  }

  async updateHosLog(id: string, updateData: Partial<InsertHosLog>): Promise<HosLog | undefined> {
    const log = this.hosLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = { ...log, ...updateData };
    this.hosLogs.set(id, updatedLog);
    return updatedLog;
  }

  async getLatestHosStatus(driverId: string): Promise<HosLog | undefined> {
    const logs = await this.getHosLogs(driverId);
    return logs[0]; // Already sorted by timestamp desc
  }

  // Load Board methods
  async getLoadBoardItems(): Promise<LoadBoardItem[]> {
    return Array.from(this.loadBoard.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getAvailableLoads(equipmentType?: string, userId?: string): Promise<LoadBoardItem[]> {
    let loads = Array.from(this.loadBoard.values()).filter(item => item.status === "available");
    
    // Filter by user if specified
    if (userId) {
      loads = loads.filter(item => item.userId === userId);
    }
    
    if (equipmentType) {
      loads = loads.filter(item => item.equipmentType === equipmentType);
    }
    
    return loads.sort((a, b) => b.ratePerMile - a.ratePerMile); // Sort by rate per mile desc
  }

  async createLoadBoardItem(insertItem: InsertLoadBoard): Promise<LoadBoardItem> {
    const id = randomUUID();
    const item: LoadBoardItem = { 
      ...insertItem, 
      id,
      createdAt: new Date(),
      status: insertItem.status ?? "available",
      pickupDate: insertItem.pickupDate ?? null,
      deliveryDate: insertItem.deliveryDate ?? null,
      weight: insertItem.weight ?? null,
      commodity: insertItem.commodity ?? null,
      brokerName: insertItem.brokerName ?? null,
      brokerMc: insertItem.brokerMc ?? null
    };
    this.loadBoard.set(id, item);
    return item;
  }

  async updateLoadBoardStatus(id: string, status: string): Promise<LoadBoardItem | undefined> {
    const item = this.loadBoard.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, status };
    this.loadBoard.set(id, updatedItem);
    return updatedItem;
  }

  // Fleet Metrics methods
  async getFleetMetrics(fleetSize?: string): Promise<FleetMetrics[]> {
    let metrics = Array.from(this.fleetMetrics.values());
    
    if (fleetSize) {
      metrics = metrics.filter(m => m.fleetSize === fleetSize);
    }
    
    return metrics.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
  }

  async createFleetMetrics(insertMetrics: InsertFleetMetrics): Promise<FleetMetrics> {
    const id = randomUUID();
    const metrics: FleetMetrics = { 
      ...insertMetrics, 
      id,
      createdAt: new Date()
    };
    this.fleetMetrics.set(id, metrics);
    return metrics;
  }

  async getLatestFleetMetrics(): Promise<FleetMetrics | undefined> {
    const metrics = await this.getFleetMetrics();
    return metrics[0]; // Already sorted by report date desc
  }

  // Truck Cost Breakdown methods (Weekly basis)
  async getTruckCostBreakdowns(truckId: string): Promise<TruckCostBreakdown[]> {
    return Array.from(this.truckCostBreakdowns.values())
      .filter(breakdown => breakdown.truckId === truckId)
      .sort((a, b) => new Date(b.weekStarting).getTime() - new Date(a.weekStarting).getTime());
  }

  async getTruckCostBreakdownByWeek(truckId: string, weekStarting: Date): Promise<TruckCostBreakdown | undefined> {
    return Array.from(this.truckCostBreakdowns.values())
      .find(breakdown => 
        breakdown.truckId === truckId && 
        new Date(breakdown.weekStarting).toDateString() === weekStarting.toDateString()
      );
  }

  async createTruckCostBreakdown(insertBreakdown: InsertTruckCostBreakdown): Promise<TruckCostBreakdown> {
    const id = randomUUID();
    
    // Calculate total costs
    const totalFixedCosts = (insertBreakdown.truckPayment ?? 0) +
      (insertBreakdown.trailerPayment ?? 0) +
      (insertBreakdown.elogSubscription ?? 0) +
      (insertBreakdown.liabilityInsurance ?? 0) +
      (insertBreakdown.physicalInsurance ?? 0) +
      (insertBreakdown.cargoInsurance ?? 0) +
      (insertBreakdown.trailerInterchange ?? 0) +
      (insertBreakdown.bobtailInsurance ?? 0) +
      (insertBreakdown.nonTruckingLiability ?? 0) +
      (insertBreakdown.basePlateDeduction ?? 0) +
      (insertBreakdown.companyPhone ?? 0);

    const totalVariableCosts = (insertBreakdown.driverPay ?? 0) +
      (insertBreakdown.fuel ?? 0) +
      (insertBreakdown.defFluid ?? 0) +
      (insertBreakdown.maintenance ?? 0) +
      (insertBreakdown.tolls ?? 0) +
      (insertBreakdown.dwellTime ?? 0) +
      (insertBreakdown.reeferFuel ?? 0) +
      (insertBreakdown.truckParking ?? 0);

    const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
    // Cost per mile based on 3000 miles standard for the week
    const costPerMile = totalWeeklyCosts / 3000;

    const breakdown: TruckCostBreakdown = {
      id,
      truckId: insertBreakdown.truckId,
      // Fixed costs (weekly)
      truckPayment: insertBreakdown.truckPayment ?? 0,
      trailerPayment: insertBreakdown.trailerPayment ?? 0,
      elogSubscription: insertBreakdown.elogSubscription ?? 0,
      liabilityInsurance: insertBreakdown.liabilityInsurance ?? 0,
      physicalInsurance: insertBreakdown.physicalInsurance ?? 0,
      cargoInsurance: insertBreakdown.cargoInsurance ?? 0,
      trailerInterchange: insertBreakdown.trailerInterchange ?? 0,
      bobtailInsurance: insertBreakdown.bobtailInsurance ?? 0,
      nonTruckingLiability: insertBreakdown.nonTruckingLiability ?? 0,
      basePlateDeduction: insertBreakdown.basePlateDeduction ?? 0,
      companyPhone: insertBreakdown.companyPhone ?? 0,
      // Variable costs (weekly)
      driverPay: insertBreakdown.driverPay ?? 0,
      fuel: insertBreakdown.fuel ?? 0,
      defFluid: insertBreakdown.defFluid ?? 0,
      maintenance: insertBreakdown.maintenance ?? 0,
      tolls: insertBreakdown.tolls ?? 0,
      dwellTime: insertBreakdown.dwellTime ?? 0,
      reeferFuel: insertBreakdown.reeferFuel ?? 0,
      truckParking: insertBreakdown.truckParking ?? 0,
      // Fuel efficiency tracking
      gallonsUsed: insertBreakdown.gallonsUsed ?? 0,
      avgFuelPrice: insertBreakdown.avgFuelPrice ?? 0,
      milesPerGallon: insertBreakdown.milesPerGallon ?? 0,
      // Calculated fields
      totalFixedCosts,
      totalVariableCosts,
      totalWeeklyCosts,
      costPerMile,
      // Week tracking
      weekStarting: insertBreakdown.weekStarting,
      weekEnding: insertBreakdown.weekEnding,
      milesThisWeek: insertBreakdown.milesThisWeek ?? 0,
      totalMilesWithDeadhead: insertBreakdown.totalMilesWithDeadhead ?? 0,
      fuel: insertBreakdown.fuel ?? 0,
      defFluid: insertBreakdown.defFluid ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.truckCostBreakdowns.set(id, breakdown);
    return breakdown;
  }

  async updateTruckCostBreakdown(id: string, updateData: Partial<InsertTruckCostBreakdown>): Promise<TruckCostBreakdown | undefined> {
    const breakdown = this.truckCostBreakdowns.get(id);
    if (!breakdown) return undefined;

    const updatedData = { ...breakdown, ...updateData };

    // Recalculate totals with updated data
    const totalFixedCosts = (updatedData.truckPayment ?? 0) +
      (updatedData.trailerPayment ?? 0) +
      (updatedData.elogSubscription ?? 0) +
      (updatedData.liabilityInsurance ?? 0) +
      (updatedData.physicalInsurance ?? 0) +
      (updatedData.cargoInsurance ?? 0) +
      (updatedData.trailerInterchange ?? 0) +
      (updatedData.bobtailInsurance ?? 0) +
      (updatedData.nonTruckingLiability ?? 0) +
      (updatedData.basePlateDeduction ?? 0) +
      (updatedData.companyPhone ?? 0);

    const totalVariableCosts = (updatedData.driverPay ?? 0) +
      (updatedData.fuel ?? 0) +
      (updatedData.defFluid ?? 0) +
      (updatedData.maintenance ?? 0) +
      (updatedData.iftaTaxes ?? 0) +
      (updatedData.tolls ?? 0) +
      (updatedData.dwellTime ?? 0) +
      (updatedData.reeferFuel ?? 0) +
      (updatedData.truckParking ?? 0);

    const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
    // Use total miles with deadhead for accurate cost per mile calculation
    const totalMiles = (updatedData.totalMilesWithDeadhead ?? updatedData.milesThisWeek ?? 0);
    const costPerMile = totalMiles > 0 ? 
      Number((totalWeeklyCosts / totalMiles).toFixed(3)) : 0;

    const updatedBreakdown = { 
      ...updatedData,
      totalFixedCosts,
      totalVariableCosts,
      totalWeeklyCosts,
      costPerMile,
      updatedAt: new Date() 
    };
    
    this.truckCostBreakdowns.set(id, updatedBreakdown);
    
    // Update the truck's cost data to reflect new cost per mile
    const truck = this.trucks.get(updatedBreakdown.truckId);
    if (truck) {
      const updatedTruck = {
        ...truck,
        fixedCosts: totalFixedCosts,
        variableCosts: totalVariableCosts,
        totalMiles: updatedData.milesThisWeek || truck.totalMiles,
        costPerMile
      };
      this.trucks.set(truck.id, updatedTruck);
    }
    
    return updatedBreakdown;
  }

  async deleteTruckCostBreakdown(id: string): Promise<boolean> {
    return this.truckCostBreakdowns.delete(id);
  }

  async getLatestTruckCostBreakdown(truckId: string): Promise<TruckCostBreakdown | undefined> {
    const breakdowns = await this.getTruckCostBreakdowns(truckId);
    return breakdowns[0]; // Already sorted by week starting desc
  }

  // Load Plans methods
  async getLoadPlans(truckId?: string, driverId?: string): Promise<LoadPlan[]> {
    let plans = Array.from(this.loadPlans.values());

    if (truckId) {
      plans = plans.filter(plan => plan.truckId === truckId);
    }

    if (driverId) {
      plans = plans.filter(plan => plan.driverId === driverId);
    }

    return plans.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getLoadPlan(id: string): Promise<LoadPlan | undefined> {
    return this.loadPlans.get(id);
  }

  async createLoadPlan(insertPlan: InsertLoadPlan): Promise<LoadPlan> {
    const id = randomUUID();
    const plan: LoadPlan = {
      ...insertPlan,
      id,
      status: insertPlan.status ?? "draft",
      totalMiles: insertPlan.totalMiles ?? 0,
      totalRevenue: insertPlan.totalRevenue ?? 0,
      totalProfit: insertPlan.totalProfit ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      driverId: insertPlan.driverId ?? null
    };
    this.loadPlans.set(id, plan);
    return plan;
  }

  async updateLoadPlan(id: string, updateData: Partial<InsertLoadPlan>): Promise<LoadPlan | undefined> {
    const plan = this.loadPlans.get(id);
    if (!plan) return undefined;

    const updatedPlan = { 
      ...plan, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.loadPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteLoadPlan(id: string): Promise<boolean> {
    // Delete associated legs first
    const legs = await this.getLoadPlanLegs(id);
    for (const leg of legs) {
      this.loadPlanLegs.delete(leg.id);
    }
    return this.loadPlans.delete(id);
  }

  // Load Plan Legs methods
  async getLoadPlanLegs(loadPlanId: string): Promise<LoadPlanLeg[]> {
    return Array.from(this.loadPlanLegs.values())
      .filter(leg => leg.loadPlanId === loadPlanId)
      .sort((a, b) => a.legNumber - b.legNumber);
  }

  async createLoadPlanLeg(insertLeg: InsertLoadPlanLeg): Promise<LoadPlanLeg> {
    const id = randomUUID();
    const leg: LoadPlanLeg = {
      ...insertLeg,
      id,
      createdAt: new Date(),
      commodity: insertLeg.commodity ?? null,
      weight: insertLeg.weight ?? null,
      brokerName: insertLeg.brokerName ?? null,
      notes: insertLeg.notes ?? null
    };
    this.loadPlanLegs.set(id, leg);
    return leg;
  }

  async updateLoadPlanLeg(id: string, updateData: Partial<InsertLoadPlanLeg>): Promise<LoadPlanLeg | undefined> {
    const leg = this.loadPlanLegs.get(id);
    if (!leg) return undefined;

    const updatedLeg = { ...leg, ...updateData };
    this.loadPlanLegs.set(id, updatedLeg);
    return updatedLeg;
  }

  async deleteLoadPlanLeg(id: string): Promise<boolean> {
    return this.loadPlanLegs.delete(id);
  }

  // Fuel Purchase methods
  async getFuelPurchases(loadId?: string, truckId?: string): Promise<FuelPurchase[]> {
    let purchases = Array.from(this.fuelPurchases.values());
    
    if (loadId) {
      purchases = purchases.filter(purchase => purchase.loadId === loadId);
    }
    
    if (truckId) {
      purchases = purchases.filter(purchase => purchase.truckId === truckId);
    }
    
    return purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  async getFuelPurchasesByUser(userId: string, loadId?: string, truckId?: string): Promise<FuelPurchase[]> {
    // Get all trucks owned by this user
    const userTrucks = Array.from(this.trucks.values()).filter(truck => truck.userId === userId);
    const userTruckIds = new Set(userTrucks.map(truck => truck.id));
    
    // Filter fuel purchases to only those associated with user's trucks
    let purchases = Array.from(this.fuelPurchases.values())
      .filter(purchase => purchase.truckId && userTruckIds.has(purchase.truckId));
    
    if (loadId) {
      purchases = purchases.filter(purchase => purchase.loadId === loadId);
    }
    
    if (truckId) {
      purchases = purchases.filter(purchase => purchase.truckId === truckId);
    }
    
    return purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  async createFuelPurchase(insertPurchase: InsertFuelPurchase): Promise<FuelPurchase> {
    const id = randomUUID();
    const purchase: FuelPurchase = {
      ...insertPurchase,
      id,
      loadId: insertPurchase.loadId ?? null,
      stationName: insertPurchase.stationName ?? null,
      stationAddress: insertPurchase.stationAddress ?? null,
      receiptNumber: insertPurchase.receiptNumber ?? null,
      paymentMethod: insertPurchase.paymentMethod ?? null,
      notes: insertPurchase.notes ?? null,
      createdAt: new Date()
    };
    
    this.fuelPurchases.set(id, purchase);
    
    // Update load's actual fuel costs if loadId exists
    if (purchase.loadId) {
      await this.updateLoadFuelCosts(purchase.loadId);
    }
    
    return purchase;
  }

  async updateFuelPurchase(id: string, updateData: Partial<InsertFuelPurchase>): Promise<FuelPurchase | undefined> {
    const purchase = this.fuelPurchases.get(id);
    if (!purchase) return undefined;
    
    const updatedPurchase = { ...purchase, ...updateData };
    this.fuelPurchases.set(id, updatedPurchase);
    
    // Update load's actual fuel costs if loadId exists
    if (updatedPurchase.loadId) {
      await this.updateLoadFuelCosts(updatedPurchase.loadId);
    }
    
    return updatedPurchase;
  }

  async deleteFuelPurchase(id: string): Promise<boolean> {
    // Get the purchase first to know which load to update
    const purchase = this.fuelPurchases.get(id);
    const deleted = this.fuelPurchases.delete(id);
    
    // Update load's actual fuel costs if purchase existed and had a loadId
    if (deleted && purchase && purchase.loadId) {
      await this.updateLoadFuelCosts(purchase.loadId);
    }
    
    return deleted;
  }

  async updateLoadFuelCosts(loadId: string): Promise<Load | undefined> {
    const load = this.loads.get(loadId);
    if (!load) return undefined;
    
    // Get all fuel purchases for this load
    const purchases = await this.getFuelPurchases(loadId);
    
    // Calculate totals separated by fuel type
    const dieselPurchases = purchases.filter(p => p.fuelType === 'diesel');
    const defPurchases = purchases.filter(p => p.fuelType === 'def');
    
    const totalCost = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalGallons = purchases.reduce((sum, purchase) => sum + purchase.gallons, 0);
    
    // Calculate actual cost per mile including fuel
    const truckCostPerMile = load.truckId ? await this.getTruckCostPerMile(load.truckId) : 0;
    const fuelCostPerMile = load.miles > 0 ? totalCost / load.miles : 0;
    const actualCostPerMile = truckCostPerMile + fuelCostPerMile;
    
    // Update load with actual fuel costs
    const updatedLoad = {
      ...load,
      actualFuelCost: totalCost,
      actualGallons: totalGallons,
      actualCostPerMile: Number(actualCostPerMile.toFixed(3))
    };
    
    this.loads.set(loadId, updatedLoad);
    
    // Update weekly fuel costs in truck cost breakdown if truck is assigned
    if (load.truckId) {
      await this.updateWeeklyFuelCosts(load.truckId, dieselPurchases, defPurchases);
    }
    
    return updatedLoad;
  }

  // Update weekly fuel costs in truck cost breakdown
  private async updateWeeklyFuelCosts(truckId: string, dieselPurchases: FuelPurchase[], defPurchases: FuelPurchase[]): Promise<void> {
    // Calculate weekly costs by fuel type
    const dieselCost = dieselPurchases.reduce((sum, p) => sum + p.totalCost, 0);
    const defCost = defPurchases.reduce((sum, p) => sum + p.totalCost, 0);
    
    // Get current week's cost breakdown
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const currentBreakdown = await this.getTruckCostBreakdownByWeek(truckId, startOfWeek);
    
    if (currentBreakdown) {
      // Update existing breakdown with new fuel costs
      await this.updateTruckCostBreakdown(currentBreakdown.id, {
        fuel: dieselCost,
        defFluid: defCost
      });
    }
  }

  private async getTruckCostPerMile(truckId: string): Promise<number> {
    const truck = this.trucks.get(truckId);
    if (!truck) return 0;
    
    // Get latest cost breakdown for more accurate cost per mile
    const breakdown = await this.getLatestTruckCostBreakdown(truckId);
    if (breakdown && breakdown.costPerMile > 0) {
      return breakdown.costPerMile;
    }
    
    // Fallback to truck's calculated cost per mile
    return truck.totalMiles > 0 ? 
      (truck.fixedCosts + truck.variableCosts) / truck.totalMiles : 
      0;
  }

  // Get truck's last known location for deadhead calculation
  async getTruckLastKnownLocation(truckId: string): Promise<{ city: string; state: string } | null> {
    // Get the most recent delivered load for this truck
    const truckLoads = Array.from(this.loads.values())
      .filter(load => load.truckId === truckId && load.status === 'delivered')
      .sort((a, b) => {
        const dateA = new Date(a.deliveryDate || a.createdAt || '').getTime();
        const dateB = new Date(b.deliveryDate || b.createdAt || '').getTime();
        return dateB - dateA; // Most recent first
      });

    if (truckLoads.length > 0) {
      const lastLoad = truckLoads[0];
      return {
        city: lastLoad.destinationCity || "",
        state: lastLoad.destinationState || ""
      };
    }

    // If no delivered loads, try to get truck's home base or default location
    const truck = this.trucks.get(truckId);
    if (truck) {
      // Return a default location (could be enhanced to store truck home base)
      return { city: "Dallas", state: "TX" }; // Default freight hub
    }

    return null;
  }

  // LoadStop methods (stub implementations for MemStorage interface compliance)
  async getLoadStops(loadId: string): Promise<LoadStop[]> {
    return Array.from(this.loadStops.values())
      .filter(stop => stop.loadId === loadId)
      .sort((a, b) => a.stopNumber - b.stopNumber);
  }

  async createLoadStop(insertStop: InsertLoadStop): Promise<LoadStop> {
    const id = randomUUID();
    const stop: LoadStop = {
      ...insertStop,
      id,
      status: insertStop.status ?? "pending",
      commodity: insertStop.commodity ?? null,
      weight: insertStop.weight ?? null,
      scheduledDate: insertStop.scheduledDate ?? null,
      actualDate: insertStop.actualDate ?? null,
      instructions: insertStop.instructions ?? null,
      milesFromPrevious: insertStop.milesFromPrevious ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.loadStops.set(id, stop);
    return stop;
  }

  async updateLoadStop(id: string, updateData: Partial<InsertLoadStop>): Promise<LoadStop | undefined> {
    const stop = this.loadStops.get(id);
    if (!stop) return undefined;

    const updatedStop = { ...stop, ...updateData, updatedAt: new Date() };
    this.loadStops.set(id, updatedStop);
    return updatedStop;
  }

  async deleteLoadStop(id: string): Promise<boolean> {
    return this.loadStops.delete(id);
  }

  async deleteLoadStops(loadId: string): Promise<boolean> {
    const stops = Array.from(this.loadStops.entries());
    let deleted = false;
    
    stops.forEach(([stopId, stop]) => {
      if (stop.loadId === loadId) {
        this.loadStops.delete(stopId);
        deleted = true;
      }
    });
    
    return deleted;
  }

  // Missing method implementation
  async updateTruckTotalMiles(truckId: string): Promise<void> {
    const truck = this.trucks.get(truckId);
    if (!truck) return;
    
    // Calculate total miles from all loads for this truck
    const truckLoads = Array.from(this.loads.values()).filter(load => load.truckId === truckId);
    const totalMiles = truckLoads.reduce((sum, load) => sum + load.miles, 0);
    
    // Update truck's total miles
    const updatedTruck = { ...truck, totalMiles };
    this.trucks.set(truckId, updatedTruck);
  }

  async deleteLoad(id: string): Promise<boolean> {
    return this.loads.delete(id);
  }

  // Analytics and tracking implementations (using in-memory, not DB)
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getTopFeatures(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT feature_name, COUNT(*) as usage_count 
      FROM feature_analytics 
      GROUP BY feature_name 
      ORDER BY usage_count DESC 
      LIMIT 10
    `);
    return result.rows;
  }

  async getDataInputTrends(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        input_type,
        COUNT(*) as count
      FROM data_input_tracking 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), input_type
      ORDER BY date DESC, count DESC
    `);
    return result.rows;
  }

  async getBusinessImpactMetrics(): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        business_function,
        COUNT(*) as total_actions,
        AVG(CASE WHEN successful = 1 THEN 1 ELSE 0 END) as success_rate,
        SUM(value_generated) as total_value,
        SUM(efficiency_gain) as total_efficiency_gain
      FROM feature_analytics 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY business_function
    `);
    return result.rows;
  }

  async getActiveUsersCount(fromDate: Date): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_analytics 
      WHERE session_start_time >= ${fromDate}
    `);
    return (result.rows[0] as any)?.count || 0;
  }

  async getDataInputsCount(fromDate: Date): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM data_input_tracking 
      WHERE created_at >= ${fromDate}
    `);
    return (result.rows[0] as any)?.count || 0;
  }

  async getFeaturesUsedCount(fromDate: Date): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT feature_name) as count
      FROM feature_analytics 
      WHERE created_at >= ${fromDate}
    `);
    return (result.rows[0] as any)?.count || 0;
  }

  async getSystemHealthScore(): Promise<number> {
    const result = await db.execute(sql`
      SELECT 
        AVG(CASE WHEN successful = 1 THEN 1 ELSE 0 END) * 100 as health_score
      FROM feature_analytics 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    return (result.rows[0] as any)?.health_score || 100;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      console.log(`[DatabaseStorage] Starting comprehensive user deletion for user ${id}`);
      
      // Get all trucks for this user to clean up related data
      const userTrucks = await db.select().from(trucks).where(eq(trucks.userId, id));
      const truckIds = userTrucks.map(truck => truck.id);
      
      // Get all drivers for this user
      const userDrivers = await db.select().from(drivers).where(eq(drivers.userId, id));
      const driverIds = userDrivers.map(driver => driver.id);
      
      console.log(`[DatabaseStorage] Found ${userTrucks.length} trucks and ${userDrivers.length} drivers to delete`);
      
      // Delete truck-related records first (foreign key dependencies)
      if (truckIds.length > 0) {
        // Delete truck cost breakdowns
        await db.delete(truckCostBreakdown).where(inArray(truckCostBreakdown.truckId, truckIds));
        console.log(`[DatabaseStorage] Deleted truck cost breakdowns for ${truckIds.length} trucks`);
        
        // Delete fuel purchases for these trucks
        await db.delete(fuelPurchases).where(inArray(fuelPurchases.truckId, truckIds));
        console.log(`[DatabaseStorage] Deleted fuel purchases for trucks`);
      }
      
      // Delete driver-related records
      if (driverIds.length > 0) {
        // Delete HOS logs for these drivers
        await db.delete(hosLogs).where(inArray(hosLogs.driverId, driverIds));
        console.log(`[DatabaseStorage] Deleted HOS logs for ${driverIds.length} drivers`);
      }
      
      // Delete loads for this user
      await db.delete(loads).where(eq(loads.userId, id));
      console.log(`[DatabaseStorage] Deleted loads for user`);
      
      // Delete drivers for this user
      await db.delete(drivers).where(eq(drivers.userId, id));
      console.log(`[DatabaseStorage] Deleted drivers for user`);
      
      // Delete trucks for this user
      await db.delete(trucks).where(eq(trucks.userId, id));
      console.log(`[DatabaseStorage] Deleted trucks for user`);
      
      // Delete analytics and session data
      await db.delete(userSessions).where(eq(userSessions.userId, id));
      await db.delete(dataInputTracking).where(eq(dataInputTracking.userId, id));
      await db.delete(userAnalytics).where(eq(userAnalytics.userId, id));
      await db.delete(featureAnalytics).where(eq(featureAnalytics.userId, id));
      console.log(`[DatabaseStorage] Deleted analytics and session data for user`);
      
      // Note: Activities table doesn't have userId field, so we skip activity deletion
      console.log(`[DatabaseStorage] Skipped activity deletion (no userId field in activities table)`);
      
      // Finally delete the user record
      const result = await db.delete(users).where(eq(users.id, id));
      const deleted = result.rowCount > 0;
      
      console.log(`[DatabaseStorage] User deletion ${deleted ? 'completed successfully' : 'failed'} for user ${id}`);
      return deleted;
    } catch (error) {
      console.error("[DatabaseStorage] Error deleting user:", error);
      return false;
    }
  }

  // Session management operations
  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId));
    return session;
  }

  async getUserSessionByToken(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
    return session;
  }

  async updateUserSession(sessionId: string, updates: Partial<UserSession>): Promise<void> {
    await db
      .update(userSessions)
      .set(updates)
      .where(eq(userSessions.id, sessionId));
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.createdAt));
  }

  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.isActive, 1),
        gt(userSessions.expiresAt, new Date())
      ))
      .orderBy(desc(userSessions.lastActivity));
  }

  async getExpiredSessions(): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.isActive, 1),
        lt(userSessions.expiresAt, new Date())
      ));
  }

  // Session audit log operations
  async createSessionAuditLog(logData: InsertSessionAuditLog): Promise<SessionAuditLog> {
    // Check if session exists first
    const [existingSession] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, logData.sessionId))
      .limit(1);
    
    if (!existingSession) {
      console.log(`Session ${logData.sessionId} not found, skipping audit log`);
      // Return a dummy log instead of throwing an error
      return {
        id: 'dummy-' + Date.now(),
        sessionId: logData.sessionId,
        userId: logData.userId,
        action: logData.action,
        endpoint: logData.endpoint,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        metadata: logData.metadata,
        timestamp: new Date(),
      } as SessionAuditLog;
    }

    const [log] = await db
      .insert(sessionAuditLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getSessionAuditLogs(userId: string, limit: number = 50): Promise<SessionAuditLog[]> {
    return await db
      .select()
      .from(sessionAuditLogs)
      .where(eq(sessionAuditLogs.userId, userId))
      .orderBy(desc(sessionAuditLogs.timestamp))
      .limit(limit);
  }

  async getSessionStatistics(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    recentLogins: number;
    averageSessionDuration: number;
  }> {
    // Get active sessions count
    const activeSessionsResult = await db
      .select({ count: count() })
      .from(userSessions)
      .where(and(
        eq(userSessions.isActive, 1),
        gt(userSessions.expiresAt, new Date())
      ));

    // Get total users count
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users);

    // Get recent logins (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLoginsResult = await db
      .select({ count: count() })
      .from(sessionAuditLogs)
      .where(and(
        eq(sessionAuditLogs.action, 'login'),
        gt(sessionAuditLogs.timestamp, twentyFourHoursAgo)
      ));

    return {
      totalActiveSessions: activeSessionsResult[0]?.count || 0,
      totalUsers: totalUsersResult[0]?.count || 0,
      recentLogins: recentLoginsResult[0]?.count || 0,
      averageSessionDuration: 0, // Could be calculated if needed
    };
  }

  // Truck operations
  async getTrucks(): Promise<Truck[]> {
    const trucksData = await db
      .select({
        id: trucks.id,
        name: trucks.name,
        fixedCosts: trucks.fixedCosts,
        variableCosts: trucks.variableCosts,
        totalMiles: trucks.totalMiles,
        isActive: trucks.isActive,
        vin: trucks.vin,
        licensePlate: trucks.licensePlate,
        eldDeviceId: trucks.eldDeviceId,
        currentDriverId: trucks.currentDriverId,
        equipmentType: trucks.equipmentType,
        loadBoardIntegration: trucks.loadBoardIntegration,
        elogsIntegration: trucks.elogsIntegration,
        preferredLoadBoard: trucks.preferredLoadBoard,
        elogsProvider: trucks.elogsProvider,
      })
      .from(trucks);

    // console.log('[DatabaseStorage] Raw trucks from DB:', trucksData);

    // Fetch drivers for trucks that have currentDriverId
    const trucksWithDrivers = await Promise.all(
      trucksData.map(async (truck) => {
        let driver = null;
        if (truck.currentDriverId) {
          const [driverData] = await db
            .select()
            .from(drivers)
            .where(eq(drivers.id, truck.currentDriverId));
          driver = driverData || null;
        }

        // Get actual cost per mile from cost breakdown
        let costPerMile = 0;
        try {
          const [costBreakdown] = await db
            .select()
            .from(truckCostBreakdown)
            .where(eq(truckCostBreakdown.truckId, truck.id))
            .orderBy(desc(truckCostBreakdown.weekStarting))
            .limit(1);
          
          if (costBreakdown && costBreakdown.costPerMile && costBreakdown.costPerMile > 0) {
            costPerMile = costBreakdown.costPerMile;
          } else {
            // Only use fallback calculation if truck has operational history
            // For new trucks with no miles/loads, show $0.00
            if (truck.totalMiles > 0) {
              const weeklyMiles = 3000;
              const totalWeeklyCosts = (truck.fixedCosts || 0) + (truck.variableCosts || 0);
              costPerMile = weeklyMiles > 0 ? (totalWeeklyCosts / weeklyMiles) : 0;
            } else {
              costPerMile = 0; // No operational data = $0.00
            }
          }
        } catch (error) {
          console.error('[DatabaseStorage] Error fetching cost breakdown for truck:', truck.id, error);
          // Only use fallback calculation if truck has operational history
          if (truck.totalMiles > 0) {
            const weeklyMiles = 3000;
            const totalWeeklyCosts = (truck.fixedCosts || 0) + (truck.variableCosts || 0);
            costPerMile = weeklyMiles > 0 ? (totalWeeklyCosts / weeklyMiles) : 0;
          } else {
            costPerMile = 0; // No operational data = $0.00
          }
        }

        return {
          ...truck,
          costPerMile: Number(costPerMile.toFixed(2)),
          driver
        };
      })
    );

    // console.log('[DatabaseStorage] Trucks with drivers and calculated CPM:', trucksWithDrivers);
    return trucksWithDrivers as Truck[];
  }

  async getTrucksByUser(userId: string): Promise<Truck[]> {
    // console.log(`[DatabaseStorage] Getting trucks for user: ${userId}`);
    const trucksData = await db
      .select({
        id: trucks.id,
        name: trucks.name,
        fixedCosts: trucks.fixedCosts,
        variableCosts: trucks.variableCosts,
        totalMiles: trucks.totalMiles,
        isActive: trucks.isActive,
        vin: trucks.vin,
        licensePlate: trucks.licensePlate,
        eldDeviceId: trucks.eldDeviceId,
        currentDriverId: trucks.currentDriverId,
        equipmentType: trucks.equipmentType,
        loadBoardIntegration: trucks.loadBoardIntegration,
        elogsIntegration: trucks.elogsIntegration,
        preferredLoadBoard: trucks.preferredLoadBoard,
        elogsProvider: trucks.elogsProvider,
      })
      .from(trucks)
      .where(eq(trucks.userId, userId));

    const trucksWithDrivers = await Promise.all(
      trucksData.map(async (truck) => {
        let driver = null;
        if (truck.currentDriverId) {
          const [driverData] = await db
            .select()
            .from(drivers)
            .where(eq(drivers.id, truck.currentDriverId));
          driver = driverData || null;
        }

        // Get actual cost per mile from cost breakdown
        let costPerMile = 0;
        try {
          const [costBreakdown] = await db
            .select()
            .from(truckCostBreakdown)
            .where(eq(truckCostBreakdown.truckId, truck.id))
            .orderBy(desc(truckCostBreakdown.weekStarting))
            .limit(1);
          
          if (costBreakdown && costBreakdown.costPerMile && costBreakdown.costPerMile > 0) {
            costPerMile = costBreakdown.costPerMile;
          } else {
            // Only use fallback calculation if truck has operational history
            // For new trucks with no miles/loads, show $0.00
            if (truck.totalMiles > 0) {
              const weeklyMiles = 3000;
              const totalWeeklyCosts = (truck.fixedCosts || 0) + (truck.variableCosts || 0);
              costPerMile = weeklyMiles > 0 ? (totalWeeklyCosts / weeklyMiles) : 0;
            } else {
              costPerMile = 0; // No operational data = $0.00
            }
          }
        } catch (error) {
          console.error('[DatabaseStorage] Error fetching cost breakdown for truck:', truck.id, error);
          // Only use fallback calculation if truck has operational history
          if (truck.totalMiles > 0) {
            const weeklyMiles = 3000;
            const totalWeeklyCosts = (truck.fixedCosts || 0) + (truck.variableCosts || 0);
            costPerMile = weeklyMiles > 0 ? (totalWeeklyCosts / weeklyMiles) : 0;
          } else {
            costPerMile = 0; // No operational data = $0.00
          }
        }

        return {
          ...truck,
          costPerMile: Number(costPerMile.toFixed(2)),
          driver
        };
      })
    );

    // console.log(`[DatabaseStorage] User ${userId} trucks with details:`, trucksWithDrivers);
    return trucksWithDrivers as Truck[];
  }

  // Multi-user fleet operations for system-wide functionality (alias methods)
  async getTrucksForUser(userId: string): Promise<Truck[]> {
    return this.getTrucksByUser(userId);
  }

  async getTruck(id: string): Promise<Truck | undefined> {
    const [truck] = await db.select().from(trucks).where(eq(trucks.id, id));
    if (!truck) return undefined;

    // Fetch associated driver if exists
    let driver = null;
    if (truck.currentDriverId) {
      const [driverData] = await db.select().from(drivers).where(eq(drivers.id, truck.currentDriverId));
      driver = driverData || null;
    }

    // Get actual cost per mile from cost breakdown
    let costPerMile = 0;
    try {
      const [costBreakdown] = await db
        .select()
        .from(truckCostBreakdown)
        .where(eq(truckCostBreakdown.truckId, truck.id))
        .orderBy(desc(truckCostBreakdown.weekStarting))
        .limit(1);
      
      if (costBreakdown && costBreakdown.costPerMile) {
        costPerMile = costBreakdown.costPerMile;
      } else {
        // Only use fallback calculation if truck has operational history
        if (truck.totalMiles > 0) {
          const weeklyMiles = 3000;
          const totalWeeklyCosts = (truck.fixedCosts || 0) + (truck.variableCosts || 0);
          costPerMile = weeklyMiles > 0 ? (totalWeeklyCosts / weeklyMiles) : 0;
        } else {
          costPerMile = 0; // No operational data = $0.00
        }
      }
    } catch (error) {
      console.error('[DatabaseStorage] Error fetching cost breakdown for truck:', truck.id, error);
      // Only use fallback calculation if truck has operational history
      if (truck.totalMiles > 0) {
        const weeklyMiles = 3000;
        const totalWeeklyCosts = (truck.fixedCosts || 0) + (truck.variableCosts || 0);
        costPerMile = weeklyMiles > 0 ? (totalWeeklyCosts / weeklyMiles) : 0;
      } else {
        costPerMile = 0; // No operational data = $0.00
      }
    }

    return {
      ...truck,
      costPerMile: Number(costPerMile.toFixed(2)),
      driver
    } as Truck;
  }

  async createTruck(insertTruck: InsertTruck): Promise<Truck> {
    console.log('[DatabaseStorage] Creating truck:', insertTruck);
    
    const [newTruck] = await db
      .insert(trucks)
      .values(insertTruck)
      .returning();

    console.log('[DatabaseStorage] Created truck in DB:', newTruck);

    // Fetch with driver data and calculated fields
    const createdTruck = await this.getTruck(newTruck.id);
    return createdTruck!;
  }

  async updateTruck(id: string, updateData: Partial<InsertTruck>): Promise<Truck | undefined> {
    const [updatedTruck] = await db
      .update(trucks)
      .set(updateData)
      .where(eq(trucks.id, id))
      .returning();
    
    if (!updatedTruck) return undefined;
    return this.getTruck(id);
  }

  async deleteTruck(id: string): Promise<boolean> {
    try {
      // Check if truck exists first
      const existingTruck = await db.select().from(trucks).where(eq(trucks.id, id));
      if (existingTruck.length === 0) {
        return false;
      }
      
      // First, delete related cost breakdowns
      await db.delete(truckCostBreakdown).where(eq(truckCostBreakdown.truckId, id));
      
      // Delete related loads
      await db.delete(loads).where(eq(loads.truckId, id));
      
      // Delete related HOS logs
      await db.delete(hosLogs).where(eq(hosLogs.truckId, id));
      
      // Delete related activities that reference this truck
      await db.delete(activities).where(eq(activities.relatedTruckId, id));
      
      // Finally, delete the truck itself
      const result = await db.delete(trucks).where(eq(trucks.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("[DatabaseStorage] Error deleting truck:", error);
      return false;
    }
  }

  // Helper method to automatically update truck total miles based on all assigned loads
  async updateTruckTotalMiles(truckId: string): Promise<void> {
    try {
      console.log(`[DatabaseStorage] Calculating total miles for truck ${truckId}...`);
      
      // Calculate total miles from ALL loads assigned to this truck (all statuses)
      const truckLoads = await db
        .select({
          totalMilesWithDeadhead: loads.totalMilesWithDeadhead,
          miles: loads.miles,
          deadheadMiles: loads.deadheadMiles,
          status: loads.status
        })
        .from(loads)
        .where(eq(loads.truckId, truckId));

      console.log(`[DatabaseStorage] Found ${truckLoads.length} loads for truck ${truckId}`);

      // Calculate total miles with fallback logic
      const totalMiles = truckLoads.reduce((sum, load) => {
        // Use totalMilesWithDeadhead if available, otherwise calculate from miles + deadhead
        const loadMiles = load.totalMilesWithDeadhead || 
                         ((load.miles || 0) + (load.deadheadMiles || 0));
        return sum + loadMiles;
      }, 0);

      // Update truck with calculated total miles
      await db
        .update(trucks)
        .set({ totalMiles })
        .where(eq(trucks.id, truckId));

      console.log(`[DatabaseStorage] Updated truck ${truckId} total miles to ${totalMiles} (recalculated from ${truckLoads.length} loads)`);
    } catch (error) {
      console.error(`[DatabaseStorage] Error updating truck total miles for ${truckId}:`, error);
    }
  }

  // Get truck's last known location from most recent delivered load
  async getTruckLastKnownLocation(truckId: string): Promise<{ city: string; state: string } | null> {
    try {
      // Find the most recent delivered load for this truck
      const [lastDeliveredLoad] = await db
        .select({
          destinationCity: loads.destinationCity,
          destinationState: loads.destinationState,
          deliveryDate: loads.deliveryDate
        })
        .from(loads)
        .where(and(eq(loads.truckId, truckId), eq(loads.status, "delivered")))
        .orderBy(desc(loads.deliveryDate))
        .limit(1);

      if (lastDeliveredLoad && lastDeliveredLoad.destinationCity && lastDeliveredLoad.destinationState) {
        return {
          city: lastDeliveredLoad.destinationCity,
          state: lastDeliveredLoad.destinationState
        };
      }

      return null;
    } catch (error) {
      console.error(`[DatabaseStorage] Error getting truck last location for ${truckId}:`, error);
      return null;
    }
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }

  async getDriversByUser(userId: string): Promise<Driver[]> {
    // console.log(`[DatabaseStorage] Getting drivers for user: ${userId}`);
    return await db.select().from(drivers).where(eq(drivers.userId, userId));
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db
      .insert(drivers)
      .values(insertDriver)
      .returning();
    return newDriver;
  }

  async updateDriver(id: string, updateData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [updatedDriver] = await db
      .update(drivers)
      .set(updateData)
      .where(eq(drivers.id, id))
      .returning();
    return updatedDriver;
  }

  async deleteDriver(id: string): Promise<boolean> {
    try {
      // Check if driver exists first
      const existingDriver = await db.select().from(drivers).where(eq(drivers.id, id));
      if (existingDriver.length === 0) {
        return false;
      }
      
      // First, unassign this driver from any trucks
      await db
        .update(trucks)
        .set({ currentDriverId: null })
        .where(eq(trucks.currentDriverId, id));
      
      // Delete related HOS logs
      await db.delete(hosLogs).where(eq(hosLogs.driverId, id));
      
      // Delete related activities that reference this driver
      await db.delete(activities).where(eq(activities.relatedDriverId, id));
      
      // Delete related load plans
      const relatedLoadPlans = await db.select().from(loadPlans).where(eq(loadPlans.driverId, id));
      for (const plan of relatedLoadPlans) {
        // Delete associated legs first
        await db.delete(loadPlanLegs).where(eq(loadPlanLegs.loadPlanId, plan.id));
      }
      await db.delete(loadPlans).where(eq(loadPlans.driverId, id));
      
      // Finally, delete the driver itself
      const result = await db.delete(drivers).where(eq(drivers.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("[DatabaseStorage] Error deleting driver:", error);
      return false;
    }
  }

  // For simplicity, I'll implement the rest of the methods with basic functionality
  // In a production environment, you'd want to implement all methods properly

  async getLoads(): Promise<Load[]> {
    return await db.select().from(loads);
  }

  async getLoadsByUser(userId: string): Promise<Load[]> {
    // console.log(`[DatabaseStorage] Getting loads for user: ${userId}`);
    return await db.select().from(loads).where(eq(loads.userId, userId));
  }

  // Multi-user loads operation for system-wide functionality (alias methods)
  async getLoadsForUser(userId: string): Promise<Load[]> {
    return this.getLoadsByUser(userId);
  }

  async getDriversForUser(userId: string): Promise<Driver[]> {
    return this.getDriversByUser(userId);
  }

  async getLoad(id: string): Promise<Load | undefined> {
    const [load] = await db.select().from(loads).where(eq(loads.id, id));
    return load;
  }

  async getLoadsByTruck(truckId: string): Promise<Load[]> {
    return await db.select().from(loads).where(eq(loads.truckId, truckId));
  }

  async createLoad(insertLoad: InsertLoad): Promise<Load> {
    const [newLoad] = await db.insert(loads).values(insertLoad).returning();
    
    // Automatically update truck total miles when a load is attached
    if (newLoad.truckId) {
      await this.updateTruckTotalMiles(newLoad.truckId);
    }
    
    return newLoad;
  }

  async updateLoad(id: string, updateData: Partial<InsertLoad>): Promise<Load | undefined> {
    // Get the original load to check for truck changes
    const originalLoad = await this.getLoad(id);
    
    const [updatedLoad] = await db
      .update(loads)
      .set(updateData)
      .where(eq(loads.id, id))
      .returning();
    
    if (updatedLoad) {
      // Update truck miles for both old and new trucks (if truck assignment changed)
      const trucksToUpdate = new Set<string>();
      
      if (originalLoad?.truckId) {
        trucksToUpdate.add(originalLoad.truckId);
      }
      if (updatedLoad.truckId) {
        trucksToUpdate.add(updatedLoad.truckId);
      }
      
      // Update total miles for all affected trucks
      for (const truckId of Array.from(trucksToUpdate)) {
        await this.updateTruckTotalMiles(truckId);
      }
    }
    
    return updatedLoad;
  }

  async deleteLoad(id: string): Promise<boolean> {
    try {
      // Get the load before deletion to know which truck to update
      const loadToDelete = await this.getLoad(id);
      
      // Delete the load
      const result = await db.delete(loads).where(eq(loads.id, id));
      
      // Update truck total miles if the load was assigned to a truck
      if (loadToDelete?.truckId && result.rowCount > 0) {
        await this.updateTruckTotalMiles(loadToDelete.truckId);
      }
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("[DatabaseStorage] Error deleting load:", error);
      return false;
    }
  }

  async getHosLogs(driverId?: string, truckId?: string): Promise<HosLog[]> {
    let query = db.select().from(hosLogs);
    // Add filters if needed
    return await query;
  }

  async createHosLog(insertHosLog: InsertHosLog): Promise<HosLog> {
    const [newHosLog] = await db.insert(hosLogs).values(insertHosLog).returning();
    return newHosLog;
  }

  async updateHosLog(id: string, updateData: Partial<InsertHosLog>): Promise<HosLog | undefined> {
    const [updatedHosLog] = await db
      .update(hosLogs)
      .set(updateData)
      .where(eq(hosLogs.id, id))
      .returning();
    return updatedHosLog;
  }

  async getLatestHosStatus(driverId: string): Promise<HosLog | undefined> {
    const [latestLog] = await db
      .select()
      .from(hosLogs)
      .where(eq(hosLogs.driverId, driverId))
      .orderBy(desc(hosLogs.timestamp))
      .limit(1);
    return latestLog;
  }

  async getLoadBoardItems(): Promise<LoadBoardItem[]> {
    return await db.select().from(loadBoard);
  }

  async getAvailableLoads(equipmentType?: string, userId?: string): Promise<LoadBoardItem[]> {
    let query = db.select().from(loadBoard).where(eq(loadBoard.status, 'available'));
    
    if (equipmentType) {
      query = query.where(and(eq(loadBoard.status, 'available'), eq(loadBoard.equipmentType, equipmentType)));
    }
    
    return await query.orderBy(desc(loadBoard.ratePerMile));
  }

  async createLoadBoardItem(insertItem: InsertLoadBoard): Promise<LoadBoardItem> {
    const [newItem] = await db.insert(loadBoard).values(insertItem).returning();
    return newItem;
  }

  async updateLoadBoardStatus(id: string, status: string): Promise<LoadBoardItem | undefined> {
    const [updatedItem] = await db
      .update(loadBoard)
      .set({ status })
      .where(eq(loadBoard.id, id))
      .returning();
    return updatedItem;
  }

  async getFleetMetrics(fleetSize?: string): Promise<FleetMetrics[]> {
    return await db.select().from(fleetMetrics);
  }

  async createFleetMetrics(insertMetrics: InsertFleetMetrics): Promise<FleetMetrics> {
    const [newMetrics] = await db.insert(fleetMetrics).values(insertMetrics).returning();
    return newMetrics;
  }

  async getLatestFleetMetrics(): Promise<FleetMetrics | undefined> {
    const [latest] = await db
      .select()
      .from(fleetMetrics)
      .orderBy(desc(fleetMetrics.reportDate))
      .limit(1);
    return latest;
  }

  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(insertActivity).returning();
    return newActivity;
  }

  async getTruckCostBreakdowns(truckId: string): Promise<TruckCostBreakdown[]> {
    return await db.select().from(truckCostBreakdown).where(eq(truckCostBreakdown.truckId, truckId));
  }

  async getTruckCostBreakdownByWeek(truckId: string, weekStarting: Date): Promise<TruckCostBreakdown | undefined> {
    const [breakdown] = await db
      .select()
      .from(truckCostBreakdown)
      .where(eq(truckCostBreakdown.truckId, truckId));
    return breakdown;
  }

  async createTruckCostBreakdown(insertBreakdown: InsertTruckCostBreakdown): Promise<TruckCostBreakdown> {
    // Calculate total costs like MemStorage does
    const totalFixedCosts = (insertBreakdown.truckPayment ?? 0) +
      (insertBreakdown.trailerPayment ?? 0) +
      (insertBreakdown.elogSubscription ?? 0) +
      (insertBreakdown.liabilityInsurance ?? 0) +
      (insertBreakdown.physicalInsurance ?? 0) +
      (insertBreakdown.cargoInsurance ?? 0) +
      (insertBreakdown.trailerInterchange ?? 0) +
      (insertBreakdown.bobtailInsurance ?? 0) +
      (insertBreakdown.nonTruckingLiability ?? 0) +
      (insertBreakdown.basePlateDeduction ?? 0) +
      (insertBreakdown.companyPhone ?? 0);

    const totalVariableCosts = (insertBreakdown.driverPay ?? 0) +
      (insertBreakdown.fuel ?? 0) +
      (insertBreakdown.defFluid ?? 0) +
      (insertBreakdown.maintenance ?? 0) +
      (insertBreakdown.tolls ?? 0) +
      (insertBreakdown.dwellTime ?? 0) +
      (insertBreakdown.reeferFuel ?? 0) +
      (insertBreakdown.truckParking ?? 0);

    const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
    // Cost per mile based on 3000 miles standard for the week
    const costPerMile = totalWeeklyCosts / 3000;

    // Use the InsertTruckCostBreakdown type to ensure compatibility
    const validBreakdown: InsertTruckCostBreakdown = {
      truckId: insertBreakdown.truckId,
      truckPayment: insertBreakdown.truckPayment || 0,
      trailerPayment: insertBreakdown.trailerPayment || 0,
      elogSubscription: insertBreakdown.elogSubscription || 0,
      liabilityInsurance: insertBreakdown.liabilityInsurance || 0,
      physicalInsurance: insertBreakdown.physicalInsurance || 0,
      cargoInsurance: insertBreakdown.cargoInsurance || 0,
      trailerInterchange: insertBreakdown.trailerInterchange || 0,
      bobtailInsurance: insertBreakdown.bobtailInsurance || 0,
      nonTruckingLiability: insertBreakdown.nonTruckingLiability || 0,
      basePlateDeduction: insertBreakdown.basePlateDeduction || 0,
      companyPhone: insertBreakdown.companyPhone || 0,
      driverPay: insertBreakdown.driverPay || 0,
      fuel: insertBreakdown.fuel || 0,
      defFluid: insertBreakdown.defFluid || 0,
      maintenance: insertBreakdown.maintenance || 0,
      tolls: insertBreakdown.tolls || 0,
      dwellTime: insertBreakdown.dwellTime || 0,
      reeferFuel: insertBreakdown.reeferFuel || 0,
      truckParking: insertBreakdown.truckParking || 0,
      gallonsUsed: insertBreakdown.gallonsUsed || 0,
      avgFuelPrice: insertBreakdown.avgFuelPrice || 0,
      milesPerGallon: insertBreakdown.milesPerGallon || 0,
      totalFixedCosts,
      totalVariableCosts,
      totalWeeklyCosts,
      costPerMile,
      weekStarting: insertBreakdown.weekStarting,
      weekEnding: insertBreakdown.weekEnding,
      milesThisWeek: insertBreakdown.milesThisWeek || 0
    };

    console.log('[DatabaseStorage] Using raw SQL insert as fallback');
    
    // Use raw SQL since Drizzle ORM insert is failing
    const result = await db.execute(sql`
      INSERT INTO truck_cost_breakdown (
        id, truck_id, truck_payment, trailer_payment, elog_subscription,
        liability_insurance, physical_insurance, cargo_insurance, trailer_interchange,
        bobtail_insurance, non_trucking_liability, base_plate_deduction, company_phone,
        driver_pay, fuel, def_fluid, maintenance, tolls, dwell_time, reefer_fuel,
        truck_parking, gallons_used, avg_fuel_price, miles_per_gallon,
        total_fixed_costs, total_variable_costs, total_weekly_costs, cost_per_mile,
        week_starting, week_ending, miles_this_week, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${validBreakdown.truckId}, ${validBreakdown.truckPayment}, ${validBreakdown.trailerPayment}, ${validBreakdown.elogSubscription},
        ${validBreakdown.liabilityInsurance}, ${validBreakdown.physicalInsurance}, ${validBreakdown.cargoInsurance}, ${validBreakdown.trailerInterchange},
        ${validBreakdown.bobtailInsurance}, ${validBreakdown.nonTruckingLiability}, ${validBreakdown.basePlateDeduction}, ${validBreakdown.companyPhone},
        ${validBreakdown.driverPay}, ${validBreakdown.fuel}, ${validBreakdown.defFluid}, ${validBreakdown.maintenance}, ${validBreakdown.tolls}, ${validBreakdown.dwellTime}, ${validBreakdown.reeferFuel},
        ${validBreakdown.truckParking}, ${validBreakdown.gallonsUsed}, ${validBreakdown.avgFuelPrice}, ${validBreakdown.milesPerGallon},
        ${validBreakdown.totalFixedCosts}, ${validBreakdown.totalVariableCosts}, ${validBreakdown.totalWeeklyCosts}, ${validBreakdown.costPerMile},
        ${validBreakdown.weekStarting}, ${validBreakdown.weekEnding}, ${validBreakdown.milesThisWeek}, NOW(), NOW()
      )
      RETURNING *
    `);
    
    return result.rows[0] as TruckCostBreakdown;
  }

  async updateTruckCostBreakdown(id: string, updateData: Partial<InsertTruckCostBreakdown>): Promise<TruckCostBreakdown | undefined> {
    // First get the current breakdown
    const [currentBreakdown] = await db
      .select()
      .from(truckCostBreakdown)
      .where(eq(truckCostBreakdown.id, id));
    
    if (!currentBreakdown) return undefined;

    const updatedData = { ...currentBreakdown, ...updateData };

    // Recalculate totals with updated data
    const totalFixedCosts = (updatedData.truckPayment ?? 0) +
      (updatedData.trailerPayment ?? 0) +
      (updatedData.elogSubscription ?? 0) +
      (updatedData.liabilityInsurance ?? 0) +
      (updatedData.physicalInsurance ?? 0) +
      (updatedData.cargoInsurance ?? 0) +
      (updatedData.trailerInterchange ?? 0) +
      (updatedData.bobtailInsurance ?? 0) +
      (updatedData.nonTruckingLiability ?? 0) +
      (updatedData.basePlateDeduction ?? 0) +
      (updatedData.companyPhone ?? 0);

    const totalVariableCosts = (updatedData.driverPay ?? 0) +
      (updatedData.fuel ?? 0) +
      (updatedData.defFluid ?? 0) +
      (updatedData.maintenance ?? 0) +
      (updatedData.tolls ?? 0) +
      (updatedData.dwellTime ?? 0) +
      (updatedData.reeferFuel ?? 0) +
      (updatedData.truckParking ?? 0);

    const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
    // Use total miles with deadhead for accurate cost per mile calculation
    const totalMiles = (updatedData.totalMilesWithDeadhead ?? updatedData.milesThisWeek ?? 0);
    const costPerMile = totalMiles > 0 ? 
      Number((totalWeeklyCosts / totalMiles).toFixed(3)) : 0;

    // Update with recalculated totals
    const [updatedBreakdown] = await db
      .update(truckCostBreakdown)
      .set({
        ...updateData,
        totalFixedCosts,
        totalVariableCosts,
        totalWeeklyCosts,
        costPerMile,
        updatedAt: new Date()
      })
      .where(eq(truckCostBreakdown.id, id))
      .returning();
    
    return updatedBreakdown;
  }

  async deleteTruckCostBreakdown(id: string): Promise<boolean> {
    const result = await db.delete(truckCostBreakdown).where(eq(truckCostBreakdown.id, id));
    return result.rowCount > 0;
  }

  async getLatestTruckCostBreakdown(truckId: string): Promise<TruckCostBreakdown | undefined> {
    const [latest] = await db
      .select()
      .from(truckCostBreakdown)
      .where(eq(truckCostBreakdown.truckId, truckId))
      .orderBy(desc(truckCostBreakdown.createdAt))
      .limit(1);
    return latest;
  }

  async getLoadPlans(truckId?: string, driverId?: string): Promise<LoadPlan[]> {
    return await db.select().from(loadPlans);
  }

  async getLoadPlan(id: string): Promise<LoadPlan | undefined> {
    const [plan] = await db.select().from(loadPlans).where(eq(loadPlans.id, id));
    return plan;
  }

  async createLoadPlan(insertPlan: InsertLoadPlan): Promise<LoadPlan> {
    const [newPlan] = await db.insert(loadPlans).values(insertPlan).returning();
    return newPlan;
  }

  async updateLoadPlan(id: string, updateData: Partial<InsertLoadPlan>): Promise<LoadPlan | undefined> {
    const [updatedPlan] = await db
      .update(loadPlans)
      .set(updateData)
      .where(eq(loadPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteLoadPlan(id: string): Promise<boolean> {
    const result = await db.delete(loadPlans).where(eq(loadPlans.id, id));
    return result.rowCount > 0;
  }

  async getLoadPlanLegs(loadPlanId: string): Promise<LoadPlanLeg[]> {
    return await db.select().from(loadPlanLegs).where(eq(loadPlanLegs.loadPlanId, loadPlanId));
  }

  async createLoadPlanLeg(insertLeg: InsertLoadPlanLeg): Promise<LoadPlanLeg> {
    const [newLeg] = await db.insert(loadPlanLegs).values(insertLeg).returning();
    return newLeg;
  }

  async updateLoadPlanLeg(id: string, updateData: Partial<InsertLoadPlanLeg>): Promise<LoadPlanLeg | undefined> {
    const [updatedLeg] = await db
      .update(loadPlanLegs)
      .set(updateData)
      .where(eq(loadPlanLegs.id, id))
      .returning();
    return updatedLeg;
  }

  async deleteLoadPlanLeg(id: string): Promise<boolean> {
    const result = await db.delete(loadPlanLegs).where(eq(loadPlanLegs.id, id));
    return result.rowCount > 0;
  }

  // Fuel Purchase methods
  async getFuelPurchases(loadId?: string, truckId?: string): Promise<FuelPurchase[]> {
    if (loadId && truckId) {
      return await db.select().from(fuelPurchases)
        .where(and(eq(fuelPurchases.loadId, loadId), eq(fuelPurchases.truckId, truckId)))
        .orderBy(desc(fuelPurchases.purchaseDate));
    } else if (loadId) {
      return await db.select().from(fuelPurchases)
        .where(eq(fuelPurchases.loadId, loadId))
        .orderBy(desc(fuelPurchases.purchaseDate));
    } else if (truckId) {
      return await db.select().from(fuelPurchases)
        .where(eq(fuelPurchases.truckId, truckId))
        .orderBy(desc(fuelPurchases.purchaseDate));
    }
    
    return await db.select().from(fuelPurchases)
      .orderBy(desc(fuelPurchases.purchaseDate));
  }

  async getFuelPurchasesByUser(userId: string, loadId?: string, truckId?: string): Promise<FuelPurchase[]> {
    // Get all trucks owned by this user first
    const userTrucks = await db.select().from(trucks).where(eq(trucks.userId, userId));
    const userTruckIds = userTrucks.map(truck => truck.id);
    
    if (userTruckIds.length === 0) {
      return []; // User has no trucks, so no fuel purchases
    }
    
    // Build conditions for filtering fuel purchases
    let conditions = [inArray(fuelPurchases.truckId, userTruckIds)];
    
    if (loadId) {
      conditions.push(eq(fuelPurchases.loadId, loadId));
    }
    
    if (truckId) {
      conditions.push(eq(fuelPurchases.truckId, truckId));
    }
    
    // Filter fuel purchases to only those associated with user's trucks
    return await db.select().from(fuelPurchases)
      .where(and(...conditions))
      .orderBy(desc(fuelPurchases.purchaseDate));
  }

  async createFuelPurchase(insertPurchase: InsertFuelPurchase): Promise<FuelPurchase> {
    const [newPurchase] = await db
      .insert(fuelPurchases)
      .values(insertPurchase)
      .returning();
    
    // Update load's actual fuel costs if loadId is provided
    if (insertPurchase.loadId) {
      await this.updateLoadFuelCosts(insertPurchase.loadId);
      
      // Also update truck total miles when fuel is attached to a load
      const [load] = await db.select().from(loads).where(eq(loads.id, insertPurchase.loadId));
      if (load && load.truckId) {
        await this.updateTruckTotalMiles(load.truckId);
      }
    }
    
    // If fuel purchase is directly associated with a truck (without load), still update truck miles
    if (insertPurchase.truckId && !insertPurchase.loadId) {
      await this.updateTruckTotalMiles(insertPurchase.truckId);
    }
    
    return newPurchase;
  }

  async updateFuelPurchase(id: string, updateData: Partial<InsertFuelPurchase>): Promise<FuelPurchase | undefined> {
    // Get the original purchase to track truck changes
    const [originalPurchase] = await db.select().from(fuelPurchases).where(eq(fuelPurchases.id, id));
    
    const [updatedPurchase] = await db
      .update(fuelPurchases)
      .set(updateData)
      .where(eq(fuelPurchases.id, id))
      .returning();
    
    if (!updatedPurchase) return undefined;
    
    // Update load's actual fuel costs if loadId exists
    if (updatedPurchase.loadId) {
      await this.updateLoadFuelCosts(updatedPurchase.loadId);
      
      // Update truck total miles when fuel is attached to a load
      const [load] = await db.select().from(loads).where(eq(loads.id, updatedPurchase.loadId));
      if (load && load.truckId) {
        await this.updateTruckTotalMiles(load.truckId);
      }
    }
    
    // Handle truck reassignments - update both old and new trucks
    const trucksToUpdate = new Set<string>();
    
    if (originalPurchase?.truckId) {
      trucksToUpdate.add(originalPurchase.truckId);
    }
    if (updatedPurchase.truckId) {
      trucksToUpdate.add(updatedPurchase.truckId);
    }
    
    // Update total miles for all affected trucks
    for (const truckId of Array.from(trucksToUpdate)) {
      await this.updateTruckTotalMiles(truckId);
    }
    
    return updatedPurchase;
  }

  async deleteFuelPurchase(id: string): Promise<boolean> {
    // Get the purchase first to know which load and truck to update
    const [purchase] = await db.select().from(fuelPurchases).where(eq(fuelPurchases.id, id));
    
    const result = await db.delete(fuelPurchases).where(eq(fuelPurchases.id, id));
    
    // Update load's actual fuel costs if purchase existed and had a loadId
    if (purchase && purchase.loadId) {
      await this.updateLoadFuelCosts(purchase.loadId);
      
      // Update truck total miles when fuel is detached from a load
      const [load] = await db.select().from(loads).where(eq(loads.id, purchase.loadId));
      if (load && load.truckId) {
        await this.updateTruckTotalMiles(load.truckId);
      }
    }
    
    // Update truck total miles if fuel purchase was directly associated with a truck
    if (purchase && purchase.truckId) {
      await this.updateTruckTotalMiles(purchase.truckId);
    }
    
    return result.rowCount > 0;
  }

  async updateLoadFuelCosts(loadId: string): Promise<Load | undefined> {
    // Get all fuel purchases for this load
    const purchases = await this.getFuelPurchases(loadId);
    
    // Calculate totals separated by fuel type
    const dieselPurchases = purchases.filter(p => p.fuelType === 'diesel');
    const defPurchases = purchases.filter(p => p.fuelType === 'def');
    
    const totalCost = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalGallons = purchases.reduce((sum, purchase) => sum + purchase.gallons, 0);
    
    // Get the load to calculate cost per mile
    const [load] = await db.select().from(loads).where(eq(loads.id, loadId));
    if (!load) return undefined;
    
    // Calculate actual cost per mile including fuel
    const fuelCostPerMile = load.miles > 0 ? totalCost / load.miles : 0;
    
    // Update load with actual fuel costs
    const [updatedLoad] = await db
      .update(loads)
      .set({
        actualFuelCost: totalCost,
        actualGallons: totalGallons,
        actualCostPerMile: Number(fuelCostPerMile.toFixed(3))
      })
      .where(eq(loads.id, loadId))
      .returning();
    
    // Update weekly fuel costs in truck cost breakdown if truck is assigned
    if (load.truckId) {
      await this.updateWeeklyFuelCosts(load.truckId, dieselPurchases, defPurchases);
    }
    
    return updatedLoad;
  }

  // Update weekly fuel costs in truck cost breakdown (Database version)
  private async updateWeeklyFuelCosts(truckId: string, dieselPurchases: FuelPurchase[], defPurchases: FuelPurchase[]): Promise<void> {
    // Calculate weekly costs by fuel type
    const dieselCost = dieselPurchases.reduce((sum, p) => sum + p.totalCost, 0);
    const defCost = defPurchases.reduce((sum, p) => sum + p.totalCost, 0);
    
    // Get current week's cost breakdown
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const currentBreakdown = await this.getTruckCostBreakdownByWeek(truckId, startOfWeek);
    
    if (currentBreakdown) {
      // Update existing breakdown with new fuel costs
      await this.updateTruckCostBreakdown(currentBreakdown.id, {
        fuel: dieselCost,
        defFluid: defCost
      });
    }
  }

  // Load Stops methods
  async getLoadStops(loadId: string): Promise<LoadStop[]> {
    return await db
      .select()
      .from(loadStops)
      .where(eq(loadStops.loadId, loadId))
      .orderBy(loadStops.id);
  }

  async createLoadStop(insertStop: InsertLoadStop): Promise<LoadStop> {
    const [newStop] = await db.insert(loadStops).values(insertStop).returning();
    return newStop;
  }

  async updateLoadStop(id: string, updateData: Partial<InsertLoadStop>): Promise<LoadStop | undefined> {
    const [updatedStop] = await db
      .update(loadStops)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(loadStops.id, id))
      .returning();
    return updatedStop;
  }

  async deleteLoadStop(id: string): Promise<boolean> {
    const result = await db.delete(loadStops).where(eq(loadStops.id, id));
    return result.rowCount > 0;
  }

  async deleteLoadStops(loadId: string): Promise<boolean> {
    const result = await db.delete(loadStops).where(eq(loadStops.loadId, loadId));
    return result.rowCount > 0;
  }

  // Analytics methods that were missing from DatabaseStorage

  async trackDataInput(data: InsertDataInputTracking): Promise<DataInputTracking> {
    const [tracking] = await db.insert(dataInputTracking).values(data).returning();
    return tracking;
  }

  async trackFeatureUsage(data: InsertFeatureAnalytics): Promise<FeatureAnalytics> {
    const [feature] = await db.insert(featureAnalytics).values(data).returning();
    return feature;
  }

  async trackUserSession(data: InsertUserAnalytics): Promise<UserAnalytics> {
    const [session] = await db.insert(userAnalytics).values(data).returning();
    return session;
  }

  async recordSystemMetrics(data: InsertSystemMetrics): Promise<SystemMetrics> {
    const [metrics] = await db.insert(systemMetrics).values(data).returning();
    return metrics;
  }

  // Privacy-controlled User Analytics Methods
  async getUserAnalytics(userId: string): Promise<UserAnalytics | undefined> {
    const [result] = await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId)).limit(1);
    return result;
  }

  async getAllUserAnalytics(): Promise<UserAnalytics[]> {
    // This method should only be called by founder-level users
    const result = await db.select().from(userAnalytics).orderBy(desc(userAnalytics.updatedAt));
    return result;
  }

  async createUserAnalytics(data: InsertUserAnalytics): Promise<UserAnalytics> {
    const [result] = await db.insert(userAnalytics).values(data).returning();
    return result;
  }

  async updateUserAnalytics(id: string, data: Partial<UserAnalytics>): Promise<UserAnalytics | undefined> {
    const [result] = await db
      .update(userAnalytics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userAnalytics.id, id))
      .returning();
    return result;
  }

  async getUserFeatureUsage(userId: string): Promise<FeatureAnalytics[]> {
    return await db.select().from(featureAnalytics).where(eq(featureAnalytics.userId, userId));
  }

  async getUserDataInputs(userId: string): Promise<DataInputTracking[]> {
    return await db.select().from(dataInputTracking).where(eq(dataInputTracking.userId, userId));
  }

  async getLatestSystemMetrics(): Promise<SystemMetrics | undefined> {
    const [metrics] = await db.select().from(systemMetrics).orderBy(desc(systemMetrics.metricDate)).limit(1);
    return metrics;
  }

  async getTopFeatures(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT feature_name, COUNT(*) as usage_count 
      FROM feature_analytics 
      GROUP BY feature_name 
      ORDER BY usage_count DESC 
      LIMIT 10
    `);
    return result.rows;
  }

  async getDataInputTrends(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        input_type,
        COUNT(*) as count
      FROM data_input_tracking 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), input_type
      ORDER BY date DESC, count DESC
    `);
    return result.rows;
  }

  async getBusinessImpactMetrics(): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        business_function,
        COUNT(*) as total_actions,
        AVG(CASE WHEN successful = 1 THEN 1 ELSE 0 END) as success_rate,
        SUM(value_generated) as total_value,
        SUM(efficiency_gain) as total_efficiency_gain
      FROM feature_analytics 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY business_function
    `);
    return result.rows;
  }

  async getActiveUsersCount(fromDate: Date): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_analytics 
      WHERE session_start_time >= ${fromDate}
    `);
    return (result.rows[0] as any)?.count || 0;
  }

  async getDataInputsCount(fromDate: Date): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM data_input_tracking 
      WHERE created_at >= ${fromDate}
    `);
    return (result.rows[0] as any)?.count || 0;
  }

  async getFeaturesUsedCount(fromDate: Date): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT feature_name) as count
      FROM feature_analytics 
      WHERE created_at >= ${fromDate}
    `);
    return (result.rows[0] as any)?.count || 0;
  }

  async getSystemHealthScore(): Promise<number> {
    const result = await db.execute(sql`
      SELECT 
        AVG(CASE WHEN successful = 1 THEN 1 ELSE 0 END) * 100 as health_score
      FROM feature_analytics 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    return (result.rows[0] as any)?.health_score || 100;
  }
}

// Switch to using DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
