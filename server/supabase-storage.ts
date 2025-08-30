import { supabase, supabaseAdmin } from './supabase';
import type { 
  User, UpsertUser, 
  Truck, InsertTruck, 
  Load, InsertLoad, 
  LoadStop, InsertLoadStop,
  Activity, InsertActivity,
  Driver, InsertDriver,
  HosLog, InsertHosLog,
  LoadBoardItem, InsertLoadBoard,
  FleetMetrics, InsertFleetMetrics,
  TruckCostBreakdown, InsertTruckCostBreakdown,
  LoadPlan, InsertLoadPlan,
  LoadPlanLeg, InsertLoadPlanLeg,
  FuelPurchase, InsertFuelPurchase,
  UserAnalytics, InsertUserAnalytics,
  DataInputTracking, InsertDataInputTracking,
  SystemMetrics, InsertSystemMetrics,
  FeatureAnalytics, InsertFeatureAnalytics,
  UserSession, InsertUserSession,
  SessionAuditLog, InsertSessionAuditLog
} from "@shared/schema";

export interface ISupabaseStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updateData: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Multi-user fleet operations
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
  
  // Load Stops
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
  getFleetMetrics(userId?: string): Promise<FleetMetrics[]>;
  createFleetMetrics(metrics: InsertFleetMetrics): Promise<FleetMetrics>;
  updateFleetMetrics(id: string, metrics: Partial<InsertFleetMetrics>): Promise<FleetMetrics | undefined>;
  
  // Truck Cost Breakdown
  getTruckCostBreakdown(truckId?: string): Promise<TruckCostBreakdown[]>;
  createTruckCostBreakdown(costBreakdown: InsertTruckCostBreakdown): Promise<TruckCostBreakdown>;
  updateTruckCostBreakdown(id: string, costBreakdown: Partial<InsertTruckCostBreakdown>): Promise<TruckCostBreakdown | undefined>;
  
  // Load Plans
  getLoadPlans(userId?: string): Promise<LoadPlan[]>;
  createLoadPlan(plan: InsertLoadPlan): Promise<LoadPlan>;
  updateLoadPlan(id: string, plan: Partial<InsertLoadPlan>): Promise<LoadPlan | undefined>;
  deleteLoadPlan(id: string): Promise<boolean>;
  
  // Load Plan Legs
  getLoadPlanLegs(planId: string): Promise<LoadPlanLeg[]>;
  createLoadPlanLeg(leg: InsertLoadPlanLeg): Promise<LoadPlanLeg>;
  updateLoadPlanLeg(id: string, leg: Partial<InsertLoadPlanLeg>): Promise<LoadPlanLeg | undefined>;
  deleteLoadPlanLeg(id: string): Promise<boolean>;
  
  // Fuel Purchases
  getFuelPurchases(truckId?: string): Promise<FuelPurchase[]>;
  createFuelPurchase(purchase: InsertFuelPurchase): Promise<FuelPurchase>;
  updateFuelPurchase(id: string, purchase: Partial<InsertFuelPurchase>): Promise<FuelPurchase | undefined>;
  deleteFuelPurchase(id: string): Promise<boolean>;
  
  // Activities
  getActivities(userId?: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;
  
  // Analytics
  getUserAnalytics(userId?: string): Promise<UserAnalytics[]>;
  createUserAnalytics(analytics: InsertUserAnalytics): Promise<UserAnalytics>;
  updateUserAnalytics(id: string, analytics: Partial<InsertUserAnalytics>): Promise<UserAnalytics | undefined>;
  
  // Data Input Tracking
  getDataInputTracking(userId?: string): Promise<DataInputTracking[]>;
  createDataInputTracking(tracking: InsertDataInputTracking): Promise<DataInputTracking>;
  
  // System Metrics
  getSystemMetrics(): Promise<SystemMetrics[]>;
  createSystemMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics>;
  
  // Feature Analytics
  getFeatureAnalytics(): Promise<FeatureAnalytics[]>;
  createFeatureAnalytics(analytics: InsertFeatureAnalytics): Promise<FeatureAnalytics>;
}

