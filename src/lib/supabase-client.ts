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
      .maybeSingle();

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
      .maybeSingle();

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
      .maybeSingle();

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

  // Delete current user account and all associated data using Edge Function
  static async deleteCurrentUserAccount(reason?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the Edge Function for account deletion
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { reason },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Account deletion failed');
      }

      // Sign out the user after successful deletion
      await supabase.auth.signOut();

      return { success: true, message: data.message || 'Account and all associated data deleted successfully' };
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw new Error(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    const { data: trucks, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    
    // Fetch driver data for trucks that have currentDriverId
    const trucksWithDrivers = await Promise.all(
      trucks.map(async (truck) => {
        if (truck.currentDriverId) {
          const { data: driver, error: driverError } = await supabase
            .from('drivers')
            .select('id, name, cdlNumber, phone, email')
            .eq('id', truck.currentDriverId)
            .maybeSingle();
          
          if (!driverError && driver) {
            truck.driver = driver;
          }
        }
        return truck;
      })
    );
    
    return trucksWithDrivers;
  }

  // Get truck by ID
  static async getTruck(id: string) {
    const { data: truck, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    
    // If truck has a currentDriverId, fetch the driver data
    if (truck.currentDriverId) {
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('id, name, cdlNumber, phone, email')
        .eq('id', truck.currentDriverId)
        .maybeSingle();
      
      if (!driverError && driver) {
        truck.driver = driver;
      }
    }
    
    return truck;
  }

  // Create truck
  static async createTruck(truckData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Normalize and validate name to avoid false duplicate matches
    const normalizedName = (truckData?.name ?? '').trim();
    if (!normalizedName) {
      throw new Error('Truck name is required.');
    }

    // Check subscription limits
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('truckCount, status')
      .eq('userId', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription) {
      throw new Error('Active subscription required to add trucks. Please subscribe to a plan first.');
    }

    // Get current truck count
    const { count: currentTruckCount } = await supabase
      .from('trucks')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id);

    if (currentTruckCount >= subscription.truckCount) {
      throw new Error(`Truck limit reached. You can only have ${subscription.truckCount} trucks with your current subscription. Please upgrade to add more trucks.`);
    }

    // Check if truck with same name already exists for this user (case-insensitive, trimmed)
    const { data: existingTruck } = await supabase
      .from('trucks')
      .select('id, name')
      .eq('userId', user.id)
      .ilike('name', normalizedName)
      .maybeSingle();

    if (existingTruck) {
      throw new Error(`A truck with the name "${normalizedName}" already exists. Please use a different name.`);
    }

    const { data, error } = await supabase
      .from('trucks')
      .insert({
        ...truckData,
        name: normalizedName,
        userId: user.id
      })
      .select()
      .single();

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === '23505' && error.message.includes('name')) {
        throw new Error(`A truck with the name "${normalizedName}" already exists. Please use a different name.`);
      }
      throw new Error(error.message);
    }
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

  // Assign driver to truck (updates both truck and driver records)
  static async assignDriverToTruck(truckId: string, driverId: string | null) {
    // First, remove any existing driver assignment from this truck
    const { data: currentTruck } = await supabase
      .from('trucks')
      .select('currentDriverId')
      .eq('id', truckId)
      .single();

    if (currentTruck?.currentDriverId) {
      // Remove the current driver's truck assignment
      await supabase
        .from('drivers')
        .update({ currentTruckId: null })
        .eq('id', currentTruck.currentDriverId);
    }

    // Update the truck with the new driver assignment
    const { data: updatedTruck, error: truckError } = await supabase
      .from('trucks')
      .update({
        currentDriverId: driverId,
        updatedAt: new Date().toISOString()
      })
      .eq('id', truckId)
      .select()
      .single();

    if (truckError) throw new Error(truckError.message);

    // If a new driver is being assigned, update the driver's truck assignment
    if (driverId) {
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ 
          currentTruckId: truckId,
          updatedAt: new Date().toISOString()
        })
        .eq('id', driverId);

      if (driverError) throw new Error(driverError.message);
    }

    return updatedTruck;
  }

  // Delete truck
  static async deleteTruck(id: string) {
    // First, delete all related records
    // Delete cost breakdowns
    await supabase
      .from('truck_cost_breakdown')
      .delete()
      .eq('truckId', id);

    // Delete fuel purchases
    await supabase
      .from('fuel_purchases')
      .delete()
      .eq('truckId', id);

    // Delete loads
    await supabase
      .from('loads')
      .delete()
      .eq('truckId', id);

    // Delete HOS logs
    await supabase
      .from('hos_logs')
      .delete()
      .eq('truckId', id);

    // Update activities to remove truck reference
    await supabase
      .from('activities')
      .update({ relatedTruckId: null })
      .eq('relatedTruckId', id);

    // Update drivers to remove truck assignment
    await supabase
      .from('drivers')
      .update({ currentTruckId: null })
      .eq('currentTruckId', id);

    // Finally, delete the truck
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
      .maybeSingle();

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
    
    // Update truck's summary fields with the new cost breakdown data
    if (data) {
      const updateData: any = {};
      
      if (data.costPerMile !== null && data.costPerMile !== undefined) {
        updateData.costPerMile = data.costPerMile;
      }
      
      if (data.totalFixedCosts !== null && data.totalFixedCosts !== undefined) {
        updateData.fixedCosts = data.totalFixedCosts;
      }
      
      if (data.totalVariableCosts !== null && data.totalVariableCosts !== undefined) {
        updateData.variableCosts = data.totalVariableCosts;
      }
      
      if (data.milesThisWeek !== null && data.milesThisWeek !== undefined) {
        updateData.totalMiles = data.milesThisWeek;
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('trucks')
          .update(updateData)
          .eq('id', truckId);
      }
    }
    
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
    
    // Update truck's summary fields with the updated cost breakdown data
    if (data) {
      const updateData: any = {};
      
      if (data.costPerMile !== null && data.costPerMile !== undefined) {
        updateData.costPerMile = data.costPerMile;
      }
      
      if (data.totalFixedCosts !== null && data.totalFixedCosts !== undefined) {
        updateData.fixedCosts = data.totalFixedCosts;
      }
      
      if (data.totalVariableCosts !== null && data.totalVariableCosts !== undefined) {
        updateData.variableCosts = data.totalVariableCosts;
      }
      
      if (data.milesThisWeek !== null && data.milesThisWeek !== undefined) {
        updateData.totalMiles = data.milesThisWeek;
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('trucks')
          .update(updateData)
          .eq('id', data.truckId);
      }
    }
    
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

  // Update cost per mile for all trucks based on their latest cost breakdown
  static async updateAllTrucksCostPerMile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all trucks for the current user
    const { data: trucks, error: trucksError } = await supabase
      .from('trucks')
      .select('id, name')
      .eq('userId', user.id);

    if (trucksError) throw new Error(trucksError.message);

    // For each truck, get the latest cost breakdown and update the truck's summary fields
    for (const truck of trucks || []) {
      const { data: costBreakdowns } = await supabase
        .from('truck_cost_breakdown')
        .select('costPerMile, totalFixedCosts, totalVariableCosts, milesThisWeek')
        .eq('truckId', truck.id)
        .order('createdAt', { ascending: false })
        .limit(1);

      if (costBreakdowns && costBreakdowns.length > 0) {
        const breakdown = costBreakdowns[0];
        const updateData: any = {};
        
        if (breakdown.costPerMile !== null && breakdown.costPerMile !== undefined) {
          updateData.costPerMile = breakdown.costPerMile;
        }
        
        if (breakdown.totalFixedCosts !== null && breakdown.totalFixedCosts !== undefined) {
          updateData.fixedCosts = breakdown.totalFixedCosts;
        }
        
        if (breakdown.totalVariableCosts !== null && breakdown.totalVariableCosts !== undefined) {
          updateData.variableCosts = breakdown.totalVariableCosts;
        }
        
        if (breakdown.milesThisWeek !== null && breakdown.milesThisWeek !== undefined) {
          updateData.totalMiles = breakdown.milesThisWeek;
        }

        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('trucks')
            .update(updateData)
            .eq('id', truck.id);
        }
      }
    }

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

    // ✅ FIXED: Filter out fields that don't exist in the loads table schema
    const allowedFields = [
      'truckId', 'type', 'pay', 'miles', 'isProfitable', 'estimatedFuelCost', 
      'estimatedGallons', 'status', 'originCity', 'originState', 'destinationCity', 
      'destinationState', 'deadheadFromCity', 'deadheadFromState', 'deadheadMiles', 
      'totalMilesWithDeadhead', 'pickupDate', 'deliveryDate', 'notes', 'commodity', 
      'ratePerMile'
    ];

    const filteredData = Object.keys(loadData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = loadData[key];
        return obj;
      }, {} as any);

    const { data, error } = await supabase
      .from('loads')
      .insert({
        ...filteredData,
        userId: user.id
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update load
  static async updateLoad(id: string, updates: any) {
    // ✅ FIXED: Filter out fields that don't exist in the loads table schema
    const allowedFields = [
      'truckId', 'type', 'pay', 'miles', 'isProfitable', 'estimatedFuelCost', 
      'estimatedGallons', 'status', 'originCity', 'originState', 'destinationCity', 
      'destinationState', 'deadheadFromCity', 'deadheadFromState', 'deadheadMiles', 
      'totalMilesWithDeadhead', 'pickupDate', 'deliveryDate', 'notes', 'commodity', 
      'ratePerMile'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    const { data, error } = await supabase
      .from('loads')
      .update({
        ...filteredUpdates,
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
    // ✅ FIXED: Filter out fields that don't exist in the load_stops table schema
    const allowedFields = [
      'sequence', 'type', 'stopType', 'city', 'state', 'scheduledTime', 
      'actualTime', 'notes'
    ];

    const filteredData = Object.keys(stopData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = stopData[key];
        return obj;
      }, {} as any);

    const { data, error } = await supabase
      .from('load_stops')
      .insert({
        ...filteredData,
        loadId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update load stop
  static async updateLoadStop(id: string, updates: any) {
    // ✅ FIXED: Filter out fields that don't exist in the load_stops table schema
    const allowedFields = [
      'sequence', 'type', 'stopType', 'city', 'state', 'scheduledTime', 
      'actualTime', 'notes'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    const { data, error } = await supabase
      .from('load_stops')
      .update({
        ...filteredUpdates,
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
    // First, delete all HOS logs associated with this driver
    await HOSService.deleteHosLogsByDriver(id);

    // Then delete the driver
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

    // Order by timestamp descending to show most recent first
    query = query.order('timestamp', { ascending: false });

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

  // Update HOS log status
  static async updateHosLogStatus(id: string, dutyStatus: string) {
    const { data, error } = await supabase
      .from('hos_logs')
      .update({ 
        dutyStatus,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete HOS logs by driver ID
  static async deleteHosLogsByDriver(driverId: string) {
    const { error } = await supabase
      .from('hos_logs')
      .delete()
      .eq('driverId', driverId);

    if (error) throw new Error(error.message);
    return true;
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
    // ✅ FIXED: Filter out fields that don't exist in the load_board table schema
    const allowedFields = [
      'loadBoardSource', 'originCity', 'originState', 'destinationCity', 'destinationState',
      'equipmentType', 'weight', 'length', 'pay', 'miles', 'ratePerMile', 'pickupDate',
      'deliveryDate', 'status', 'loadBoardProvider', 'externalId', 'notes'
    ];

    const filteredData = Object.keys(itemData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = itemData[key];
        return obj;
      }, {} as any);

    const { data, error } = await supabase
      .from('load_board')
      .insert(filteredData)
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

    // Get trucks count and data
    const { count: trucksCount, data: trucks } = await supabase
      .from('trucks')
      .select('*', { count: 'exact' })
      .eq('userId', user.id);

    // Get loads count and data
    const { count: loadsCount, data: loads } = await supabase
      .from('loads')
      .select('*', { count: 'exact' })
      .eq('userId', user.id);

    // Get drivers count and data
    const { count: driversCount, data: drivers } = await supabase
      .from('drivers')
      .select('*', { count: 'exact' })
      .eq('userId', user.id);

    // Calculate metrics from actual data
    const totalTrucks = trucksCount || 0;
    const totalLoads = loadsCount || 0;
    const totalDrivers = driversCount || 0;
    
    console.log('Fleet Summary Debug:', {
      totalTrucks,
      totalLoads,
      totalDrivers,
      trucksData: trucks,
      loadsData: loads,
      driversData: drivers
    });
    
    // Calculate total miles from trucks
    const totalMiles = (trucks || []).reduce((sum: number, truck: any) => sum + (truck.totalMiles || 0), 0);
    
    // Calculate total revenue from loads
    const totalRevenue = (loads || []).reduce((sum: number, load: any) => sum + (load.pay || 0), 0);
    
    // Calculate average cost per mile from trucks
    const totalCosts = (trucks || []).reduce((sum: number, truck: any) => {
      const truckCost = (truck.fixedCosts || 0) + (truck.variableCosts || 0);
      return sum + truckCost;
    }, 0);
    
    const avgCostPerMile = totalMiles > 0 ? totalCosts / totalMiles : 0;
    
    // Calculate average MPG from trucks
    const totalMPG = (trucks || []).reduce((sum: number, truck: any) => sum + (truck.mpg || 0), 0);
    const avgMPG = (trucks || []).length > 0 ? totalMPG / (trucks || []).length : 0;
    
    // Calculate profit margin
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
    
    // Calculate utilization rate (trucks with loads / total trucks)
    const trucksWithLoads = (trucks || []).filter((truck: any) => 
      (loads || []).some((load: any) => load.truckId === truck.id)
    ).length;
    const utilizationRate = totalTrucks > 0 ? (trucksWithLoads / totalTrucks) * 100 : 0;
    
    // Calculate active trucks (trucks with current loads)
    const activeTrucks = (trucks || []).filter((truck: any) => 
      (loads || []).some((load: any) => 
        load.truckId === truck.id && 
        ['pending', 'in_transit'].includes(load.status)
      )
    ).length;
    
    // Calculate active drivers (drivers assigned to trucks)
    const activeDrivers = (drivers || []).filter((driver: any) => 
      (trucks || []).some((truck: any) => truck.currentDriverId === driver.id)
    ).length;

    return {
      fleetSize: totalTrucks === 1 ? 'solo' : totalTrucks <= 10 ? 'small' : totalTrucks <= 50 ? 'medium' : 'large',
      totalTrucks,
      totalLoads,
      totalDrivers,
      activeTrucks,
      activeDrivers,
      totalMiles,
      totalRevenue,
      totalCosts,
      avgCostPerMile,
      avgMPG,
      profitMargin,
      utilizationRate
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
    // ✅ FIXED: Filter out fields that don't exist in the load_plans table schema
    const allowedFields = [
      'name', 'description', 'startDate', 'endDate', 'status', 'totalRevenue',
      'totalMiles', 'estimatedProfit', 'notes'
    ];

    const filteredData = Object.keys(planData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = planData[key];
        return obj;
      }, {} as any);

    const { data, error } = await supabase
      .from('load_plans')
      .insert(filteredData)
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

    // Check if user is founder for system-wide analytics
    const { data: userData } = await supabase
      .from('users')
      .select('isFounder')
      .eq('id', user.id)
      .single();

    const isFounder = userData?.isFounder;

    if (isFounder) {
      // System-wide analytics for founders
      const [
        { data: allLoads },
        { data: allTrucks },
        { data: allUsers },
        { data: costBreakdowns }
      ] = await Promise.all([
        supabase.from('loads').select('pay, miles, status, "createdAt", "userId"'),
        supabase.from('trucks').select('equipmentType, "totalMiles", "isActive", "userId"'),
        supabase.from('users').select('id, "isActive", "createdAt"'),
        supabase.from('truck_cost_breakdown').select('costPerMile, truckId')
      ]);

      // Calculate system-wide metrics
      const totalRevenue = allLoads?.reduce((sum, load) => 
        load.status === 'completed' ? sum + (load.pay || 0) : sum, 0) || 0;
      
      const totalMiles = allLoads?.reduce((sum, load) => sum + (load.miles || 0), 0) || 0;
      
      const avgSystemRevenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;

      // Calculate average cost per mile across all trucks
      const avgCostPerMile = costBreakdowns?.length > 0 
        ? costBreakdowns.reduce((sum, breakdown) => sum + (breakdown.costPerMile || 0), 0) / costBreakdowns.length
        : 0;

      // Calculate equipment distribution
      const equipmentDistribution = allTrucks?.reduce((acc, truck) => {
        const type = truck.equipmentType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate user growth metrics
      const activeUsers = allUsers?.filter(user => user.isActive).length || 0;
      const totalUsers = allUsers?.length || 0;

      return {
        // System-wide metrics
        totalRevenue,
        totalMiles,
        avgSystemRevenuePerMile,
        avgCostPerMile,
        totalLoads: allLoads?.length || 0,
        activeTrucks: allTrucks?.filter(truck => truck.isActive).length || 0,
        totalTrucks: allTrucks?.length || 0,
        activeUsers,
        totalUsers,
        equipmentDistribution,
        // Performance metrics
        systemProfitMargin: totalRevenue > 0 ? ((totalRevenue - (avgCostPerMile * totalMiles)) / totalRevenue) * 100 : 0
      };
    } else {
      // User-specific analytics for regular users
      const [
        { data: userLoads },
        { data: userTrucks },
        { data: costBreakdowns }
      ] = await Promise.all([
        supabase.from('loads').select('pay, miles, status, "createdAt"').eq('userId', user.id),
        supabase.from('trucks').select('equipmentType, "totalMiles", "isActive"').eq('userId', user.id),
        supabase.from('truck_cost_breakdown')
          .select('costPerMile, truckId')
          .in('truckId', (await supabase
            .from('trucks')
            .select('id')
            .eq('userId', user.id)
          ).data?.map(t => t.id) || [])
      ]);

      const userRevenue = userLoads?.reduce((sum, load) => 
        load.status === 'completed' ? sum + (load.pay || 0) : sum, 0) || 0;
      
      const userMiles = userLoads?.reduce((sum, load) => sum + (load.miles || 0), 0) || 0;
      
      const avgUserRevenuePerMile = userMiles > 0 ? userRevenue / userMiles : 0;

      const avgCostPerMile = costBreakdowns?.length > 0 
        ? costBreakdowns.reduce((sum, breakdown) => sum + (breakdown.costPerMile || 0), 0) / costBreakdowns.length
        : 0;

      return {
        // User-specific metrics
        totalRevenue: userRevenue,
        totalMiles: userMiles,
        avgSystemRevenuePerMile: avgUserRevenuePerMile,
        avgCostPerMile,
        totalLoads: userLoads?.length || 0,
        activeTrucks: userTrucks?.filter(truck => truck.isActive).length || 0,
        totalTrucks: userTrucks?.length || 0,
        // Performance metrics
        profitMargin: userRevenue > 0 ? ((userRevenue - (avgCostPerMile * userMiles)) / userRevenue) * 100 : 0
      };
    }
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
// FOUNDER SERVICES (Cross-tenant access)
// ============================================================================

class FounderService {
  // Get all drivers across all users (founder only)
  static async getAllDrivers() {
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

    const { data: drivers, error } = await supabase
      .from('drivers')
      .select(`
        *,
        users!drivers_userId_fkey (
          id,
          email,
          firstName,
          lastName,
          company
        )
      `)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return drivers;
  }

  // Get all trucks across all users (founder only)
  static async getAllTrucks() {
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

    const { data: trucks, error } = await supabase
      .from('trucks')
      .select(`
        *,
        users!trucks_userId_fkey (
          id,
          email,
          firstName,
          lastName,
          company
        )
      `)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return trucks;
  }

  // Get all drivers with their assigned trucks (founder only)
  static async getAllDriversWithTrucks() {
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

    const { data: drivers, error } = await supabase
      .from('drivers')
      .select(`
        *,
        users!drivers_userId_fkey (
          id,
          email,
          firstName,
          lastName,
          company
        ),
        trucks!drivers_currentTruckId_fkey (
          id,
          name,
          equipmentType,
          licensePlate,
          vin,
          fixedCosts,
          variableCosts,
          totalMiles,
          isActive,
          loadBoardIntegration,
          elogsIntegration,
          preferredLoadBoard,
          elogsProvider,
          costPerMile
        )
      `)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return drivers;
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

    // Get system-wide metrics in parallel
    const [
      { count: totalUsers },
      { count: totalTrucks },
      { count: totalLoads },
      { count: activeUsers },
      { count: activeTrucks },
      { data: loadsData },
      { data: trucksData }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('trucks').select('*', { count: 'exact', head: true }),
      supabase.from('loads').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('isActive', 1),
      supabase.from('trucks').select('*', { count: 'exact', head: true }).eq('isActive', 1),
      supabase.from('loads').select('pay, miles, status, "createdAt"'),
      supabase.from('trucks').select('equipmentType, "totalMiles"')
    ]);

    // Calculate revenue and miles from loads
    const totalRevenue = loadsData?.reduce((sum, load) => 
      load.status === 'completed' ? sum + (load.pay || 0) : sum, 0) || 0;
    
    const totalMiles = loadsData?.reduce((sum, load) => sum + (load.miles || 0), 0) || 0;
    
    // Calculate average revenue per mile
    const avgSystemRevenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;

    // Calculate equipment type distribution
    const equipmentDistribution = trucksData?.reduce((acc, truck) => {
      const type = truck.equipmentType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate system scalability (assuming max capacity of 100 users)
    const maxCapacity = 100;
    const currentUsers = activeUsers || 0;
    const utilizationPercentage = (currentUsers / maxCapacity) * 100;
    const growthCapacity = maxCapacity - currentUsers;

    return {
      systemTotals: {
        totalUsers: totalUsers || 0,
        totalRevenue,
        totalMiles,
        totalTrucks: totalTrucks || 0,
        totalLoads: totalLoads || 0,
        avgSystemRevenuePerMile,
        activeUsers: activeUsers || 0,
        activeTrucks: activeTrucks || 0
      },
      equipmentDistribution,
      scalabilityStatus: {
        currentUsers,
        maxCapacity,
        utilizationPercentage,
        growthCapacity
      },
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
  IntegrationService,
  FounderService
};
