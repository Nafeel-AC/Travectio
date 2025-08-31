import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserService, 
  SessionService, 
  TruckService, 
  LoadService, 
  FuelService, 
  DriverService, 
  HOSService, 
  LoadBoardService, 
  FleetMetricsService, 
  LoadPlanService, 
  AnalyticsService, 
  ActivityService, 
  BusinessAnalyticsService, 
  OwnerDashboardService 
} from '../lib/supabase-client';

// ============================================================================
// AUTHENTICATION HOOKS
// ============================================================================

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // User will be set by the auth state change listener
      return data;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // User will be cleared by the auth state change listener
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const getAdminStatus = useCallback(async () => {
    try {
      if (!user) return null;
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, "firstName", "lastName", "isAdmin", "isFounder"')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return userData ? {
        isAdmin: !!userData.isAdmin,
        isFounder: !!userData.isFounder,
        user: userData
      } : null;
    } catch (error) {
      console.error('Error getting admin status:', error);
      return null;
    }
  }, [user]);

  return {
    user,
    loading,
    login,
    logout,
    getAdminStatus,
    isAuthenticated: !!user
  };
};

// ============================================================================
// TRUCK MANAGEMENT HOOKS
// ============================================================================

export const useTrucks = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await TruckService.getTrucks();
      setTrucks(data);
    } catch (error) {
      console.error('Error fetching trucks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTruck = useCallback(async (truckData: any) => {
    try {
      const newTruck = await TruckService.createTruck(truckData);
      setTrucks(prev => [newTruck, ...prev]);
      return newTruck;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateTruck = useCallback(async (id: string, updates: any) => {
    try {
      const updatedTruck = await TruckService.updateTruck(id, updates);
      setTrucks(prev => prev.map(truck => 
        truck.id === id ? updatedTruck : truck
      ));
      return updatedTruck;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteTruck = useCallback(async (id: string) => {
    try {
      await TruckService.deleteTruck(id);
      setTrucks(prev => prev.filter(truck => truck.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const recalculateMiles = useCallback(async (truckId: string) => {
    try {
      return await TruckService.recalculateTruckMiles(truckId);
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  return {
    trucks,
    loading,
    fetchTrucks,
    createTruck,
    updateTruck,
    deleteTruck,
    recalculateMiles
  };
};

export const useTruckCostBreakdown = (truckId: string) => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBreakdowns = useCallback(async () => {
    if (!truckId) return;
    setLoading(true);
    try {
      const data = await TruckService.getTruckCostBreakdown(truckId);
      setBreakdowns(data);
    } catch (error) {
      console.error('Error fetching cost breakdowns:', error);
    } finally {
      setLoading(false);
    }
  }, [truckId]);

  const createBreakdown = useCallback(async (breakdownData: any) => {
    try {
      const newBreakdown = await TruckService.createCostBreakdown(truckId, breakdownData);
      setBreakdowns(prev => [newBreakdown, ...prev]);
      return newBreakdown;
    } catch (error) {
      throw error;
    }
  }, [truckId]);

  const updateBreakdown = useCallback(async (id: string, updates: any) => {
    try {
      const updatedBreakdown = await TruckService.updateCostBreakdown(id, updates);
      setBreakdowns(prev => prev.map(breakdown => 
        breakdown.id === id ? updatedBreakdown : breakdown
      ));
      return updatedBreakdown;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteBreakdown = useCallback(async (id: string) => {
    try {
      await TruckService.deleteCostBreakdown(id);
      setBreakdowns(prev => prev.filter(breakdown => breakdown.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchBreakdowns();
  }, [fetchBreakdowns]);

  return {
    breakdowns,
    loading,
    fetchBreakdowns,
    createBreakdown,
    updateBreakdown,
    deleteBreakdown
  };
};

// ============================================================================
// LOAD MANAGEMENT HOOKS
// ============================================================================

export const useLoads = () => {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LoadService.getLoads();
      setLoads(data);
    } catch (error) {
      console.error('Error fetching loads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLoad = useCallback(async (loadData: any) => {
    try {
      const newLoad = await LoadService.createLoad(loadData);
      setLoads(prev => [newLoad, ...prev]);
      return newLoad;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateLoad = useCallback(async (id: string, updates: any) => {
    try {
      const updatedLoad = await LoadService.updateLoad(id, updates);
      setLoads(prev => prev.map(load => 
        load.id === id ? updatedLoad : load
      ));
      return updatedLoad;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteLoad = useCallback(async (id: string) => {
    try {
      await LoadService.deleteLoad(id);
      setLoads(prev => prev.filter(load => load.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const calculateDeadheadMiles = useCallback(async (truckId: string, deliveredLoadDestinationCity: string, deliveredLoadDestinationState: string) => {
    try {
      return await LoadService.calculateDeadheadMiles(truckId, deliveredLoadDestinationCity, deliveredLoadDestinationState);
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  return {
    loads,
    loading,
    fetchLoads,
    createLoad,
    updateLoad,
    deleteLoad,
    calculateDeadheadMiles
  };
};

export const useLoadStops = (loadId: string) => {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStops = useCallback(async () => {
    if (!loadId) return;
    setLoading(true);
    try {
      const data = await LoadService.getLoadStops(loadId);
      setStops(data);
    } catch (error) {
      console.error('Error fetching load stops:', error);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  const createStop = useCallback(async (stopData: any) => {
    try {
      const newStop = await LoadService.createLoadStop(loadId, stopData);
      setStops(prev => [...prev, newStop]);
      return newStop;
    } catch (error) {
      throw error;
    }
  }, [loadId]);

  const updateStop = useCallback(async (id: string, updates: any) => {
    try {
      const updatedStop = await LoadService.updateLoadStop(id, updates);
      setStops(prev => prev.map(stop => 
        stop.id === id ? updatedStop : stop
      ));
      return updatedStop;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteStop = useCallback(async (id: string) => {
    try {
      await LoadService.deleteLoadStop(id);
      setStops(prev => prev.filter(stop => stop.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchStops();
  }, [fetchStops]);

  return {
    stops,
    loading,
    fetchStops,
    createStop,
    updateStop,
    deleteStop
  };
};

// ============================================================================
// FUEL MANAGEMENT HOOKS
// ============================================================================

export const useFuelPurchases = (loadId?: string, truckId?: string) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await FuelService.getFuelPurchases(loadId, truckId);
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching fuel purchases:', error);
    } finally {
      setLoading(false);
    }
  }, [loadId, truckId]);

  const createPurchase = useCallback(async (purchaseData: any) => {
    try {
      const newPurchase = await FuelService.createFuelPurchase(purchaseData);
      setPurchases(prev => [newPurchase, ...prev]);
      return newPurchase;
    } catch (error) {
      throw error;
    }
  }, []);

  const updatePurchase = useCallback(async (id: string, updates: any) => {
    try {
      const updatedPurchase = await FuelService.updateFuelPurchase(id, updates);
      setPurchases(prev => prev.map(purchase => 
        purchase.id === id ? updatedPurchase : purchase
      ));
      return updatedPurchase;
    } catch (error) {
      throw error;
    }
  }, []);

  const deletePurchase = useCallback(async (id: string) => {
    try {
      await FuelService.deleteFuelPurchase(id);
      setPurchases(prev => prev.filter(purchase => purchase.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateFuelCosts = useCallback(async (truckId: string) => {
    try {
      return await FuelService.updateFuelCosts(truckId);
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return {
    purchases,
    loading,
    fetchPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase,
    updateFuelCosts
  };
};

// ============================================================================
// DRIVER MANAGEMENT HOOKS
// ============================================================================

export const useDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DriverService.getDrivers();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDriver = useCallback(async (driverData: any) => {
    try {
      const newDriver = await DriverService.createDriver(driverData);
      setDrivers(prev => [newDriver, ...prev]);
      return newDriver;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateDriver = useCallback(async (id: string, updates: any) => {
    try {
      const updatedDriver = await DriverService.updateDriver(id, updates);
      setDrivers(prev => prev.map(driver => 
        driver.id === id ? updatedDriver : driver
      ));
      return updatedDriver;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteDriver = useCallback(async (id: string) => {
    try {
      await DriverService.deleteDriver(id);
      setDrivers(prev => prev.filter(driver => driver.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return {
    drivers,
    loading,
    fetchDrivers,
    createDriver,
    updateDriver,
    deleteDriver
  };
};

// ============================================================================
// HOS LOGS HOOKS
// ============================================================================

export const useHosLogs = (driverId?: string, truckId?: string) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await HOSService.getHosLogs(driverId, truckId);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching HOS logs:', error);
    } finally {
      setLoading(false);
    }
  }, [driverId, truckId]);

  const createLog = useCallback(async (logData: any) => {
    try {
      const newLog = await HOSService.createHosLog(logData);
      setLogs(prev => [newLog, ...prev]);
      return newLog;
    } catch (error) {
      throw error;
    }
  }, []);

  const getLatestStatus = useCallback(async (driverId: string) => {
    try {
      return await HOSService.getLatestHosStatus(driverId);
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    fetchLogs,
    createLog,
    getLatestStatus
  };
};

// ============================================================================
// LOAD BOARD HOOKS
// ============================================================================

export const useLoadBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LoadBoardService.getLoadBoardItems();
      setItems(data);
    } catch (error) {
      console.error('Error fetching load board items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (itemData: any) => {
    try {
      const newItem = await LoadBoardService.createLoadBoardItem(itemData);
      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      const updatedItem = await LoadBoardService.updateLoadBoardStatus(id, status);
      setItems(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
      return updatedItem;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    fetchItems,
    createItem,
    updateStatus
  };
};

// ============================================================================
// FLEET METRICS HOOKS
// ============================================================================

export const useFleetMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsData, summaryData] = await Promise.all([
        FleetMetricsService.getFleetMetrics(),
        FleetMetricsService.getFleetSummary()
      ]);
      setMetrics(metricsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching fleet metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    summary,
    loading,
    fetchMetrics
  };
};

// ============================================================================
// LOAD PLANS HOOKS
// ============================================================================

export const useLoadPlans = (truckId?: string, driverId?: string) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LoadPlanService.getLoadPlans(truckId, driverId);
      setPlans(data);
    } catch (error) {
      console.error('Error fetching load plans:', error);
    } finally {
      setLoading(false);
    }
  }, [truckId, driverId]);

  const createPlan = useCallback(async (planData: any) => {
    try {
      const newPlan = await LoadPlanService.createLoadPlan(planData);
      setPlans(prev => [newPlan, ...prev]);
      return newPlan;
    } catch (error) {
      throw error;
    }
  }, []);

  const updatePlan = useCallback(async (id: string, updates: any) => {
    try {
      const updatedPlan = await LoadPlanService.updateLoadPlan(id, updates);
      setPlans(prev => prev.map(plan => 
        plan.id === id ? updatedPlan : plan
      ));
      return updatedPlan;
    } catch (error) {
      throw error;
    }
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await LoadPlanService.deleteLoadPlan(id);
      setPlans(prev => prev.filter(plan => plan.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan
  };
};

export const useLoadPlanLegs = (planId: string) => {
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLegs = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const data = await LoadPlanService.getLoadPlanLegs(planId);
      setLegs(data);
    } catch (error) {
      console.error('Error fetching load plan legs:', error);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  const createLeg = useCallback(async (legData: any) => {
    try {
      const newLeg = await LoadPlanService.createLoadPlanLeg(planId, legData);
      setLegs(prev => [...prev, newLeg]);
      return newLeg;
    } catch (error) {
      throw error;
    }
  }, [planId]);

  const updateLeg = useCallback(async (id: string, updates: any) => {
    try {
      const updatedLeg = await LoadPlanService.updateLoadPlanLeg(id, updates);
      setLegs(prev => prev.map(leg => 
        leg.id === id ? updatedLeg : leg
      ));
      return updatedLeg;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteLeg = useCallback(async (id: string) => {
    try {
      await LoadPlanService.deleteLoadPlanLeg(id);
      setLegs(prev => prev.filter(leg => leg.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchLegs();
  }, [fetchLegs]);

  return {
    legs,
    loading,
    fetchLegs,
    createLeg,
    updateLeg,
    deleteLeg
  };
};

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

export const useAnalytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AnalyticsService.getDashboardAnalytics();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const trackFeatureUsage = useCallback(async (featureName: string, metadata?: any) => {
    try {
      await AnalyticsService.trackFeatureUsage(featureName, metadata);
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }, []);

  const trackUserSession = useCallback(async (sessionData: any) => {
    try {
      await AnalyticsService.trackUserSession(sessionData);
    } catch (error) {
      console.error('Error tracking user session:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    fetchDashboardData,
    trackFeatureUsage,
    trackUserSession
  };
};

// ============================================================================
// ACTIVITIES HOOKS
// ============================================================================

export const useActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ActivityService.getActivities();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createActivity = useCallback(async (activityData: any) => {
    try {
      const newActivity = await ActivityService.createActivity(activityData);
      setActivities(prev => [newActivity, ...prev]);
      return newActivity;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    fetchActivities,
    createActivity
  };
};

// ============================================================================
// BUSINESS ANALYTICS HOOKS
// ============================================================================

export const useBusinessAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await BusinessAnalyticsService.getBusinessAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching business analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    fetchAnalytics
  };
};

// ============================================================================
// OWNER DASHBOARD HOOKS
// ============================================================================

export const useOwnerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await OwnerDashboardService.getOwnerDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching owner dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    fetchDashboardData
  };
};

// ============================================================================
// USER MANAGEMENT HOOKS (FOUNDER ONLY)
// ============================================================================

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await UserService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const setFounder = useCallback(async (userId: string) => {
    try {
      const updatedUser = await UserService.setFounder(userId);
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }, []);

  const terminateUser = useCallback(async (userId: string) => {
    try {
      const updatedUser = await UserService.terminateUser(userId);
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }, []);

  const reactivateUser = useCallback(async (userId: string) => {
    try {
      const updatedUser = await UserService.reactivateUser(userId);
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    fetchUsers,
    deleteUser,
    setFounder,
    terminateUser,
    reactivateUser
  };
};

// ============================================================================
// SESSION MANAGEMENT HOOKS (FOUNDER ONLY)
// ============================================================================

export const useSessionManagement = () => {
  const [statistics, setStatistics] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SessionService.getSessionStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching session statistics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const data = await SessionService.getActiveSessions();
      setActiveSessions(data);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (limit = 100) => {
    try {
      const data = await SessionService.getSessionAuditLogs(limit);
      setAuditLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  }, []);

  const invalidateSession = useCallback(async (sessionId: string) => {
    try {
      await SessionService.invalidateSession(sessionId);
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
    fetchActiveSessions();
    fetchAuditLogs();
  }, [fetchStatistics, fetchActiveSessions, fetchAuditLogs]);

  return {
    statistics,
    activeSessions,
    auditLogs,
    loading,
    fetchStatistics,
    fetchActiveSessions,
    fetchAuditLogs,
    invalidateSession
  };
};