class SupabaseStorage implements ISupabaseStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
    
    return data as User;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error getting all users:', error);
      return [];
    }
    
    return data as User[] || [];
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert(user)
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting user:', error);
      throw new Error(`Failed to upsert user: ${error.message}`);
    }
    
    return data as User;
  }

  async updateUser(id: string, updateData: Partial<UpsertUser>): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
    
    return data as User;
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }
    
    return true;
  }

  // Multi-user fleet operations
  async getTrucksForUser(userId: string): Promise<Truck[]> {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting trucks for user:', error);
      return [];
    }
    
    return data as Truck[] || [];
  }

  async getLoadsForUser(userId: string): Promise<Load[]> {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting loads for user:', error);
      return [];
    }
    
    return data as Load[] || [];
  }

  async getDriversForUser(userId: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting drivers for user:', error);
      return [];
    }
    
    return data as Driver[] || [];
  }

  // Session management operations
  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user session:', error);
      throw new Error(`Failed to create user session: ${error.message}`);
    }
    
    return data as UserSession;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('Error getting user session:', error);
      return undefined;
    }
    
    return data as UserSession;
  }

  async getUserSessionByToken(sessionToken: string): Promise<UserSession | undefined> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();
    
    if (error) {
      console.error('Error getting user session by token:', error);
      return undefined;
    }
    
    return data as UserSession;
  }

  async updateUserSession(sessionId: string, updates: Partial<UserSession>): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update(updates)
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error updating user session:', error);
      throw new Error(`Failed to update user session: ${error.message}`);
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
    
    return data as UserSession[] || [];
  }

  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', 1);
    
    if (error) {
      console.error('Error getting user active sessions:', error);
      return [];
    }
    
    return data as UserSession[] || [];
  }

  async getExpiredSessions(): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .lt('expires_at', new Date().toISOString());
    
    if (error) {
      console.error('Error getting expired sessions:', error);
      return [];
    }
    
    return data as UserSession[] || [];
  }

  async createSessionAuditLog(logData: InsertSessionAuditLog): Promise<SessionAuditLog> {
    const { data, error } = await supabase
      .from('session_audit_logs')
      .insert(logData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session audit log:', error);
      throw new Error(`Failed to create session audit log: ${error.message}`);
    }
    
    return data as SessionAuditLog;
  }

  async getSessionAuditLogs(userId: string, limit: number = 100): Promise<SessionAuditLog[]> {
    const { data, error } = await supabase
      .from('session_audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error getting session audit logs:', error);
      return [];
    }
    
    return data as SessionAuditLog[] || [];
  }

  async getSessionStatistics(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    recentLogins: number;
    averageSessionDuration: number;
  }> {
    // Get total active sessions
    const { count: activeSessions } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', 1);
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get recent logins (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: recentLogins } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());
    
    // Calculate average session duration (simplified)
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('created_at, expires_at')
      .not('expires_at', 'is', null);
    
    let totalDuration = 0;
    let validSessions = 0;
    
    if (sessions) {
      sessions.forEach(session => {
        if (session.created_at && session.expires_at) {
          const duration = new Date(session.expires_at).getTime() - new Date(session.created_at).getTime();
          totalDuration += duration;
          validSessions++;
        }
      });
    }
    
    const averageSessionDuration = validSessions > 0 ? totalDuration / validSessions : 0;
    
    return {
      totalActiveSessions: activeSessions || 0,
      totalUsers: totalUsers || 0,
      recentLogins: recentLogins || 0,
      averageSessionDuration
    };
  }

  // Trucks
  async getTrucks(): Promise<Truck[]> {
    const { data, error } = await supabase
      .from('trucks')
      .select('*');
    
    if (error) {
      console.error('Error getting trucks:', error);
      return [];
    }
    
    return data as Truck[] || [];
  }

  async getTrucksByUser(userId: string): Promise<Truck[]> {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting trucks by user:', error);
      return [];
    }
    
    return data as Truck[] || [];
  }

  async getTruck(id: string): Promise<Truck | undefined> {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error getting truck:', error);
      return undefined;
    }
    
    return data as Truck;
  }

  async createTruck(truck: InsertTruck): Promise<Truck> {
    const { data, error } = await supabase
      .from('trucks')
      .insert(truck)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating truck:', error);
      throw new Error(`Failed to create truck: ${error.message}`);
    }
    
    return data as Truck;
  }

  async updateTruck(id: string, truck: Partial<InsertTruck>): Promise<Truck | undefined> {
    const { data, error } = await supabase
      .from('trucks')
      .update(truck)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating truck:', error);
      return undefined;
    }
    
    return data as Truck;
  }

  async deleteTruck(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('trucks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting truck:', error);
      return false;
    }
    
    return true;
  }

  // Loads
  async getLoads(): Promise<Load[]> {
    const { data, error } = await supabase
      .from('loads')
      .select('*');
    
    if (error) {
      console.error('Error getting loads:', error);
      return [];
    }
    
    return data as Load[] || [];
  }

  async getLoadsByUser(userId: string): Promise<Load[]> {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting loads by user:', error);
      return [];
    }
    
    return data as Load[] || [];
  }

  async getLoad(id: string): Promise<Load | undefined> {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error getting load:', error);
      return undefined;
    }
    
    return data as Load;
  }

  async getLoadsByTruck(truckId: string): Promise<Load[]> {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .eq('truck_id', truckId);
    
    if (error) {
      console.error('Error getting loads by truck:', error);
      return [];
    }
    
    return data as Load[] || [];
  }

  async createLoad(load: InsertLoad): Promise<Load> {
    const { data, error } = await supabase
      .from('loads')
      .insert(load)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating load:', error);
      throw new Error(`Failed to create load: ${error.message}`);
    }
    
    return data as Load;
  }

  async updateLoad(id: string, load: Partial<InsertLoad>): Promise<Load | undefined> {
    const { data, error } = await supabase
      .from('loads')
      .update(load)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating load:', error);
      return undefined;
    }
    
    return data as Load;
  }

  async deleteLoad(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('loads')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting load:', error);
      return false;
    }
    
    return true;
  }

  // Load Stops
  async getLoadStops(loadId: string): Promise<LoadStop[]> {
    const { data, error } = await supabase
      .from('load_stops')
      .select('*')
      .eq('load_id', loadId);
    
    if (error) {
      console.error('Error getting load stops:', error);
      return [];
    }
    
    return data as LoadStop[] || [];
  }

  async createLoadStop(stop: InsertLoadStop): Promise<LoadStop> {
    const { data, error } = await supabase
      .from('load_stops')
      .insert(stop)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating load stop:', error);
      throw new Error(`Failed to create load stop: ${error.message}`);
    }
    
    return data as LoadStop;
  }

  async updateLoadStop(id: string, stop: Partial<InsertLoadStop>): Promise<LoadStop | undefined> {
    const { data, error } = await supabase
      .from('load_stops')
      .update(stop)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating load stop:', error);
      return undefined;
    }
    
    return data as LoadStop;
  }

  async deleteLoadStop(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('load_stops')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting load stop:', error);
      return false;
    }
    
    return true;
  }

  async deleteLoadStops(loadId: string): Promise<boolean> {
    const { error } = await supabase
      .from('load_stops')
      .delete()
      .eq('load_id', loadId);
    
    if (error) {
      console.error('Error deleting load stops:', error);
      return false;
    }
    
    return true;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*');
    
    if (error) {
      console.error('Error getting drivers:', error);
      return [];
    }
    
    return data as Driver[] || [];
  }

  async getDriversByUser(userId: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting drivers by user:', error);
      return [];
    }
    
    return data as Driver[] || [];
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error getting driver:', error);
      return undefined;
    }
    
    return data as Driver;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driver)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating driver:', error);
      throw new Error(`Failed to create driver: ${error.message}`);
    }
    
    return data as Driver;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined> {
    const { data, error } = await supabase
      .from('drivers')
      .update(driver)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating driver:', error);
      return undefined;
    }
    
    return data as Driver;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting driver:', error);
      return false;
    }
    
    return true;
  }

  // HOS Logs
  async getHosLogs(driverId?: string, truckId?: string): Promise<HosLog[]> {
    let query = supabase.from('hos_logs').select('*');
    
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    
    if (truckId) {
      query = query.eq('truck_id', truckId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting HOS logs:', error);
      return [];
    }
    
    return data as HosLog[] || [];
  }

  async createHosLog(hosLog: InsertHosLog): Promise<HosLog> {
    const { data, error } = await supabase
      .from('hos_logs')
      .insert(hosLog)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating HOS log:', error);
      throw new Error(`Failed to create HOS log: ${error.message}`);
    }
    
    return data as HosLog;
  }

  async updateHosLog(id: string, hosLog: Partial<InsertHosLog>): Promise<HosLog | undefined> {
    const { data, error } = await supabase
      .from('hos_logs')
      .update(hosLog)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating HOS log:', error);
      return undefined;
    }
    
    return data as HosLog;
  }

  async getLatestHosStatus(driverId: string): Promise<HosLog | undefined> {
    const { data, error } = await supabase
      .from('hos_logs')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error getting latest HOS status:', error);
      return undefined;
    }
    
    return data as HosLog;
  }

  // Load Board
  async getLoadBoardItems(): Promise<LoadBoardItem[]> {
    const { data, error } = await supabase
      .from('load_board')
      .select('*');
    
    if (error) {
      console.error('Error getting load board items:', error);
      return [];
    }
    
    return data as LoadBoardItem[] || [];
  }

  async getAvailableLoads(equipmentType?: string, userId?: string): Promise<LoadBoardItem[]> {
    let query = supabase.from('load_board').select('*').eq('status', 'available');
    
    if (equipmentType) {
      query = query.eq('equipment_type', equipmentType);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting available loads:', error);
      return [];
    }
    
    return data as LoadBoardItem[] || [];
  }

  async createLoadBoardItem(item: InsertLoadBoard): Promise<LoadBoardItem> {
    const { data, error } = await supabase
      .from('load_board')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating load board item:', error);
      throw new Error(`Failed to create load board item: ${error.message}`);
    }
    
    return data as LoadBoardItem;
  }

  async updateLoadBoardStatus(id: string, status: string): Promise<LoadBoardItem | undefined> {
    const { data, error } = await supabase
      .from('load_board')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating load board status:', error);
      return undefined;
    }
    
    return data as LoadBoardItem;
  }

  // Fleet Metrics
  async getFleetMetrics(userId?: string): Promise<FleetMetrics[]> {
    let query = supabase.from('fleet_metrics').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting fleet metrics:', error);
      return [];
    }
    
    return data as FleetMetrics[] || [];
  }

  async createFleetMetrics(metrics: InsertFleetMetrics): Promise<FleetMetrics> {
    const { data, error } = await supabase
      .from('fleet_metrics')
      .insert(metrics)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating fleet metrics:', error);
      throw new Error(`Failed to create fleet metrics: ${error.message}`);
    }
    
    return data as FleetMetrics;
  }

  async updateFleetMetrics(id: string, metrics: Partial<InsertFleetMetrics>): Promise<FleetMetrics | undefined> {
    const { data, error } = await supabase
      .from('fleet_metrics')
      .update(metrics)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating fleet metrics:', error);
      return undefined;
    }
    
    return data as FleetMetrics;
  }

  // Truck Cost Breakdown
  async getTruckCostBreakdown(truckId?: string): Promise<TruckCostBreakdown[]> {
    let query = supabase.from('truck_cost_breakdown').select('*');
    
    if (truckId) {
      query = query.eq('truck_id', truckId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting truck cost breakdown:', error);
      return [];
    }
    
    return data as TruckCostBreakdown[] || [];
  }

  async createTruckCostBreakdown(costBreakdown: InsertTruckCostBreakdown): Promise<TruckCostBreakdown> {
    const { data, error } = await supabase
      .from('truck_cost_breakdown')
      .insert(costBreakdown)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating truck cost breakdown:', error);
      throw new Error(`Failed to create truck cost breakdown: ${error.message}`);
    }
    
    return data as TruckCostBreakdown;
  }

  async updateTruckCostBreakdown(id: string, costBreakdown: Partial<InsertTruckCostBreakdown>): Promise<TruckCostBreakdown | undefined> {
    const { data, error } = await supabase
      .from('truck_cost_breakdown')
      .update(costBreakdown)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating truck cost breakdown:', error);
      return undefined;
    }
    
    return data as TruckCostBreakdown;
  }

  // Load Plans
  async getLoadPlans(userId?: string): Promise<LoadPlan[]> {
    let query = supabase.from('load_plans').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting load plans:', error);
      return [];
    }
    
    return data as LoadPlan[] || [];
  }

  async createLoadPlan(plan: InsertLoadPlan): Promise<LoadPlan> {
    const { data, error } = await supabase
      .from('load_plans')
      .insert(plan)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating load plan:', error);
      throw new Error(`Failed to create load plan: ${error.message}`);
    }
    
    return data as LoadPlan;
  }

  async updateLoadPlan(id: string, plan: Partial<InsertLoadPlan>): Promise<LoadPlan | undefined> {
    const { data, error } = await supabase
      .from('load_plans')
      .update(plan)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating load plan:', error);
      return undefined;
    }
    
    return data as LoadPlan;
  }

  async deleteLoadPlan(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('load_plans')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting load plan:', error);
      return false;
    }
    
    return true;
  }

  // Load Plan Legs
  async getLoadPlanLegs(planId: string): Promise<LoadPlanLeg[]> {
    const { data, error } = await supabase
      .from('load_plan_legs')
      .select('*')
      .eq('plan_id', planId);
    
    if (error) {
      console.error('Error getting load plan legs:', error);
      return [];
    }
    
    return data as LoadPlanLeg[] || [];
  }

  async createLoadPlanLeg(leg: InsertLoadPlanLeg): Promise<LoadPlanLeg> {
    const { data, error } = await supabase
      .from('load_plan_legs')
      .insert(leg)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating load plan leg:', error);
      throw new Error(`Failed to create load plan leg: ${error.message}`);
    }
    
    return data as LoadPlanLeg;
  }

  async updateLoadPlanLeg(id: string, leg: Partial<InsertLoadPlanLeg>): Promise<LoadPlanLeg | undefined> {
    const { data, error } = await supabase
      .from('load_plan_legs')
      .update(leg)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating load plan leg:', error);
      return undefined;
    }
    
    return data as LoadPlanLeg;
  }

  async deleteLoadPlanLeg(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('load_plan_legs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting load plan leg:', error);
      return false;
    }
    
    return true;
  }

  // Fuel Purchases
  async getFuelPurchases(truckId?: string): Promise<FuelPurchase[]> {
    let query = supabase.from('fuel_purchases').select('*');
    
    if (truckId) {
      query = query.eq('truck_id', truckId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting fuel purchases:', error);
      return [];
    }
    
    return data as FuelPurchase[] || [];
  }

  async createFuelPurchase(purchase: InsertFuelPurchase): Promise<FuelPurchase> {
    const { data, error } = await supabase
      .from('fuel_purchases')
      .insert(purchase)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating fuel purchase:', error);
      throw new Error(`Failed to create fuel purchase: ${error.message}`);
    }
    
    return data as FuelPurchase;
  }

  async updateFuelPurchase(id: string, purchase: Partial<InsertFuelPurchase>): Promise<FuelPurchase | undefined> {
    const { data, error } = await supabase
      .from('fuel_purchases')
      .update(purchase)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating fuel purchase:', error);
      return undefined;
    }
    
    return data as FuelPurchase;
  }

  async deleteFuelPurchase(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('fuel_purchases')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting fuel purchase:', error);
      return false;
    }
    
    return true;
  }

  // Activities
  async getActivities(userId?: string): Promise<Activity[]> {
    let query = supabase.from('activities').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting activities:', error);
      return [];
    }
    
    return data as Activity[] || [];
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating activity:', error);
      throw new Error(`Failed to create activity: ${error.message}`);
    }
    
    return data as Activity;
  }

  async updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const { data, error } = await supabase
      .from('activities')
      .update(activity)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating activity:', error);
      return undefined;
    }
    
    return data as Activity;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting activity:', error);
      return false;
    }
    
    return true;
  }

  // Analytics
  async getUserAnalytics(userId?: string): Promise<UserAnalytics[]> {
    let query = supabase.from('user_analytics').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting user analytics:', error);
      return [];
    }
    
    return data as UserAnalytics[] || [];
  }

  async createUserAnalytics(analytics: InsertUserAnalytics): Promise<UserAnalytics> {
    const { data, error } = await supabase
      .from('user_analytics')
      .insert(analytics)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user analytics:', error);
      throw new Error(`Failed to create user analytics: ${error.message}`);
    }
    
    return data as UserAnalytics;
  }

  async updateUserAnalytics(id: string, analytics: Partial<InsertUserAnalytics>): Promise<UserAnalytics | undefined> {
    const { data, error } = await supabase
      .from('user_analytics')
      .update(analytics)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user analytics:', error);
      return undefined;
    }
    
    return data as UserAnalytics;
  }

  // Data Input Tracking
  async getDataInputTracking(userId?: string): Promise<DataInputTracking[]> {
    let query = supabase.from('data_input_tracking').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting data input tracking:', error);
      return [];
    }
    
    return data as DataInputTracking[] || [];
  }

  async createDataInputTracking(tracking: InsertDataInputTracking): Promise<DataInputTracking> {
    const { data, error } = await supabase
      .from('data_input_tracking')
      .insert(tracking)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating data input tracking:', error);
      throw new Error(`Failed to create data input tracking: ${error.message}`);
    }
    
    return data as DataInputTracking;
  }

  // System Metrics
  async getSystemMetrics(): Promise<SystemMetrics[]> {
    const { data, error } = await supabase
      .from('system_metrics')
      .select('*');
    
    if (error) {
      console.error('Error getting system metrics:', error);
      return [];
    }
    
    return data as SystemMetrics[] || [];
  }

  async createSystemMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics> {
    const { data, error } = await supabase
      .from('system_metrics')
      .insert(metrics)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating system metrics:', error);
      throw new Error(`Failed to create system metrics: ${error.message}`);
    }
    
    return data as SystemMetrics;
  }

  // Feature Analytics
  async getFeatureAnalytics(): Promise<FeatureAnalytics[]> {
    const { data, error } = await supabase
      .from('feature_analytics')
      .select('*');
    
    if (error) {
      console.error('Error getting feature analytics:', error);
      return [];
    }
    
    return data as FeatureAnalytics[] || [];
  }

  async createFeatureAnalytics(analytics: InsertFeatureAnalytics): Promise<FeatureAnalytics> {
    const { data, error } = await supabase
      .from('feature_analytics')
      .insert(analytics)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating feature analytics:', error);
      throw new Error(`Failed to create feature analytics: ${error.message}`);
    }
    
    return data as FeatureAnalytics;
  }
}

// Export the Supabase storage instance
export const supabaseStorage = new SupabaseStorage();
