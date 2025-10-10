import { supabase } from './supabase';

// Organization-aware Supabase client that filters data by organization and role
export class OrgAwareService {
  
  // Helper to get current user's organization context
  static async getOrgContext() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's active organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!membership) {
      throw new Error('No active organization membership found');
    }

    return {
      userId: user.id,
      orgId: membership.organization_id,
      role: membership.role as 'owner' | 'dispatcher' | 'driver'
    };
  }

  // Helper to check if user can access specific data based on role
  static canAccess(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
  }
}

// ============================================================================
// ORGANIZATION-AWARE TRUCK SERVICE
// ============================================================================

export class OrgTruckService extends OrgAwareService {
  
  // Get trucks based on user role and organization
  static async getTrucks() {
    const { userId, orgId, role } = await this.getOrgContext();

    let query = supabase
      .from('trucks')
      .select(`
        *,
        drivers:currentDriverId (
          id, name, cdlNumber, phoneNumber, email
        )
      `);

    if (role === 'owner' || role === 'dispatcher') {
      // Owners and dispatchers see all organization trucks
      query = query.eq('organization_id', orgId);
    } else if (role === 'driver') {
      // Drivers see only their assigned truck. Resolve the driver's row id first.
      const { data: driverRow } = await supabase
        .from('drivers')
        .select('id')
        .eq('organization_id', orgId)
        .or(`auth_user_id.eq.${userId},userId.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (!driverRow) {
        // No driver profile yet → no trucks to show
        const { data, error } = await query.eq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(error.message);
        return data || [];
      }

      query = query
        .eq('organization_id', orgId)
        .eq('currentDriverId', driverRow.id);
    }

    // Note: trucks table uses camelCase timestamp column "createdAt"
    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Driver-only: get the single truck currently assigned to the logged-in driver
  static async getAssignedTruckForCurrentDriver() {
    const { userId, orgId, role } = await this.getOrgContext();

    // Resolve the driver's row for this auth user within the org
    const { data: driverRow } = await supabase
      .from('drivers')
      .select('id')
      .eq('organization_id', orgId)
      .or(`auth_user_id.eq.${userId},userId.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (!driverRow) return null;

    const { data, error } = await supabase
      .from('trucks')
      .select(`
        *,
        drivers:currentDriverId (
          id, name, cdlNumber, phoneNumber, email
        )
      `)
      .eq('organization_id', orgId)
      .eq('currentDriverId', driverRow.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data || null;
  }

  // Create truck (Owner/Dispatcher only)
  static async createTruck(truckData: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (!this.canAccess(role, ['owner', 'dispatcher'])) {
      throw new Error('Access denied. Only owners and dispatchers can create trucks.');
    }

    const { data, error } = await supabase
      .from('trucks')
      .insert({
        ...truckData,
        organization_id: orgId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update truck (Owner/Dispatcher only)
  static async updateTruck(truckId: string, updates: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (!this.canAccess(role, ['owner', 'dispatcher'])) {
      throw new Error('Access denied. Only owners and dispatchers can update trucks.');
    }

    // Verify truck belongs to organization
    const { data: truck } = await supabase
      .from('trucks')
      .select('organization_id')
      .eq('id', truckId)
      .single();

    if (!truck || truck.organization_id !== orgId) {
      throw new Error('Truck not found or access denied.');
    }

    const { data, error } = await supabase
      .from('trucks')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', truckId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete truck (Owner only)
  static async deleteTruck(truckId: string) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (!this.canAccess(role, ['owner'])) {
      throw new Error('Access denied. Only owners can delete trucks.');
    }

    // Verify truck belongs to organization
    const { data: truck } = await supabase
      .from('trucks')
      .select('organization_id')
      .eq('id', truckId)
      .single();

    if (!truck || truck.organization_id !== orgId) {
      throw new Error('Truck not found or access denied.');
    }

    // Delete related records first
    await Promise.all([
      supabase.from('truck_cost_breakdown').delete().eq('truckId', truckId),
      supabase.from('fuel_purchases').delete().eq('truckId', truckId),
      supabase.from('hos_logs').delete().eq('truckId', truckId),
      supabase.from('loads').update({ truckId: null }).eq('truckId', truckId)
    ]);

    const { error } = await supabase
      .from('trucks')
      .delete()
      .eq('id', truckId);

    if (error) throw new Error(error.message);
    return true;
  }
}

// ============================================================================
// ORGANIZATION-AWARE LOAD SERVICE
// ============================================================================

export class OrgLoadService extends OrgAwareService {
  
  // Get loads based on user role
  static async getLoads() {
    const { userId, orgId, role } = await this.getOrgContext();

    let query = supabase
      .from('loads')
      .select(`
        *,
        trucks!loads_truckId_fkey (
          id, name, licensePlate,
          drivers:currentDriverId (
            id, name
          )
        )
      `);

    if (role === 'owner' || role === 'dispatcher') {
      // Owners and dispatchers see all organization loads
      query = query.eq('organization_id', orgId);
    } else if (role === 'driver') {
      // Drivers see only loads assigned to their truck
      // First, resolve the driver's record ID from their auth user ID
      const { data: driverRow } = await supabase
        .from('drivers')
        .select('id')
        .eq('organization_id', orgId)
        .or(`auth_user_id.eq.${userId},userId.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (!driverRow) {
        return []; // Driver record not found
      }

      // Now find trucks assigned to this driver
      const { data: driverTrucks } = await supabase
        .from('trucks')
        .select('id')
        .eq('organization_id', orgId)
        .eq('currentDriverId', driverRow.id);

      const truckIds = driverTrucks?.map(t => t.id) || [];
      if (truckIds.length === 0) {
        return []; // Driver has no assigned truck
      }

      query = query
        .eq('organization_id', orgId)
        .in('truckId', truckIds);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Create load (Owner/Dispatcher only)
  static async createLoad(loadData: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (!this.canAccess(role, ['owner', 'dispatcher'])) {
      throw new Error('Access denied. Only owners and dispatchers can create loads.');
    }

    // ✅ FIXED: Filter out fields that don't exist in the loads table schema
    const allowedFields = [
      'truckId', 'type', 'pay', 'miles', 'isProfitable', 'estimatedFuelCost', 
      'estimatedGallons', 'status', 'originCity', 'originState', 'destinationCity', 
      'destinationState', 'deadheadFromCity', 'deadheadFromState', 'deadheadMiles', 
      'totalMilesWithDeadhead', 'pickupDate', 'deliveryDate', 'notes', 'commodity', 
      'ratePerMile', 'weight', 'brokerName', 'brokerContact', 'rateConfirmation'
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
        organization_id: orgId,
        userId: userId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update load (Owner/Dispatcher only, or Driver for status updates)
  static async updateLoad(loadId: string, updates: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    // Verify load belongs to organization
    const { data: load } = await supabase
      .from('loads')
      .select('organization_id, truckId')
      .eq('id', loadId)
      .single();

    if (!load || load.organization_id !== orgId) {
      throw new Error('Load not found or access denied.');
    }

    if (role === 'driver') {
      // Drivers can only update status of loads assigned to their truck
      // First, resolve the driver's record ID from their auth user ID
      const { data: driverRow } = await supabase
        .from('drivers')
        .select('id')
        .eq('organization_id', orgId)
        .or(`auth_user_id.eq.${userId},userId.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (!driverRow) {
        throw new Error('Driver record not found.');
      }

      // Now find trucks assigned to this driver
      const { data: driverTrucks } = await supabase
        .from('trucks')
        .select('id')
        .eq('organization_id', orgId)
        .eq('currentDriverId', driverRow.id);

      const truckIds = driverTrucks?.map(t => t.id) || [];
      if (!truckIds.includes(load.truckId)) {
        throw new Error('Access denied. You can only update loads assigned to your truck.');
      }

      // Drivers can only update status and delivery-related fields
      const allowedFields = ['status', 'actualDeliveryDate', 'notes'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      updates = filteredUpdates;
    } else if (!this.canAccess(role, ['owner', 'dispatcher'])) {
      throw new Error('Access denied.');
    } else {
      // Owners/Dispatchers can update most fields, but filter out invalid ones
      const allowedFields = [
        'truckId', 'type', 'pay', 'miles', 'isProfitable', 'estimatedFuelCost', 
        'estimatedGallons', 'status', 'originCity', 'originState', 'destinationCity', 
        'destinationState', 'deadheadFromCity', 'deadheadFromState', 'deadheadMiles', 
        'totalMilesWithDeadhead', 'pickupDate', 'deliveryDate', 'notes', 'commodity', 
        'ratePerMile', 'weight', 'brokerName', 'brokerContact', 'rateConfirmation', 'actualDeliveryDate'
      ];

      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      updates = filteredUpdates;
    }

    const { data, error } = await supabase
      .from('loads')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', loadId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete load (Owner/Dispatcher only)
  static async deleteLoad(loadId: string) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (!this.canAccess(role, ['owner', 'dispatcher'])) {
      throw new Error('Access denied. Only owners and dispatchers can delete loads.');
    }

    // Verify load belongs to organization
    const { data: load } = await supabase
      .from('loads')
      .select('organization_id')
      .eq('id', loadId)
      .single();

    if (!load || load.organization_id !== orgId) {
      throw new Error('Load not found or access denied.');
    }

    const { error } = await supabase
      .from('loads')
      .delete()
      .eq('id', loadId);

    if (error) throw new Error(error.message);
    return true;
  }
}

// ============================================================================
// ORGANIZATION-AWARE DRIVER SERVICE
// ============================================================================

export class OrgDriverService extends OrgAwareService {
  
  // Get drivers based on user role
  static async getDrivers() {
    const { userId, orgId, role } = await this.getOrgContext();

    if (role === 'driver') {
      // Drivers can only see their own profile
      const { data: driverProfile } = await supabase
      .from('drivers')
      .select('*')
      .eq('organization_id', orgId)
      .eq('userId', userId)
        .maybeSingle();

      return driverProfile ? [driverProfile] : [];
    }

    // Owners and dispatchers see all organization drivers
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        trucks!drivers_currentTruckId_fkey (
          id, name, licensePlate
        )
      `)
      .eq('organization_id', orgId)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Create driver (Owner/Dispatcher for anyone, Driver for self-onboarding only)
  static async createDriver(driverData: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (role === 'driver') {
      // Self-onboarding: drivers may create their own driver row only
      const { data: existing } = await supabase
        .from('drivers')
        .select('id')
        .eq('organization_id', orgId)
        .eq('userId', userId)
        .maybeSingle();

      if (existing?.id) {
        // If already exists, delegate to update to prevent duplicates
        return await this.updateDriver(existing.id, {
          name: driverData.name,
          cdlNumber: driverData.cdlNumber,
          phoneNumber: driverData.phoneNumber,
          email: driverData.email,
        });
      }

      const allowedFields = ['firstName', 'lastName', 'name', 'cdlNumber', 'phoneNumber', 'email'];
      const sanitized = Object.keys(driverData)
        .filter((k) => allowedFields.includes(k))
        .reduce((o, k) => {
          (o as any)[k] = driverData[k];
          return o;
        }, {} as any);

      // Normalize name → first/last if only name provided
      if (!('firstName' in sanitized) && typeof sanitized.name === 'string') {
        const [fn, ...ln] = (sanitized.name as string).trim().split(' ');
        sanitized.firstName = fn || null;
        sanitized.lastName = ln.join(' ') || null;
        // keep name to satisfy NOT NULL constraint
        sanitized.name = (sanitized.name as string) || `${sanitized.firstName || ''} ${sanitized.lastName || ''}`.trim();
      }
      if (!sanitized.name && (sanitized.firstName || sanitized.lastName)) {
        sanitized.name = `${sanitized.firstName || ''} ${sanitized.lastName || ''}`.trim();
      }

      const { data, error } = await supabase
        .from('drivers')
        .insert({
          ...sanitized,
          userId: userId,
          organization_id: orgId,
          auth_user_id: userId
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    // Owners and dispatchers can create any driver in their org
    if (!this.canAccess(role, ['owner', 'dispatcher'])) {
      throw new Error('Access denied.');
    }

    const { data, error } = await supabase
      .from('drivers')
      .insert({
        ...(() => {
          const d = { ...driverData } as any;
          if (!d.firstName && d.name) {
            const [fn, ...ln] = (d.name as string).trim().split(' ');
            d.firstName = fn || null;
            d.lastName = ln.join(' ') || null;
            d.name = (d.name as string) || `${d.firstName || ''} ${d.lastName || ''}`.trim();
          }
          if (!d.name && (d.firstName || d.lastName)) {
            d.name = `${d.firstName || ''} ${d.lastName || ''}`.trim();
          }
          return d;
        })(),
        organization_id: orgId,
        userId: userId,
        auth_user_id: userId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update driver (Owner/Dispatcher for all, Driver for own profile)
  static async updateDriver(driverId: string, updates: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    // Verify driver belongs to organization
    const { data: driver } = await supabase
      .from('drivers')
      .select('organization_id, userId')
      .eq('id', driverId)
      .single();

    if (!driver || driver.organization_id !== orgId) {
      throw new Error('Driver not found or access denied.');
    }

    if (role === 'driver') {
      // Drivers can only update their own profile
      if ((driver as any).userId !== userId) {
        throw new Error('Access denied. You can only update your own profile.');
      }

      // Drivers can update limited fields, including identity data
      const allowedFields = ['firstName', 'lastName', 'name', 'cdlNumber', 'phoneNumber', 'email', 'emergencyContact', 'notes'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      // Normalize name → first/last if needed
      if (!filteredUpdates.firstName && filteredUpdates.name) {
        const [fn, ...ln] = (filteredUpdates.name as string).trim().split(' ');
        filteredUpdates.firstName = fn || null;
        filteredUpdates.lastName = ln.join(' ') || null;
        filteredUpdates.name = (filteredUpdates.name as string) || `${filteredUpdates.firstName || ''} ${filteredUpdates.lastName || ''}`.trim();
      }
      if (!filteredUpdates.name && (filteredUpdates.firstName || filteredUpdates.lastName)) {
        filteredUpdates.name = `${filteredUpdates.firstName || ''} ${filteredUpdates.lastName || ''}`.trim();
      }

      updates = filteredUpdates;
    } else if (!this.canAccess(role, ['owner', 'dispatcher'])) {
      throw new Error('Access denied.');
    }

    const { data, error } = await supabase
      .from('drivers')
      .update({
        ...updates
      })
      .eq('id', driverId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete driver (Owner only)
  static async deleteDriver(driverId: string) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (!this.canAccess(role, ['owner'])) {
      throw new Error('Access denied. Only owners can delete drivers.');
    }

    // Verify driver belongs to organization
    const { data: driver } = await supabase
      .from('drivers')
      .select('organization_id')
      .eq('id', driverId)
      .single();

    if (!driver || (driver as any).organization_id !== orgId) {
      throw new Error('Driver not found or access denied.');
    }

    // Remove driver from trucks and delete HOS logs
    await Promise.all([
      supabase.from('trucks').update({ currentDriverId: null }).eq('currentDriverId', driverId),
      supabase.from('hos_logs').delete().eq('driverId', driverId)
    ]);

    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', driverId);

    if (error) throw new Error(error.message);
    return true;
  }
}

// ============================================================================
// ORGANIZATION-AWARE HOS SERVICE
// ============================================================================

export class OrgHOSService extends OrgAwareService {
  
  // Get HOS logs based on user role
  static async getHosLogs(driverId?: string, truckId?: string) {
    const { userId, orgId, role } = await this.getOrgContext();

    let query = supabase
      .from('hos_logs')
      .select(`
        *,
        drivers!hos_logs_driverId_fkey (
          id, name
        ),
        trucks!hos_logs_truckId_fkey (
          id, name, licensePlate
        )
      `);

    if (role === 'driver') {
      // Drivers see only their own HOS logs
      query = query.eq('driverId', userId);
    } else {
      // Owners and dispatchers see all organization HOS logs
      query = query.eq('organization_id', orgId);

      if (driverId) query = query.eq('driverId', driverId);
      if (truckId) query = query.eq('truckId', truckId);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Create HOS log (All roles can create for themselves, Owner/Dispatcher for others)
  static async createHosLog(hosLogData: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (role === 'driver') {
      // Drivers can only create HOS logs for themselves
      hosLogData.driverId = userId;
    } else if (!this.canAccess(role, ['owner', 'dispatcher'])) {
      throw new Error('Access denied.');
    }

    const { data, error } = await supabase
      .from('hos_logs')
      .insert({
        ...hosLogData,
        organization_id: orgId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update HOS log status (All roles for own logs, Owner/Dispatcher for others)
  static async updateHosLogStatus(hosLogId: string, dutyStatus: string) {
    const { userId, orgId, role } = await this.getOrgContext();

    // Verify HOS log belongs to organization
    const { data: hosLog } = await supabase
      .from('hos_logs')
      .select('organization_id, driverId')
      .eq('id', hosLogId)
      .single();

    if (!hosLog || (hosLog as any).organization_id !== orgId) {
      throw new Error('HOS log not found or access denied.');
    }

    if (role === 'driver' && hosLog.driverId !== userId) {
      throw new Error('Access denied. You can only update your own HOS logs.');
    }

    const { data, error } = await supabase
      .from('hos_logs')
      .update({
        dutyStatus,
        updatedAt: new Date().toISOString()
      })
      .eq('id', hosLogId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

// ============================================================================
// ORGANIZATION-AWARE FUEL SERVICE
// ============================================================================

export class OrgFuelService extends OrgAwareService {
  
  // Get fuel purchases based on user role
  static async getFuelPurchases(loadId?: string, truckId?: string) {
    const { userId, orgId, role } = await this.getOrgContext();

    let query = supabase
      .from('fuel_purchases')
      .select(`
        *,
        trucks!fuel_purchases_truckId_fkey (
          id, name, licensePlate
        ),
        loads!fuel_purchases_loadId_fkey (
          id, originCity, destinationCity
        )
      `);

    if (role === 'driver') {
      // Drivers see only fuel purchases for their assigned truck
      const { data: driverTrucks } = await supabase
        .from('trucks')
        .select('id')
        .eq('organization_id', orgId)
        .eq('currentDriverId', userId);

      const truckIds = driverTrucks?.map(t => t.id) || [];
      if (truckIds.length === 0) {
        return []; // Driver has no assigned truck
      }

      query = query
        .eq('organization_id', orgId)
        .in('truckId', truckIds);
    } else {
      // Owners and dispatchers see all organization fuel purchases
      query = query.eq('organization_id', orgId);
    }

    if (loadId) query = query.eq('loadId', loadId);
    if (truckId) query = query.eq('truckId', truckId);

    const { data, error } = await query.order('purchaseDate', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Create fuel purchase (All roles)
  static async createFuelPurchase(purchaseData: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    if (role === 'driver') {
      // Verify driver can only add fuel for their assigned truck
      const { data: driverTrucks } = await supabase
        .from('trucks')
        .select('id')
        .eq('organization_id', orgId)
        .eq('currentDriverId', userId);

      const truckIds = driverTrucks?.map(t => t.id) || [];
      if (!truckIds.includes(purchaseData.truckId)) {
        throw new Error('Access denied. You can only add fuel for your assigned truck.');
      }
    }

    const { data, error } = await supabase
      .from('fuel_purchases')
      .insert({
        ...purchaseData,
        organization_id: orgId,
        createdBy: userId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Update fuel purchase (Owner/Dispatcher for all, Driver for own entries)
  static async updateFuelPurchase(purchaseId: string, updates: any) {
    const { userId, orgId, role } = await this.getOrgContext();

    // Verify fuel purchase belongs to organization
    const { data: purchase } = await supabase
      .from('fuel_purchases')
      .select('organization_id, createdBy, truckId')
      .eq('id', purchaseId)
      .single();

    if (!purchase || (purchase as any).organization_id !== orgId) {
      throw new Error('Fuel purchase not found or access denied.');
    }

    if (role === 'driver') {
      // Drivers can only update their own entries for their assigned truck
      if (purchase.createdBy !== userId) {
        throw new Error('Access denied. You can only update your own fuel entries.');
      }

      const { data: driverTrucks } = await supabase
        .from('trucks')
        .select('id')
        .eq('organization_id', orgId)
        .eq('currentDriverId', userId);

      const truckIds = driverTrucks?.map(t => t.id) || [];
      if (!truckIds.includes(purchase.truckId)) {
        throw new Error('Access denied.');
      }
    }

    const { data, error } = await supabase
      .from('fuel_purchases')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', purchaseId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete fuel purchase (Owner/Dispatcher for all, Driver for own entries)
  static async deleteFuelPurchase(purchaseId: string) {
    const { userId, orgId, role } = await this.getOrgContext();

    // Verify fuel purchase belongs to organization
    const { data: purchase } = await supabase
      .from('fuel_purchases')
      .select('organization_id, createdBy')
      .eq('id', purchaseId)
      .single();

    if (!purchase || (purchase as any).organization_id !== orgId) {
      throw new Error('Fuel purchase not found or access denied.');
    }

    if (role === 'driver' && purchase.createdBy !== userId) {
      throw new Error('Access denied. You can only delete your own fuel entries.');
    } else if (!this.canAccess(role, ['owner', 'dispatcher', 'driver'])) {
      throw new Error('Access denied.');
    }

    const { error } = await supabase
      .from('fuel_purchases')
      .delete()
      .eq('id', purchaseId);

    if (error) throw new Error(error.message);
    return true;
  }
}

// Note: Classes are exported at declaration time above. No re-exports here to avoid duplicate export errors.
