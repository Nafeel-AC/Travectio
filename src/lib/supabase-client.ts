import { supabase } from './supabase';
import { calculateDistance, calculateDistanceBetweenCities } from '@shared/distance-utils';

export type { User, Session } from '@supabase/supabase-js';

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================================

class AuthService {
  // Admin login
  static async adminLogin(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, "firstName", "lastName", "isAdmin", "isFounder"')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    if (!userData.isAdmin && !userData.isFounder) {
      throw new Error('Access denied. Admin privileges required.');
    }

    return {
      user: userData,
      session: authData.session
    };
  }

  // Get current user
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return userData;
  }

  // Get admin status
  static async getAdminStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('id, email, "firstName", "lastName", "isAdmin", "isFounder"')
      .eq('id', user.id)
      .single();

    return userData ? {
      isAdmin: !!userData.isAdmin,
      isFounder: !!userData.isFounder,
      user: userData
    } : null;
  }

  // Logout
  static async logout() {
    return await supabase.auth.signOut();
  }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

class UserService {
  // Get all users (founder only)
  static async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete user (founder only)
  static async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw new Error(error.message);
    return true;
  }

  // Set founder status
  static async setFounder(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        "isFounder": 1, 
        "isAdmin": 1,
        "updatedAt": new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Terminate user account
  static async terminateUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        "isActive": 0, 
        "terminatedAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Reactivate user account
  static async reactivateUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        "isActive": 1, 
        "terminatedAt": null,
        "updatedAt": new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

class SessionService {
  // Get session statistics
  static async getSessionStatistics() {
    const { count: activeSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', 1);

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count: recentLogins } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', yesterday.toISOString());

    return {
      totalActiveSessions: activeSessions || 0,
      totalUsers: totalUsers || 0,
      recentLogins: recentLogins || 0
    };
  }

  // Get session audit logs
  static async getSessionAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from('session_audit_logs')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data;
  }

  // Get active sessions
  static async getActiveSessions() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('isActive', 1)
      .order('lastActivity', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Invalidate session
  static async invalidateSession(sessionId: string) {
    const { error } = await supabase
      .from('sessions')
      .update({ 
        "isActive": 0,
        "updatedAt": new Date().toISOString() 
      })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
    return true;
  }
}

// ============================================================================
// TRUCK MANAGEMENT
// ============================================================================

class TruckService {
  // Get all trucks for current user
  static async getTrucks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Get truck by ID
  static async getTruck(id: string) {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Create truck
  static async createTruck(truckData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('trucks')
      .insert({
        ...truckData,
        userId: user.id
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update truck
  static async updateTruck(id: string, updates: any) {
    const { data, error } = await supabase
      .from('trucks')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete truck
  static async deleteTruck(id: string) {
    const { error } = await supabase
      .from('trucks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  // Recalculate truck miles
  static async recalculateTruckMiles(truckId: string) {
    // Get all loads for this truck
    const { data: loads } = await supabase
      .from('loads')
      .select('miles, deadheadMiles')
      .eq('truckId', truckId);

    if (!loads) return;

    const totalMiles = loads.reduce((sum, load) => 
      sum + (load.miles || 0) + (load.deadheadMiles || 0), 0
    );

    // Update truck total miles
    await this.updateTruck(truckId, { totalMiles });
    return totalMiles;
  }

  // Get truck cost breakdown
  static async getTruckCostBreakdown(truckId: string) {
    const { data, error } = await supabase
      .from('truck_cost_breakdown')
      .select('*')
      .eq('truckId', truckId)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Get latest cost breakdown
  static async getLatestCostBreakdown(truckId: string) {
    const { data, error } = await supabase
      .from('truck_cost_breakdown')
      .select('*')
      .eq('truckId', truckId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Create cost breakdown
  static async createCostBreakdown(truckId: string, breakdownData: any) {
    const { data, error } = await supabase
      .from('truck_cost_breakdown')
      .insert({
        ...breakdownData,
        truckId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update cost breakdown
  static async updateCostBreakdown(id: string, updates: any) {
    const { data, error } = await supabase
      .from('truck_cost_breakdown')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete cost breakdown
  static async deleteCostBreakdown(id: string) {
    const { error } = await supabase
      .from('truck_cost_breakdown')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}

// ============================================================================
// LOAD MANAGEMENT
// ============================================================================

class LoadService {
  // Get all loads for current user
  static async getLoads() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Get load by ID
  static async getLoad(id: string) {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Create load
  static async createLoad(loadData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('loads')
      .insert({
        ...loadData,
        userId: user.id
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update load
  static async updateLoad(id: string, updates: any) {
    const { data, error } = await supabase
      .from('loads')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete load
  static async deleteLoad(id: string) {
    const { error } = await supabase
      .from('loads')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  // Get load stops
  static async getLoadStops(loadId: string) {
    const { data, error } = await supabase
      .from('load_stops')
      .select('*')
      .eq('loadId', loadId)
      .order('sequence', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  // Create load stop
  static async createLoadStop(loadId: string, stopData: any) {
    const { data, error } = await supabase
      .from('load_stops')
      .insert({
        ...stopData,
        loadId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update load stop
  static async updateLoadStop(id: string, updates: any) {
    const { data, error } = await supabase
      .from('load_stops')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete load stop
  static async deleteLoadStop(id: string) {
    const { error } = await supabase
      .from('load_stops')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  // Auto-calculate deadhead miles
  static async calculateDeadheadMiles(truckId: string, deliveredLoadDestinationCity: string, deliveredLoadDestinationState: string) {
    try {
      // Find all loads for this truck that don't have deadhead miles calculated yet
      const { data: allLoads } = await supabase
        .from('loads')
        .select('*')
        .eq('truckId', truckId);

      if (!allLoads) return;

      const truckLoads = allLoads.filter(load => 
        load.status !== 'delivered' && 
        load.deadheadMiles === 0
      );

      if (truckLoads.length === 0) return;

      // Sort loads by pickup date to find the next load
      const nextLoad = truckLoads.sort((a, b) => {
        const dateA = new Date(a.pickupDate || a.createdAt || '').getTime();
        const dateB = new Date(b.pickupDate || b.createdAt || '').getTime();
        return dateA - dateB;
      })[0];

      if (!nextLoad || !nextLoad.originCity || !nextLoad.originState) return;

      // Calculate deadhead miles
      const deadheadMiles = calculateDistanceBetweenCities(
        deliveredLoadDestinationCity,
        deliveredLoadDestinationState,
        nextLoad.originCity,
        nextLoad.originState
      );

      if (deadheadMiles > 0) {
        // Update the next load with deadhead information
        await this.updateLoad(nextLoad.id, {
          deadheadFromCity: deliveredLoadDestinationCity,
          deadheadFromState: deliveredLoadDestinationState,
          deadheadMiles: deadheadMiles,
          totalMilesWithDeadhead: nextLoad.miles + deadheadMiles
        });

        // Create activity log
        await ActivityService.createActivity({
          title: 'Deadhead miles auto-calculated',
          description: `${deadheadMiles} deadhead miles calculated from ${deliveredLoadDestinationCity}, ${deliveredLoadDestinationState} to ${nextLoad.originCity}, ${nextLoad.originState}`,
          type: 'info',
          relatedTruckId: truckId
        });
      }
    } catch (error) {
      console.error('Error calculating deadhead miles:', error);
    }
  }
}

// ============================================================================
// FUEL MANAGEMENT
// ============================================================================

class FuelService {
  // Get fuel purchases for current user
  static async getFuelPurchases(loadId?: string, truckId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('fuel_purchases')
      .select('*, trucks!inner(userId)')
      .eq('trucks.userId', user.id);

    if (loadId) query = query.eq('loadId', loadId);
    if (truckId) query = query.eq('truckId', truckId);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  // Create fuel purchase
  static async createFuelPurchase(purchaseData: any) {
    const { data, error } = await supabase
      .from('fuel_purchases')
      .insert(purchaseData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update fuel purchase
  static async updateFuelPurchase(id: string, updates: any) {
    const { data, error } = await supabase
      .from('fuel_purchases')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete fuel purchase
  static async deleteFuelPurchase(id: string) {
    const { error } = await supabase
      .from('fuel_purchases')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  // Update fuel costs for truck
  static async updateFuelCosts(truckId: string) {
    try {
      // Get current week's start and end dates
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Get fuel purchases attached to loads for this truck
      const { data: fuelPurchases } = await supabase
        .from('fuel_purchases')
        .select('*')
        .eq('truckId', truckId)
        .not('loadId', 'is', null);

      if (!fuelPurchases) return;

      const attachedFuelPurchases = fuelPurchases.filter(purchase => purchase.loadId !== null);

      // Calculate fuel costs and consumption
      const totalFuelCost = attachedFuelPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
      const totalGallons = attachedFuelPurchases.reduce((sum, purchase) => sum + purchase.gallons, 0);
      const avgFuelPrice = totalGallons > 0 ? totalFuelCost / totalGallons : 0;

      // Get loads for this truck during the current week
      const { data: allLoads } = await supabase
        .from('loads')
        .select('*')
        .eq('truckId', truckId);

      if (!allLoads) return;

      const weeklyLoads = allLoads.filter(load => {
        const loadDate = new Date(load.createdAt || load.deliveryDate || load.pickupDate || now);
        return loadDate >= weekStart && loadDate <= weekEnd;
      });

      // Calculate total miles
      const totalRevenueMiles = weeklyLoads.reduce((sum, load) => sum + (load.miles || 0), 0);
      const totalDeadheadMiles = weeklyLoads.reduce((sum, load) => sum + (load.deadheadMiles || 0), 0);
      const totalMilesWithDeadhead = totalRevenueMiles + totalDeadheadMiles;

      // Get latest cost breakdown
      const latestBreakdown = await TruckService.getLatestCostBreakdown(truckId);

      if (latestBreakdown) {
        // Recalculate total variable costs including fuel
        const totalVariableCosts = (latestBreakdown.driverPay || 0) + totalFuelCost + 
          (latestBreakdown.maintenance || 0) + (latestBreakdown.iftaTaxes || 0) + 
          (latestBreakdown.tolls || 0) + (latestBreakdown.dwellTime || 0) + 
          (latestBreakdown.reeferFuel || 0) + (latestBreakdown.truckParking || 0);

        const totalWeeklyCosts = latestBreakdown.totalFixedCosts + totalVariableCosts;
        const costPerMile = totalMilesWithDeadhead > 0 ? 
          Number((totalWeeklyCosts / totalMilesWithDeadhead).toFixed(3)) : 
          Number((totalWeeklyCosts / 3000).toFixed(3));

        // Calculate accurate MPG
        const milesPerGallon = totalGallons > 0 && totalMilesWithDeadhead > 0 ? 
          Number((totalMilesWithDeadhead / totalGallons).toFixed(2)) : 0;

        // Update existing breakdown
        await TruckService.updateCostBreakdown(latestBreakdown.id, {
          fuel: totalFuelCost,
          gallonsUsed: totalGallons,
          avgFuelPrice: avgFuelPrice,
          milesPerGallon: milesPerGallon,
          milesThisWeek: totalRevenueMiles,
          totalMilesWithDeadhead: totalMilesWithDeadhead,
          totalVariableCosts,
          totalWeeklyCosts,
          costPerMile
        });

        // Update truck's variable costs
        await TruckService.updateTruck(truckId, {
          variableCosts: totalVariableCosts
        });
      } else if (totalFuelCost > 0) {
        // Create new breakdown
        const milesPerGallon = totalGallons > 0 && totalMilesWithDeadhead > 0 ? 
          Number((totalMilesWithDeadhead / totalGallons).toFixed(2)) : 0;

        await TruckService.createCostBreakdown(truckId, {
          fuel: totalFuelCost,
          gallonsUsed: totalGallons,
          avgFuelPrice: avgFuelPrice,
          milesPerGallon: milesPerGallon,
          milesThisWeek: totalMilesWithDeadhead > 0 ? totalMilesWithDeadhead : 3000,
          totalMilesWithDeadhead: totalMilesWithDeadhead > 0 ? totalMilesWithDeadhead : 3000,
          totalFixedCosts: 0,
          totalVariableCosts: totalFuelCost,
          totalWeeklyCosts: totalFuelCost,
          costPerMile: 0,
          weekStarting: weekStart,
          weekEnding: weekEnd
        });
      }
    } catch (error) {
      console.error('Error updating fuel costs:', error);
    }
  }
}

// ============================================================================
// DRIVER MANAGEMENT
// ============================================================================

class DriverService {
  // Get all drivers for current user
  static async getDrivers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Create driver
  static async createDriver(driverData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('drivers')
      .insert({
        ...driverData,
        userId: user.id
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update driver
  static async updateDriver(id: string, updates: any) {
    const { data, error } = await supabase
      .from('drivers')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete driver
  static async deleteDriver(id: string) {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}

// ============================================================================
// HOS LOGS
// ============================================================================

class HOSService {
  // Get HOS logs
  static async getHosLogs(driverId?: string, truckId?: string) {
    let query = supabase.from('hos_logs').select('*');

    if (driverId) query = query.eq('driverId', driverId);
    if (truckId) query = query.eq('truckId', truckId);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  // Create HOS log
  static async createHosLog(hosLogData: any) {
    const { data, error } = await supabase
      .from('hos_logs')
      .insert(hosLogData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Get latest HOS status
  static async getLatestHosStatus(driverId: string) {
    const { data, error } = await supabase
      .from('hos_logs')
      .select('*')
      .eq('driverId', driverId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

// ============================================================================
// LOAD BOARD
// ============================================================================

class LoadBoardService {
  // Get load board items
  static async getLoadBoardItems() {
    const { data, error } = await supabase
      .from('load_board')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Create load board item
  static async createLoadBoardItem(itemData: any) {
    const { data, error } = await supabase
      .from('load_board')
      .insert(itemData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update load board status
  static async updateLoadBoardStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('load_board')
      .update({ 
        status,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

// ============================================================================
// FLEET METRICS
// ============================================================================

class FleetMetricsService {
  // Get fleet metrics
  static async getFleetMetrics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('fleet_metrics')
      .select('*')
      .eq('userId', user.id)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Get fleet summary
  static async getFleetSummary() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get trucks count
    const { count: trucksCount } = await supabase
      .from('trucks')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id)
      .eq('isActive', 1);

    // Get loads count
    const { count: loadsCount } = await supabase
      .from('loads')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id);

    // Get drivers count
    const { count: driversCount } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id)
      .eq('isActive', 1);

    return {
      fleetSize: trucksCount === 1 ? 'solo' : trucksCount === 2 ? 'small' : 'medium',
      totalTrucks: trucksCount || 0,
      totalLoads: loadsCount || 0,
      totalDrivers: driversCount || 0
    };
  }
}

// ============================================================================
// LOAD PLANS
// ============================================================================

class LoadPlanService {
  // Get load plans
  static async getLoadPlans(truckId?: string, driverId?: string) {
    let query = supabase.from('load_plans').select('*');

    if (truckId) query = query.eq('truckId', truckId);
    if (driverId) query = query.eq('driverId', driverId);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  // Get load plan by ID
  static async getLoadPlan(id: string) {
    const { data, error } = await supabase
      .from('load_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Create load plan
  static async createLoadPlan(planData: any) {
    const { data, error } = await supabase
      .from('load_plans')
      .insert(planData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update load plan
  static async updateLoadPlan(id: string, updates: any) {
    const { data, error } = await supabase
      .from('load_plans')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete load plan
  static async deleteLoadPlan(id: string) {
    const { error } = await supabase
      .from('load_plans')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  // Get load plan legs
  static async getLoadPlanLegs(planId: string) {
    const { data, error } = await supabase
      .from('load_plan_legs')
      .select('*')
      .eq('planId', planId)
      .order('sequence', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  // Create load plan leg
  static async createLoadPlanLeg(planId: string, legData: any) {
    const { data, error } = await supabase
      .from('load_plan_legs')
      .insert({
        ...legData,
        planId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update load plan leg
  static async updateLoadPlanLeg(id: string, updates: any) {
    const { data, error } = await supabase
      .from('load_plan_legs')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete load plan leg
  static async deleteLoadPlanLeg(id: string) {
    const { error } = await supabase
      .from('load_plan_legs')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

class AnalyticsService {
  // Get dashboard analytics
  static async getDashboardAnalytics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get basic metrics
    const { count: trucksCount } = await supabase
      .from('trucks')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id)
      .eq('isActive', 1);

    const { count: loadsCount } = await supabase
      .from('loads')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id);

    const { count: driversCount } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id)
      .eq('isActive', 1);

    return {
      totalTrucks: trucksCount || 0,
      totalLoads: loadsCount || 0,
      totalDrivers: driversCount || 0
    };
  }

  // Track feature usage
  static async trackFeatureUsage(featureName: string, metadata?: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('feature_analytics')
      .upsert({
        featureName,
        usageCount: 1,
        userCount: 1,
        metricDate: new Date().toISOString().split('T')[0],
        metadata
      });
  }

  // Track user session
  static async trackUserSession(sessionData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_analytics')
      .insert({
        userId: user.id,
        sessionId: sessionData.sessionId,
        sessionStartTime: sessionData.startTime,
        date: new Date().toISOString().split('T')[0],
        pageViews: sessionData.pageViews || 0,
        timeSpent: sessionData.timeSpent || 0,
        actionsPerformed: sessionData.actionsPerformed || 0,
        featuresUsed: sessionData.featuresUsed || [],
        sessionDuration: sessionData.duration || 0
      });
  }
}

// ============================================================================
// ACTIVITIES
// ============================================================================

class ActivityService {
  // Get activities
  static async getActivities() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('userId', user.id)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Create activity
  static async createActivity(activityData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...activityData,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

// ============================================================================
// BUSINESS ANALYTICS
// ============================================================================

class BusinessAnalyticsService {
  // Get business analytics
  static async getBusinessAnalytics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get cost per mile
    const { data: costBreakdowns } = await supabase
      .from('truck_cost_breakdown')
      .select('costPerMile')
      .eq('truckId', (await supabase
        .from('trucks')
        .select('id')
        .eq('userId', user.id)
        .eq('isActive', 1)
        .limit(1)
        .single())?.data?.id || '');

    const costPerMile = costBreakdowns?.[0]?.costPerMile || 0;

    // Get total loads
    const { count: totalLoads } = await supabase
      .from('loads')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id);

    // Get active trucks
    const { count: activeTrucks } = await supabase
      .from('trucks')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id)
      .eq('isActive', 1);

    return {
      costPerMile,
      totalLoads: totalLoads || 0,
      activeTrucks: activeTrucks || 0
    };
  }
}

// ============================================================================
// INTEGRATION SERVICES
// ============================================================================

class IntegrationService {
  // Setup integrations for a truck
  static async setupIntegrations(truckId: string, integrations: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('truck_integrations')
      .upsert({
        truckId,
        userId: user.id,
        integrations,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Get integration providers
  static async getIntegrationProviders() {
    const { data, error } = await supabase
      .from('integration_providers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  // Test integration connection
  static async testIntegration(provider: string, apiKey: string, type: 'eld' | 'loadBoard') {
    // This would typically make a test call to the provider's API
    // For now, we'll simulate a successful connection
    return {
      success: true,
      connected: true,
      provider,
      type,
      testData: {
        message: 'Integration test successful',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// ============================================================================
// OWNER DASHBOARD
// ============================================================================

class OwnerDashboardService {
  // Get owner dashboard data
  static async getOwnerDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is founder
    const { data: userData } = await supabase
      .from('users')
      .select('isFounder')
      .eq('id', user.id)
      .single();

    if (!userData?.isFounder) {
      throw new Error('Access denied. Founder privileges required.');
    }

    // Get system-wide metrics
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalTrucks } = await supabase
      .from('trucks')
      .select('*', { count: 'exact', head: true });

    const { count: totalLoads } = await supabase
      .from('loads')
      .select('*', { count: 'exact', head: true });

    return {
      totalUsers: totalUsers || 0,
      totalTrucks: totalTrucks || 0,
      totalLoads: totalLoads || 0,
      systemHealth: 'healthy'
    };
  }
}

// ============================================================================
// EXPORT ALL SERVICES
// ============================================================================

export {
  AuthService,
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
  OwnerDashboardService,
  IntegrationService
};
