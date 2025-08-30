import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseDateFilterParams, filterByDateRange, type TimePeriod } from "./utils/date-filter";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Auth interface to match the user object structure
interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    };
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
}
import integrationsRouter from "./routes/integrations";
import integrationRoutes from "./routes/integration-routes";
import recommendationRoutes from "./routes/recommendations";
import { AnalyticsService, createAnalyticsMiddleware } from "./analytics-service";
import { SessionManager } from "./session-manager";
import { enforceUserMetricsPrivacy, requireFounderAccess, filterUserMetricsByPrivacy } from "./privacy-middleware";
import { isFounder, enforceDataIsolation, ensureFounderSetup } from "./founder-middleware";
import { 
  insertTruckSchema, 
  insertLoadSchema, 
  insertActivitySchema,
  insertDriverSchema,
  insertHosLogSchema,
  insertLoadBoardSchema,
  insertTruckCostBreakdownSchema,
  insertLoadPlanSchema,
  insertLoadPlanLegSchema
} from "@shared/schema";
import { calculateDistance, calculateDistanceBetweenCities } from "@shared/distance-utils";

// Helper function to automatically calculate deadhead miles for next load based on previous delivery location
async function calculateAndUpdateDeadheadMiles(truckId: string, deliveredLoadDestinationCity: string, deliveredLoadDestinationState: string) {
  try {
    const deliveryLocation = `${deliveredLoadDestinationCity}, ${deliveredLoadDestinationState}`;
    console.log(`[calculateAndUpdateDeadheadMiles] Calculating deadhead for truck ${truckId} from previous delivery in ${deliveryLocation}`);
    
    // Find all loads for this truck that don't have deadhead miles calculated yet (pending or in_transit)
    const allLoads = await storage.getLoads();
    const truckLoads = allLoads.filter(load => 
      load.truckId === truckId && 
      load.status !== 'delivered' && 
      load.deadheadMiles === 0 // Only update loads that don't have deadhead calculated yet
    );
    
    if (truckLoads.length === 0) {
      console.log(`[calculateAndUpdateDeadheadMiles] No pending loads found for truck ${truckId}`);
      return;
    }
    
    // Sort loads by pickup date to find the next load
    const nextLoad = truckLoads.sort((a, b) => {
      const dateA = new Date(a.pickupDate || a.createdAt || '').getTime();
      const dateB = new Date(b.pickupDate || b.createdAt || '').getTime();
      return dateA - dateB;
    })[0];
    
    if (!nextLoad || !nextLoad.originCity || !nextLoad.originState) {
      console.log(`[calculateAndUpdateDeadheadMiles] Next load has no complete origin location specified`);
      return;
    }
    
    const nextPickupLocation = `${nextLoad.originCity}, ${nextLoad.originState}`;
    
    // Calculate deadhead miles from delivered load destination to next load pickup using city-to-city calculation
    const deadheadMiles = calculateDistanceBetweenCities(
      deliveredLoadDestinationCity,
      deliveredLoadDestinationState,
      nextLoad.originCity,
      nextLoad.originState
    );
    
    if (deadheadMiles > 0) {
      // Update the next load with deadhead information
      const updatedLoad = await storage.updateLoad(nextLoad.id, {
        deadheadFromCity: deliveredLoadDestinationCity,
        deadheadFromState: deliveredLoadDestinationState,
        deadheadMiles: deadheadMiles,
        totalMilesWithDeadhead: nextLoad.miles + deadheadMiles
      });
      
      console.log(`[calculateAndUpdateDeadheadMiles] Updated load ${nextLoad.id} with ${deadheadMiles} deadhead miles from ${deliveryLocation} to ${nextPickupLocation}`);
      
      // Create activity to log this automatic calculation
      await storage.createActivity({
        title: `Deadhead miles auto-calculated`,
        description: `${deadheadMiles} deadhead miles calculated from ${deliveryLocation} to ${nextPickupLocation} for next load`,
        type: "info"
      });
      
      // Update weekly fuel costs to reflect the new deadhead miles
      await updateWeeklyFuelCosts(truckId);
    }
  } catch (error) {
    console.error(`[calculateAndUpdateDeadheadMiles] Error calculating deadhead miles for truck ${truckId}:`, error);
  }
}

// Helper function to update weekly fuel costs for a truck when fuel purchases are attached to loads
async function updateWeeklyFuelCosts(truckId: string) {
  try {
    console.log(`[updateWeeklyFuelCosts] Updating fuel costs and deadhead miles for truck ${truckId}`);
    
    // Get the current week's start and end dates
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of current week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);
    
    // Get only fuel purchases that are attached to loads for this truck
    // This ensures we only include fuel costs for actual revenue-generating operations
    const allFuelPurchases = await storage.getFuelPurchases(undefined, truckId);
    const attachedFuelPurchases = allFuelPurchases.filter(purchase => purchase.loadId !== null);
    
    console.log(`[updateWeeklyFuelCosts] Found ${attachedFuelPurchases.length} fuel purchases attached to loads for truck`);
    
    // Calculate fuel costs and consumption from attached purchases only
    const totalFuelCost = attachedFuelPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalGallons = attachedFuelPurchases.reduce((sum, purchase) => sum + purchase.gallons, 0);
    const avgFuelPrice = totalGallons > 0 ? totalFuelCost / totalGallons : 0;
    
    // Use fuel costs from attached purchases for cost breakdown
    const weeklyFuelCost = totalFuelCost;
    
    console.log(`[updateWeeklyFuelCosts] Attached fuel totals - Cost: $${totalFuelCost.toFixed(2)}, Gallons: ${totalGallons.toFixed(1)}, Avg Price: $${avgFuelPrice.toFixed(4)}`);
    
    // Get loads for this truck during the current week to calculate total miles with deadhead
    const allLoads = await storage.getLoads();
    const weeklyLoads = allLoads.filter(load => {
      if (load.truckId !== truckId) return false;
      const loadDate = new Date(load.createdAt || load.deliveryDate || load.pickupDate || now);
      return loadDate >= weekStart && loadDate <= weekEnd;
    });
    
    // Calculate total miles (revenue + deadhead) for this week
    const totalRevenueMiles = weeklyLoads.reduce((sum, load) => sum + (load.miles || 0), 0);
    const totalDeadheadMiles = weeklyLoads.reduce((sum, load) => sum + (load.deadheadMiles || 0), 0);
    const totalMilesWithDeadhead = totalRevenueMiles + totalDeadheadMiles;
    
    console.log(`[updateWeeklyFuelCosts] Weekly miles breakdown - Revenue: ${totalRevenueMiles}, Deadhead: ${totalDeadheadMiles}, Total: ${totalMilesWithDeadhead}`);
    
    // Get latest cost breakdown for this truck
    const costBreakdowns = await storage.getTruckCostBreakdowns(truckId);
    let latestBreakdown = costBreakdowns.length > 0 ? costBreakdowns[costBreakdowns.length - 1] : null;
    
    if (latestBreakdown) {
      // Recalculate total variable costs including fuel (use weekly fuel cost for cost breakdown)
      const totalVariableCosts = (latestBreakdown.driverPay || 0) + weeklyFuelCost + 
                        (latestBreakdown.maintenance || 0) + (latestBreakdown.iftaTaxes || 0) + 
                        (latestBreakdown.tolls || 0) + (latestBreakdown.dwellTime || 0) + 
                        (latestBreakdown.reeferFuel || 0) + (latestBreakdown.truckParking || 0);
      
      const totalWeeklyCosts = latestBreakdown.totalFixedCosts + totalVariableCosts;
      const costPerMile = totalMilesWithDeadhead > 0 ? 
        Number((totalWeeklyCosts / totalMilesWithDeadhead).toFixed(3)) : 
        Number((totalWeeklyCosts / 3000).toFixed(3)); // Default to 3000 miles if no miles recorded
      
      // Calculate accurate MPG based on total miles driven (loaded + deadhead) vs fuel consumed
      const milesPerGallon = totalGallons > 0 && totalMilesWithDeadhead > 0 ? 
        Number((totalMilesWithDeadhead / totalGallons).toFixed(2)) : 0;
      
      console.log(`[updateWeeklyFuelCosts] MPG Calculation: ${totalMilesWithDeadhead} total miles ÷ ${totalGallons} attached gallons = ${milesPerGallon} MPG`);

      // Update existing breakdown with actual fuel costs and deadhead miles
      const updatedBreakdown = {
        fuel: weeklyFuelCost, // Use weekly fuel cost for cost breakdown
        gallonsUsed: totalGallons, // Use lifetime gallons for accurate MPG calculation
        avgFuelPrice: avgFuelPrice, // Use lifetime average price for consistency
        milesPerGallon: milesPerGallon, // Accurate MPG based on total miles vs gallons consumed
        milesThisWeek: totalRevenueMiles, // Revenue miles only
        totalMilesWithDeadhead: totalMilesWithDeadhead, // All miles driven (revenue + deadhead)
        totalVariableCosts,
        totalWeeklyCosts,
        costPerMile,
      };
      
      console.log(`[updateWeeklyFuelCosts] Updating breakdown with attached fuel cost: $${weeklyFuelCost.toFixed(2)} (MPG based on ${totalGallons} attached gallons)`);
      
      // Update the cost breakdown
      await storage.updateTruckCostBreakdown(latestBreakdown.id, updatedBreakdown);
      
      // Update truck's variable costs
      await storage.updateTruck(truckId, {
        variableCosts: updatedBreakdown.totalVariableCosts
      });
      
      console.log(`[updateWeeklyFuelCosts] Successfully updated costs for truck ${truckId}`);
    } else if (weeklyFuelCost > 0) {
      console.log(`[updateWeeklyFuelCosts] No cost breakdown found for truck ${truckId}, creating one with fuel costs...`);
      
      // Calculate accurate MPG for new breakdown
      const milesPerGallon = totalGallons > 0 && totalMilesWithDeadhead > 0 ? 
        Number((totalMilesWithDeadhead / totalGallons).toFixed(2)) : 0;
      
      console.log(`[updateWeeklyFuelCosts] New breakdown MPG: ${totalMilesWithDeadhead} total miles ÷ ${totalGallons} gallons = ${milesPerGallon} MPG`);
      
      // Create a new cost breakdown for this week with fuel costs from attached purchases
      const newBreakdown = await storage.createTruckCostBreakdown({
        truckId: truckId,
        // Set minimal default costs, focusing on fuel from attached purchases
        truckPayment: 0,
        trailerPayment: 0,
        elogSubscription: 0,
        liabilityInsurance: 0,
        physicalInsurance: 0,
        cargoInsurance: 0,
        trailerInterchange: 0,
        bobtailInsurance: 0,
        nonTruckingLiability: 0,
        basePlateDeduction: 0,
        companyPhone: 0,
        driverPay: 0,
        fuel: weeklyFuelCost, // Use weekly fuel cost for cost breakdown
        maintenance: 0,
        iftaTaxes: 0,
        tolls: 0,
        dwellTime: 0,
        reeferFuel: 0,
        truckParking: 0,
        gallonsUsed: totalGallons, // Use lifetime gallons for accurate MPG calculation
        avgFuelPrice: avgFuelPrice, // Use lifetime average price for consistency
        milesPerGallon: milesPerGallon, // Accurate MPG based on total miles vs gallons consumed
        milesThisWeek: totalMilesWithDeadhead > 0 ? totalMilesWithDeadhead : 3000, // Use actual total miles or default
        weekStarting: weekStart,
        weekEnding: weekEnd
      });
      
      console.log(`[updateWeeklyFuelCosts] Created new breakdown with attached fuel cost: $${weeklyFuelCost.toFixed(2)} (MPG based on ${totalGallons} attached gallons)`);
    }
  } catch (error) {
    console.error(`[updateWeeklyFuelCosts] Error updating fuel costs for truck ${truckId}:`, error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🔥🔥🔥 SERVER RESTARTED - ROUTES REGISTERED 🔥🔥🔥');
  
  // Health check endpoint for deployment
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      service: 'Travectio Fleet Management System',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Auth middleware
  await setupAuth(app);
  
  // Initialize founder setup after authentication is configured
  await ensureFounderSetup();
  
  // Analytics middleware for automatic data tracking
  app.use(createAnalyticsMiddleware());
  
  // Session tracking middleware
  const { sessionMiddleware } = await import("./session-middleware");
  app.use(sessionMiddleware);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin middleware to check if user has admin privileges
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      next();
    } catch (error) {
      console.error('Error checking admin status:', error);
      res.status(500).json({ error: 'Failed to verify admin status' });
    }
  };

  // Log founder access initialization
  console.log('🔐 Access Control: rrivera@travectiosolutions.com = Founder (Complete System Access)');
  console.log('🔐 Access Control: All other users = Individual data access only');

  // GET /api/users - returns all registered users (founder only)
  app.get("/api/users", isAuthenticated, isFounder, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Log admin access to user management
      const userId = req.user?.claims?.sub;
      if (userId && req.sessionId) {
        try {
          await SessionManager.logActivity(
            req.sessionId,
            userId,
            'admin_access',
            '/api/users',
            req.ip,
            req.get('User-Agent'),
            { action: 'view_all_users', userCount: users.length }
          );
        } catch (error) {
          console.log('Failed to log audit activity:', (error as Error).message);
        }
      }
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin delete user route (founder only)
  app.delete("/api/users/:userId", isAuthenticated, isFounder, async (req: any, res) => {
    try {
      const adminUserId = req.user?.claims?.sub;
      const targetUserId = req.params.userId;
      
      if (!adminUserId) {
        return res.status(401).json({ error: "Admin user ID not found" });
      }

      // Get target user details
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent deletion of founder account
      if (targetUser.isFounder) {
        return res.status(403).json({ 
          error: "Founder accounts cannot be deleted for system integrity" 
        });
      }

      // Prevent admin from deleting themselves
      if (targetUserId === adminUserId) {
        return res.status(403).json({ 
          error: "You cannot delete your own account through admin controls" 
        });
      }

      // Log the admin deletion activity
      await storage.createActivity({
        title: 'Admin User Deletion',
        description: `User ${targetUser.email || targetUserId} was deleted by admin`,
        type: 'warning'
      });

      // Delete all user-related data
      // 1. Delete all user's trucks and associated data
      const userTrucks = await storage.getTrucksByUser(targetUserId);
      for (const truck of userTrucks) {
        await storage.deleteTruck(truck.id);
      }

      // 2. Delete all user's loads
      const userLoads = await storage.getLoadsByUser(targetUserId);
      for (const load of userLoads) {
        await storage.deleteLoad(load.id);
      }

      // 3. Delete all user's drivers
      const userDrivers = await storage.getDriversByUser(targetUserId);
      for (const driver of userDrivers) {
        await storage.deleteDriver(driver.id);
      }

      // 4. Actually delete the user record from the database
      const userDeleted = await storage.deleteUser(targetUserId);
      if (!userDeleted) {
        return res.status(500).json({ error: "Failed to delete user record" });
      }

      console.log(`[DELETE /api/users/${targetUserId}] User deleted by admin ${adminUserId}`);
      res.json({ 
        success: true, 
        message: 'User and all associated data deleted successfully' 
      });

    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // GET /api/sessions/statistics - session statistics (founder only)
  app.get("/api/sessions/statistics", isAuthenticated, isFounder, async (req: any, res) => {
    try {
      const statistics = await SessionManager.getSessionStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching session statistics:', error);
      res.status(500).json({ error: 'Failed to fetch session statistics' });
    }
  });

  // GET /api/sessions/audit-logs - get current user's audit logs
  app.get("/api/sessions/audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const limit = parseInt((req.query.limit as string) || '50');
      const logs = await SessionManager.getSessionAuditLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // GET /api/sessions/active - get current user's active sessions
  app.get("/api/sessions/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const sessions = await SessionManager.getActiveSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      res.status(500).json({ error: 'Failed to fetch active sessions' });
    }
  });

  // POST /api/sessions/invalidate - invalidate a specific session
  app.post("/api/sessions/invalidate", isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Verify the session belongs to the current user
      const session = await storage.getUserSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      await SessionManager.invalidateSession(sessionId, 'user_logout');
      res.json({ success: true });
    } catch (error) {
      console.error('Error invalidating session:', error);
      res.status(500).json({ error: 'Failed to invalidate session' });
    }
  });

  // Profile update route
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      // Validate required fields
      if (!updateData.firstName || !updateData.lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Dashboard metrics endpoint with enhanced time filtering for comprehensive business analytics
  app.get("/api/metrics", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      // Support demo mode for founder users
      const demoUserId = req.query.demo_user_id;
      const authenticatedUserId = req.user?.claims?.sub;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      // Use demo user ID if provided and user is founder, otherwise use authenticated user
      const effectiveUserId = demoUserId && req.isFounderAccess ? demoUserId : authenticatedUserId;

      // Fetch data for the effective user (authenticated user or demo user)
      const trucks = await storage.getTrucksByUser(effectiveUserId);
      const loads = await storage.getLoadsByUser(effectiveUserId);
      const allFuelPurchases = await storage.getFuelPurchasesByUser(effectiveUserId);
      
      // Parse date filter parameters with error handling
      let period, range;
      try {
        if (Object.keys(req.query).length > 0) {
          const parsed = parseDateFilterParams(req.query);
          period = parsed.period;
          range = parsed.range;
          
          // Defensive check - if range has invalid dates, skip range filtering
          if (range && (isNaN(range.start.getTime()) || isNaN(range.end.getTime()))) {
            range = undefined;
          }
        }
      } catch (error) {
        period = undefined;
        range = undefined;
      }
      
      // console.log(`[Analytics Metrics] Request for ${period || 'all-time'} metrics with range:`, range);
      
      // Enhanced filtering: Use TOTAL operational data for accurate business analytics
      let filteredLoads, filteredFuelPurchases, timelineMetrics;
      
      if (range && !isNaN(range.start.getTime()) && !isNaN(range.end.getTime())) {
        filteredLoads = filterByDateRange(loads, 'createdAt', range);
        filteredFuelPurchases = filterByDateRange(allFuelPurchases, 'createdAt', range);
        
        // Calculate period-specific metrics
        const periodRevenueMiles = filteredLoads.reduce((sum, load) => sum + (load.miles || 0), 0);
        const periodDeadheadMiles = filteredLoads.reduce((sum, load) => sum + (load.deadheadMiles || 0), 0);
        const periodTotalMiles = periodRevenueMiles + periodDeadheadMiles;
        const periodRevenue = filteredLoads.reduce((sum, load) => sum + (load.pay || 0), 0);
        const periodFuelCosts = filteredFuelPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
        const periodGallons = filteredFuelPurchases.reduce((sum, purchase) => sum + purchase.gallons, 0);
        
        timelineMetrics = {
          period,
          dateRange: range,
          periodStats: {
            loads: filteredLoads.length,
            revenueMiles: periodRevenueMiles,
            deadheadMiles: periodDeadheadMiles, 
            totalMiles: periodTotalMiles,
            revenue: periodRevenue,
            fuelCosts: periodFuelCosts,
            gallonsUsed: periodGallons,
            avgFuelPrice: periodGallons > 0 ? periodFuelCosts / periodGallons : 0,
            mpg: periodGallons > 0 && periodTotalMiles > 0 ? periodTotalMiles / periodGallons : 0,
            revenuePerMile: periodTotalMiles > 0 ? periodRevenue / periodTotalMiles : 0
          }
        };
        
      } else {
        filteredLoads = loads;
        filteredFuelPurchases = allFuelPurchases;
        // console.log(`[Analytics Metrics] Using all-time operational data: ${loads.length} loads, ${allFuelPurchases.length} fuel purchases`);
      }
      
      // Calculate comprehensive metrics from actual operational data
      const activeTrucks = trucks.filter(t => t.isActive === 1);
      
      // Use truck's TOTAL accumulated operational metrics with fallback to loads data
      let totalOperationalMiles = trucks.reduce((sum, truck) => sum + truck.totalMiles, 0);
      
      // If truck miles are 0 but we have loads, calculate directly from loads as fallback
      if (totalOperationalMiles === 0 && filteredLoads.length > 0) {
        totalOperationalMiles = filteredLoads.reduce((sum, load) => {
          const loadMiles = load.totalMilesWithDeadhead || ((load.miles || 0) + (load.deadheadMiles || 0));
          return sum + loadMiles;
        }, 0);
      }
      
      const totalFixedCosts = trucks.reduce((sum, truck) => sum + truck.fixedCosts, 0);
      const totalVariableCosts = trucks.reduce((sum, truck) => sum + truck.variableCosts, 0);
      const totalOperationalCosts = totalFixedCosts + totalVariableCosts;
      
      // Calculate fuel metrics from actual operational data
      let actualFuelCosts = 0;
      let actualGallonsUsed = 0;
      for (const load of filteredLoads) {
        if (load.miles > 0) {
          const fuelPurchases = await storage.getFuelPurchases(load.id);
          const loadFuelCost = fuelPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
          const loadGallons = fuelPurchases.reduce((sum, purchase) => sum + purchase.gallons, 0);
          actualFuelCosts += loadFuelCost;
          actualGallonsUsed += loadGallons;
        }
      }
      
      // CRITICAL: Use truck's calculated CPM directly from storage layer for consistency
      // This ensures metrics match Load Calculator, Truck Profile, and Cost Breakdown exactly
      let comprehensiveCostPerMile = 0;
      
      // If no trucks exist at all, ensure CPM is 0
      if (trucks.length === 0) {
        comprehensiveCostPerMile = 0;
      } else if (activeTrucks.length > 0) {
        // Use the actual CPM from each truck's cost breakdown (matches individual truck display)
        let totalTruckCPM = 0;
        for (const truck of activeTrucks) {
          // Use the truck's calculated costPerMile directly from the storage layer
          if (truck.costPerMile && truck.costPerMile > 0) {
            // Truck has valid cost per mile calculation from cost breakdown
            totalTruckCPM += truck.costPerMile;

          } else if ((truck.fixedCosts || 0) > 0 || (truck.variableCosts || 0) > 0) {
            // Calculate from fixed/variable costs using standard weekly miles (same as cost breakdown)
            const weeklyMiles = 3000;
            const calculatedCPM = (truck.fixedCosts + truck.variableCosts) / weeklyMiles;
            totalTruckCPM += calculatedCPM;

          } else {
            // Fallback: check for cost breakdown data
            const latestBreakdown = await storage.getLatestTruckCostBreakdown(truck.id);
            if (latestBreakdown && latestBreakdown.costPerMile > 0) {
              totalTruckCPM += latestBreakdown.costPerMile;

            } else {
              totalTruckCPM += 0;

            }
          }
        }
        comprehensiveCostPerMile = totalTruckCPM / activeTrucks.length;
        
      }
      
      const utilization = trucks.length > 0 ? (activeTrucks.length / trucks.length) * 100 : 0;
      const totalRevenue = filteredLoads.reduce((sum, load) => sum + (load.pay || 0), 0);
      const avgRevenuePerLoad = filteredLoads.length > 0 ? totalRevenue / filteredLoads.length : 0;
      
      // Calculate revenue per mile
      const revenuePerMile = totalOperationalMiles > 0 ? totalRevenue / totalOperationalMiles : 0;
      
      // Calculate actual operational costs for profit margin calculation using rounded cost per mile for consistency
      const roundedCostPerMile = Number(comprehensiveCostPerMile.toFixed(2));
      const actualOperationalCosts = totalOperationalMiles * roundedCostPerMile;
      
      // Calculate gross profit and profit margin (same method as fleet summary)
      const grossProfit = totalRevenue - actualOperationalCosts;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      

      // Enhanced analytics data structure
      const metrics = {
        // Core operational metrics using TOTAL accumulated data
        costPerMile: Number(comprehensiveCostPerMile.toFixed(2)),
        totalLoads: filteredLoads.length,
        activeTrucks: activeTrucks.length,
        utilization: Number(utilization.toFixed(0)),
        utilizationRate: Number(utilization.toFixed(0)), // Frontend compatibility
        
        // Enhanced business analytics
        totalRevenue: Number(totalRevenue.toFixed(2)),
        avgRevenuePerLoad: Number(avgRevenuePerLoad.toFixed(2)),
        revenuePerMile: Number(revenuePerMile.toFixed(2)),
        profitMargin: Number(profitMargin.toFixed(1)), // Add profit margin calculation
        totalOperationalMiles: totalOperationalMiles,
        totalOperationalCosts: Number(totalOperationalCosts.toFixed(2)),
        actualFuelCosts: Number(actualFuelCosts.toFixed(2)),
        actualGallonsUsed: Number(actualGallonsUsed.toFixed(1)),
        actualMPG: actualGallonsUsed > 0 && totalOperationalMiles > 0 ? 
          Number((totalOperationalMiles / actualGallonsUsed).toFixed(2)) : 0,
        
        // Period-specific analytics if time filtering is active
        ...(timelineMetrics && {
          timelineAnalytics: timelineMetrics,
          periodComparison: {
            periodRevenue: timelineMetrics.periodStats.revenue,
            periodCosts: timelineMetrics.periodStats.fuelCosts,
            periodProfit: timelineMetrics.periodStats.revenue - timelineMetrics.periodStats.fuelCosts,
            periodProfitMargin: timelineMetrics.periodStats.revenue > 0 ? 
              ((timelineMetrics.periodStats.revenue - timelineMetrics.periodStats.fuelCosts) / timelineMetrics.periodStats.revenue) * 100 : 0
          }
        }),
        
        // Add time period info if filtering is active
        ...(period && range && {
          timePeriod: period,
          dateRange: {
            start: range.start.toISOString(),
            end: range.end.toISOString()
          }
        })
      };
      
      // console.log(`[Analytics Metrics] Comprehensive analytics response prepared for ${period || 'all-time'} analysis`);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Comprehensive Business Analytics API for Time Period Reports
  app.get("/api/business-analytics", async (req, res) => {
    try {
      console.log(`[Business Analytics] Comprehensive report request with query:`, req.query);
      
      const trucks = await storage.getTrucks();
      const loads = await storage.getLoads();
      const allFuelPurchases = await storage.getFuelPurchases();
      const costBreakdowns = await storage.getTruckCostBreakdowns("");
      
      // Parse date filter parameters
      const { period, range } = parseDateFilterParams(req.query);
      
      // Filter data by time period if specified
      const filteredLoads = range ? filterByDateRange(loads, 'createdAt', range) : loads;
      const filteredFuelPurchases = range ? filterByDateRange(allFuelPurchases, 'createdAt', range) : allFuelPurchases;
      
      // Calculate comprehensive business metrics
      const activeTrucks = trucks.filter(t => t.isActive === 1);
      
      // Revenue Analysis
      const totalRevenue = filteredLoads.reduce((sum, load) => sum + (load.pay || 0), 0);
      const revenueMiles = filteredLoads.reduce((sum, load) => sum + (load.miles || 0), 0);
      const deadheadMiles = filteredLoads.reduce((sum, load) => sum + (load.deadheadMiles || 0), 0);
      const totalMiles = revenueMiles + deadheadMiles;
      const avgRevenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
      
      // Cost Analysis using TOTAL operational data
      const totalFixedCosts = trucks.reduce((sum, truck) => sum + truck.fixedCosts, 0);
      const totalVariableCosts = trucks.reduce((sum, truck) => sum + truck.variableCosts, 0);
      const totalOperationalCosts = totalFixedCosts + totalVariableCosts;
      
      // Fuel Efficiency Analysis from actual purchases
      let fuelCosts = 0;
      let gallonsUsed = 0;
      let avgFuelPrice = 0;
      
      if (filteredFuelPurchases.length > 0) {
        fuelCosts = filteredFuelPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
        gallonsUsed = filteredFuelPurchases.reduce((sum, purchase) => sum + purchase.gallons, 0);
        avgFuelPrice = gallonsUsed > 0 ? fuelCosts / gallonsUsed : 0;
      }
      
      const actualMPG = gallonsUsed > 0 && totalMiles > 0 ? totalMiles / gallonsUsed : 0;
      
      // Profitability Analysis
      const grossProfit = totalRevenue - totalOperationalCosts;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const profitPerMile = totalMiles > 0 ? grossProfit / totalMiles : 0;
      
      // Fleet Utilization Analysis
      const utilization = trucks.length > 0 ? (activeTrucks.length / trucks.length) * 100 : 0;
      const avgMilesPerTruck = activeTrucks.length > 0 ? totalMiles / activeTrucks.length : 0;
      const avgRevenuePerTruck = activeTrucks.length > 0 ? totalRevenue / activeTrucks.length : 0;
      
      // Load Performance Analysis
      const avgPayPerLoad = filteredLoads.length > 0 ? totalRevenue / filteredLoads.length : 0;
      const avgMilesPerLoad = filteredLoads.length > 0 ? revenueMiles / filteredLoads.length : 0;
      const deadheadPercentage = totalMiles > 0 ? (deadheadMiles / totalMiles) * 100 : 0;
      
      const businessAnalytics = {
        reportMetadata: {
          period: period || 'all-time',
          dateRange: range ? {
            start: range.start.toISOString(),
            end: range.end.toISOString(),
            formatted: `${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`
          } : null,
          generatedAt: new Date().toISOString(),
          totalDataPoints: {
            loads: filteredLoads.length,
            fuelPurchases: filteredFuelPurchases.length,
            trucks: trucks.length,
            activeTrucks: activeTrucks.length
          }
        },
        
        revenueAnalysis: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          revenueMiles: revenueMiles,
          deadheadMiles: deadheadMiles,
          totalMiles: totalMiles,
          avgRevenuePerMile: Number(avgRevenuePerMile.toFixed(3)),
          avgPayPerLoad: Number(avgPayPerLoad.toFixed(2)),
          avgMilesPerLoad: Number(avgMilesPerLoad.toFixed(0)),
          deadheadPercentage: Number(deadheadPercentage.toFixed(1))
        },
        
        costAnalysis: {
          totalFixedCosts: Number(totalFixedCosts.toFixed(2)),
          totalVariableCosts: Number(totalVariableCosts.toFixed(2)),
          totalOperationalCosts: Number(totalOperationalCosts.toFixed(2)),
          fuelCosts: Number(fuelCosts.toFixed(2)),
          avgCostPerMile: Number((totalOperationalCosts / (totalMiles || 1)).toFixed(3))
        },
        
        fuelEfficiencyAnalysis: {
          totalGallonsUsed: Number(gallonsUsed.toFixed(1)),
          totalFuelCosts: Number(fuelCosts.toFixed(2)),
          avgFuelPrice: Number(avgFuelPrice.toFixed(4)),
          actualMPG: Number(actualMPG.toFixed(2)),
          fuelCostPerMile: totalMiles > 0 ? Number((fuelCosts / totalMiles).toFixed(3)) : 0
        },
        
        profitabilityAnalysis: {
          grossProfit: Number(grossProfit.toFixed(2)),
          profitMargin: Number(profitMargin.toFixed(2)),
          profitPerMile: Number(profitPerMile.toFixed(3)),
          profitPerLoad: filteredLoads.length > 0 ? Number((grossProfit / filteredLoads.length).toFixed(2)) : 0
        },
        
        fleetUtilizationAnalysis: {
          totalTrucks: trucks.length,
          activeTrucks: activeTrucks.length,
          utilization: Number(utilization.toFixed(1)),
          avgMilesPerTruck: Number(avgMilesPerTruck.toFixed(0)),
          avgRevenuePerTruck: Number(avgRevenuePerTruck.toFixed(2)),
          avgProfitPerTruck: activeTrucks.length > 0 ? Number((grossProfit / activeTrucks.length).toFixed(2)) : 0
        }
      };
      
      console.log(`[Business Analytics] Comprehensive report generated for ${period || 'all-time'} with ${filteredLoads.length} loads`);
      res.json(businessAnalytics);
      
    } catch (error) {
      console.error("[Business Analytics] Error generating report:", error);
      res.status(500).json({ error: "Failed to generate business analytics report" });
    }
  });

  // Trucks endpoints with time filtering
  app.get("/api/trucks", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      // Support demo mode - use demo user ID if provided, otherwise authenticated user
      const demoUserId = req.query.demo_user_id;
      const authenticatedUserId = req.user?.claims?.sub;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Use demo user ID if provided (demo mode), otherwise use authenticated user
      const effectiveUserId = demoUserId || authenticatedUserId;
      
      // Fetch trucks for the effective user (authenticated user or demo user)
      const trucks = await storage.getTrucksByUser(effectiveUserId);
        
      const { period, range } = parseDateFilterParams(req.query);
      
      // Note: Trucks don't have createdAt in schema, so no date filtering applied
      const filteredTrucks = trucks;
      
      const trucksWithDetails = await Promise.all(
        filteredTrucks.map(async (truck) => {
          let driver = null;
          if (truck.currentDriverId) {
            driver = await storage.getDriver(truck.currentDriverId);
          }
          return {
            ...truck,
            // Use the costPerMile already calculated by the storage layer
            driver: driver || null,
            ...(period && { timePeriod: period })
          };
        })
      );
      res.json(trucksWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trucks" });
    }
  });

  app.get("/api/trucks/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const truck = await storage.getTruck(req.params.id);
      if (!truck) {
        return res.status(404).json({ error: "Truck not found" });
      }
      
      let driver = null;
      if (truck.currentDriverId) {
        driver = await storage.getDriver(truck.currentDriverId);
      }
      
      // Use the costPerMile already calculated by the storage layer
      res.json({
        ...truck,
        driver: driver || null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch truck" });
    }
  });

  // Get truck's last known location for deadhead calculation
  app.get("/api/trucks/:id/last-location", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const location = await storage.getTruckLastKnownLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "No last known location found for truck" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Error fetching truck last location:", error);
      res.status(500).json({ message: "Failed to fetch truck last location" });
    }
  });

  // Manual truck miles recalculation endpoint
  app.post("/api/trucks/:id/recalculate-miles", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`[POST /api/trucks/${id}/recalculate-miles] Manually recalculating truck miles...`);
      
      await storage.updateTruckTotalMiles(id);
      
      const truck = await storage.getTruck(id);
      res.json({ success: true, newTotalMiles: truck?.totalMiles });
    } catch (error) {
      console.error("Error recalculating truck miles:", error);
      res.status(500).json({ message: "Failed to recalculate truck miles" });
    }
  });

  app.get("/api/truck-cost-breakdown/:truckId", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const breakdowns = await storage.getTruckCostBreakdowns(req.params.truckId);
      const latest = breakdowns.length > 0 ? breakdowns[breakdowns.length - 1] : null;
      res.json(latest);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cost breakdown" });
    }
  });

  app.post("/api/trucks/:truckId/cost-breakdowns", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    console.log('🚨🚨🚨 COST BREAKDOWN ENDPOINT HIT! 🚨🚨🚨');
    try {
      console.log('[POST /api/trucks/:truckId/cost-breakdowns] Starting cost breakdown creation');
      const { truckId } = req.params;
      const costData = req.body;
      console.log('[POST /api/trucks/:truckId/cost-breakdowns] Received data:', JSON.stringify(costData, null, 2));
      
      // Ensure required date fields are provided
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7); // Add 7 days
      
      // Map frontend field names to database schema and handle dates
      const breakdown = await storage.createTruckCostBreakdown({
        truckId,
        // Fixed costs
        truckPayment: costData.costBreakdown.truckPayment || 0,
        trailerPayment: costData.costBreakdown.trailerPayment || 0,
        elogSubscription: costData.costBreakdown.elogSubscription || 0,
        liabilityInsurance: costData.costBreakdown.liabilityInsurance || 0,
        physicalInsurance: costData.costBreakdown.physicalInsurance || 0,
        cargoInsurance: costData.costBreakdown.cargoInsurance || 0,
        trailerInterchange: costData.costBreakdown.trailerInterchange || 0,
        bobtailInsurance: costData.costBreakdown.bobtailInsurance || 0,
        nonTruckingLiability: costData.costBreakdown.nonTruckingLiability || 0,
        basePlateDeduction: costData.costBreakdown.basePlateDeduction || 0,
        companyPhone: costData.costBreakdown.companyPhone || 0,
        // Variable costs - convert driverPayPerMile (cents) to weekly driverPay (dollars)
        driverPay: costData.costBreakdown.driverPayPerMile 
          ? (costData.costBreakdown.driverPayPerMile / 100) * 3000  // cents/mile to $/week at 3000 miles
          : (costData.costBreakdown.driverPay || 0),
        fuel: costData.costBreakdown.fuel || 0,
        maintenance: costData.costBreakdown.maintenance || 0,
        iftaTaxes: costData.costBreakdown.iftaTaxes || 0,
        tolls: costData.costBreakdown.tolls || 0,
        dwellTime: costData.costBreakdown.dwellTime || 0,
        reeferFuel: costData.costBreakdown.reeferFuel || 0,
        truckParking: costData.costBreakdown.truckParking || 0,
        // Weekly cost totals and calculated fields
        totalFixedCosts: costData.costBreakdown.totalFixedCosts || 0,
        totalVariableCosts: costData.costBreakdown.totalVariableCosts || 0,
        totalWeeklyCosts: costData.costBreakdown.totalWeeklyCosts || 0,
        costPerMile: costData.costBreakdown.costPerMile || 0,
        // Date fields (required by schema)
        weekStarting: new Date(costData.costBreakdown.weekStarting || now),
        weekEnding: new Date(costData.costBreakdown.weekEnding || weekEnd)
      });
      
      // Update truck with calculated costs
      const truck = await storage.updateTruck(truckId, {
        fixedCosts: costData.costBreakdown.totalFixedCosts,
        variableCosts: costData.costBreakdown.totalVariableCosts
      });
      
      await storage.createActivity({
        title: `Cost breakdown updated`,
        description: `${truck?.name || 'Truck'} cost breakdown set to $${costData.costBreakdown.costPerMile.toFixed(3)}/mile`,
        type: "info",
        relatedTruckId: truckId
      });
      
      console.log('[POST /api/trucks/:truckId/cost-breakdowns] Successfully created breakdown:', breakdown);
      res.json(breakdown);
    } catch (error) {
      console.error("Cost breakdown creation error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: "Failed to create cost breakdown", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch("/api/truck-cost-breakdown/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      let processedData = { ...req.body };
      
      // Convert driverPayPerMile (cents) to driverPay (weekly dollars) if provided
      if (processedData.driverPayPerMile && !processedData.driverPay) {
        processedData.driverPay = (processedData.driverPayPerMile / 100) * 3000;
        delete processedData.driverPayPerMile; // Remove the field that doesn't exist in schema
      }
      
      const updatedBreakdown = await storage.updateTruckCostBreakdown(req.params.id, processedData);
      if (!updatedBreakdown) {
        return res.status(404).json({ error: "Cost breakdown not found" });
      }
      res.json(updatedBreakdown);
    } catch (error) {
      console.error("Error updating cost breakdown:", error);
      res.status(500).json({ error: "Could not save cost changes", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch("/api/trucks/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const updatedTruck = await storage.updateTruck(req.params.id, req.body);
      if (!updatedTruck) {
        return res.status(404).json({ error: "Truck not found" });
      }
      res.json(updatedTruck);
    } catch (error) {
      res.status(500).json({ error: "Failed to update truck" });
    }
  });

  app.delete("/api/trucks/:id", isAuthenticated, enforceDataIsolation, async (req, res) => {
    try {
      const truckId = req.params.id;
      
      // Validate UUID format to prevent injection attempts
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(truckId)) {
        return res.status(400).json({ error: "Invalid truck ID format" });
      }
      
      // Get user ID for ownership verification
      const userId = (req.user as any)?.claims?.sub;
      
      console.log(`[DELETE /api/trucks/:id] Attempting to delete truck with ID: ${truckId} for user: ${userId}`);
      
      // Verify truck ownership before deletion (all users must own their trucks)
      const truck = await storage.getTruck(truckId);
      if (!truck || truck.userId !== userId) {
        console.log(`[DELETE /api/trucks/:id] Access denied - truck ${truckId} not owned by user ${userId}`);
        return res.status(403).json({ error: "Access denied - truck not found or not owned by user" });
      }
      
      const deleted = await storage.deleteTruck(truckId);
      if (!deleted) {
        console.log(`[DELETE /api/trucks/:id] Truck not found: ${truckId}`);
        return res.status(404).json({ error: "Truck not found" });
      }
      console.log(`[DELETE /api/trucks/:id] Successfully deleted truck: ${truckId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE /api/trucks/:id] Delete truck error:", error);
      console.error("[DELETE /api/trucks/:id] Error details:", error.message, error.stack);
      res.status(500).json({ error: "Failed to delete truck" });
    }
  });

  app.post("/api/trucks", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const truckData = req.body;
      
      // CRITICAL SECURITY FIX: Get authenticated user ID
      const userId = req.currentUserId;
      if (!userId) {
        console.error("[SECURITY] No user ID found in truck creation request");
        return res.status(401).json({ error: "User authentication failed" });
      }
      
      // If driver name is provided, create the driver first
      let currentDriverId = null;
      if (truckData.driverName && truckData.driverName.trim()) {
        const driver = await storage.createDriver({
          name: truckData.driverName.trim(),
          cdlNumber: `CDL-${Date.now()}`, // Generate temporary CDL number
          isActive: 1,
          userId: userId // SECURITY FIX: Set driver owner
        });
        currentDriverId = driver.id;
      }
      
      // Create the truck with proper user ownership
      console.log(`[SECURITY] Creating truck for user: ${userId}`);
      const truck = await storage.createTruck({
        name: truckData.name,
        fixedCosts: truckData.fixedCosts || 0,
        variableCosts: truckData.variableCosts || 0,
        totalMiles: truckData.totalMiles || 0,
        isActive: truckData.isActive || 1,
        vin: truckData.vin,
        licensePlate: truckData.licensePlate,
        eldDeviceId: truckData.eldDeviceId,
        currentDriverId,
        equipmentType: truckData.equipmentType || "Dry Van",
        userId: userId, // CRITICAL SECURITY FIX: Set truck owner
        // Add integration options
        loadBoardIntegration: truckData.loadBoardIntegration || "manual",
        elogsIntegration: truckData.elogsIntegration || "manual",
        preferredLoadBoard: truckData.preferredLoadBoard || "",
        elogsProvider: truckData.elogsProvider || ""
      });

      // Add cost breakdown if provided
      if (truckData.costBreakdown && truck.id) {
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7); // Add 7 days
        
        await storage.createTruckCostBreakdown({
          truckId: truck.id,
          ...truckData.costBreakdown,
          weekStarting: new Date(truckData.costBreakdown.weekStarting || now),
          weekEnding: new Date(truckData.costBreakdown.weekEnding || weekEnd)
        });
      }
      
      // Create activity for new truck
      await storage.createActivity({
        title: `New truck added to fleet`,
        description: `${truck.name} registered with detailed cost breakdown`,
        type: "info"
      });
      
      // Return consistent response structure
      return res.status(201).json({
        success: true,
        truck: truck,
        id: truck.id // Make sure ID is available at top level for frontend
      });
    } catch (error) {
      console.error("ERROR adding truck:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to add truck",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Loads endpoints with fuel purchase integration
  app.get("/api/loads", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      // Support demo mode for founder users
      const demoUserId = req.query.demo_user_id;
      const authenticatedUserId = req.user?.claims?.sub;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Use demo user ID if provided and user is founder, otherwise use authenticated user
      const effectiveUserId = demoUserId && req.isFounderAccess ? demoUserId : authenticatedUserId;
      
      // Fetch loads for the effective user (authenticated user or demo user)
      const loads = await storage.getLoadsByUser(effectiveUserId);
      const { period, range } = parseDateFilterParams(req.query);
      
      // Filter loads by date range
      const filteredLoads = range ? filterByDateRange(loads, 'createdAt', range) : loads;
      
      // Enhanced loads with comprehensive cost calculations
      const enhancedLoads = await Promise.all(
        filteredLoads.map(async (load) => {
          // Get fuel purchases for this load
          const fuelPurchases = await storage.getFuelPurchases(load.id);
          
          // Calculate actual fuel costs
          const actualFuelCost = fuelPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
          const actualGallons = fuelPurchases.reduce((sum, purchase) => sum + purchase.gallons, 0);
          
          // Calculate estimated fuel cost (assuming 6.5 MPG and current price)
          const estimatedMpg = 6.5;
          const estimatedGallons = load.miles / estimatedMpg;
          const avgFuelPrice = 3.45; // Average fuel price - could be dynamic
          const estimatedFuelCost = estimatedGallons * avgFuelPrice;
          
          // Calculate fuel cost per mile
          const actualFuelCostPerMile = load.miles > 0 ? actualFuelCost / load.miles : 0;
          const estimatedFuelCostPerMile = load.miles > 0 ? estimatedFuelCost / load.miles : 0;
          
          // Get truck fixed and variable costs if load is assigned to a truck
          let truckFixedCostPerMile = 0;
          let truckVariableCostPerMile = 0;
          let truckCostPerMile = 0;
          let totalCostPerMile = 0;
          let netProfit = 0;
          let profitPerMile = 0;
          
          if (load.truckId) {
            const truck = await storage.getTruck(load.truckId);
            if (truck) {
              // Calculate truck cost per mile (fixed + variable)
              // Fixed and variable costs are WEEKLY costs, so divide by weekly miles (not lifetime total)
              const standardWeeklyMiles = 3000; // Standard industry weekly miles
              truckFixedCostPerMile = truck.fixedCosts / standardWeeklyMiles;
              truckVariableCostPerMile = truck.variableCosts / standardWeeklyMiles;
              truckCostPerMile = truckFixedCostPerMile + truckVariableCostPerMile;
              
              // Calculate total cost per mile including fuel
              const fuelCostPerMile = fuelPurchases.length > 0 ? actualFuelCostPerMile : estimatedFuelCostPerMile;
              totalCostPerMile = truckCostPerMile + fuelCostPerMile;
              
              // Calculate net profit
              const totalCosts = totalCostPerMile * load.miles;
              netProfit = load.pay - totalCosts;
              profitPerMile = load.miles > 0 ? netProfit / load.miles : 0;
            }
          }
          
          return {
            ...load,
            // Fuel cost breakdown
            estimatedFuelCost: Number(estimatedFuelCost.toFixed(2)),
            actualFuelCost: Number(actualFuelCost.toFixed(2)),
            estimatedGallons: Number(estimatedGallons.toFixed(1)),
            actualGallons: Number(actualGallons.toFixed(1)),
            estimatedFuelCostPerMile: Number(estimatedFuelCostPerMile.toFixed(3)),
            actualFuelCostPerMile: Number(actualFuelCostPerMile.toFixed(3)),
            fuelPurchasesCount: fuelPurchases.length,
            hasFuelPurchases: fuelPurchases.length > 0,
            // Comprehensive cost breakdown
            truckFixedCostPerMile: Number(truckFixedCostPerMile.toFixed(3)),
            truckVariableCostPerMile: Number(truckVariableCostPerMile.toFixed(3)),
            truckCostPerMile: Number(truckCostPerMile.toFixed(3)),
            totalCostPerMile: Number(totalCostPerMile.toFixed(3)),
            netProfit: Number(netProfit.toFixed(2)),
            profitPerMile: Number(profitPerMile.toFixed(3)),
            ...(period && { timePeriod: period })
          };
        })
      );
      
      res.json(enhancedLoads);
    } catch (error) {
      console.error("Error fetching loads with fuel data:", error);
      res.status(500).json({ error: "Failed to fetch loads" });
    }
  });

  app.post("/api/loads", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      console.log("[POST /api/loads] Received data:", JSON.stringify(req.body, null, 2));
      console.log("[POST /api/loads] Deadhead fields in request:", {
        deadheadMiles: req.body.deadheadMiles,
        deadheadFromCity: req.body.deadheadFromCity,
        deadheadFromState: req.body.deadheadFromState,
        totalMilesWithDeadhead: req.body.totalMilesWithDeadhead
      });
      
      const validatedData = insertLoadSchema.parse(req.body);
      console.log("[POST /api/loads] Validation successful:", JSON.stringify(validatedData, null, 2));
      console.log("[POST /api/loads] Deadhead fields after validation:", {
        deadheadMiles: validatedData.deadheadMiles,
        deadheadFromCity: validatedData.deadheadFromCity,
        deadheadFromState: validatedData.deadheadFromState,
        totalMilesWithDeadhead: validatedData.totalMilesWithDeadhead
      });
      
      const load = await storage.createLoad(validatedData);
      console.log("[POST /api/loads] Created load with deadhead:", {
        id: load.id,
        deadheadMiles: load.deadheadMiles,
        totalMilesWithDeadhead: load.totalMilesWithDeadhead
      });
      
      // Create activity for new load
      await storage.createActivity({
        title: `New load created`,
        description: `${load.type} load for ${load.miles} miles at $${load.pay}`,
        type: "info"  
      });
      
      res.json(load);
    } catch (error) {
      console.error("[POST /api/loads] Validation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid load data" });
      }
    }
  });

  // PUT endpoint for load updates
  app.put("/api/loads/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const loadId = req.params.id;
      console.log(`[PUT /api/loads/${loadId}] Received data:`, JSON.stringify(req.body, null, 2));
      
      const validatedData = insertLoadSchema.partial().parse(req.body);
      console.log(`[PUT /api/loads/${loadId}] Validation successful:`, JSON.stringify(validatedData, null, 2));
      
      const updatedLoad = await storage.updateLoad(loadId, validatedData);
      if (!updatedLoad) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Create activity for load update
      await storage.createActivity({
        title: `Load updated`,
        description: `${updatedLoad.type} load updated - ${updatedLoad.originCity}, ${updatedLoad.originState} → ${updatedLoad.destinationCity}, ${updatedLoad.destinationState}`,
        type: "info"
      });
      
      res.json(updatedLoad);
    } catch (error) {
      console.error(`[PUT /api/loads/:id] Error:`, error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update load entry" });
      }
    }
  });

  // Load Stops routes - Multi-stop load management
  app.get("/api/loads/:loadId/stops", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { loadId } = req.params;
      const stops = await storage.getLoadStops(loadId);
      res.json(stops);
    } catch (error) {
      console.error("Error fetching load stops:", error);
      res.status(500).json({ message: "Failed to fetch load stops" });
    }
  });

  app.post("/api/loads/:loadId/stops", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { loadId } = req.params;
      console.log(`[POST /api/loads/${loadId}/stops] Creating stop:`, JSON.stringify(req.body, null, 2));
      
      const stopData = {
        ...req.body,
        loadId,
        id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      const stop = await storage.createLoadStop(stopData);
      console.log(`[POST /api/loads/${loadId}/stops] Successfully created stop:`, stop);
      
      await storage.createActivity({
        title: `Load stop added`,
        description: `${stop.stopType} stop added: ${stop.city}, ${stop.state}`,
        type: "info"
      });
      
      res.json(stop);
    } catch (error) {
      console.error("Error creating load stop:", error);
      res.status(500).json({ message: "Failed to create load stop" });
    }
  });

  app.put("/api/load-stops/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`[PUT /api/load-stops/${id}] Updating stop:`, JSON.stringify(req.body, null, 2));
      
      const updatedStop = await storage.updateLoadStop(id, req.body);
      if (!updatedStop) {
        return res.status(404).json({ message: "Load stop not found" });
      }

      await storage.createActivity({
        title: `Load stop updated`,
        description: `${updatedStop.stopType} stop updated: ${updatedStop.city}, ${updatedStop.state}`,
        type: "info"
      });
      
      res.json(updatedStop);
    } catch (error) {
      console.error("Error updating load stop:", error);
      res.status(500).json({ message: "Failed to update load stop" });
    }
  });

  app.delete("/api/load-stops/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`[DELETE /api/load-stops/${id}] Deleting stop`);
      
      const deleted = await storage.deleteLoadStop(id);
      if (!deleted) {
        return res.status(404).json({ message: "Load stop not found" });
      }

      await storage.createActivity({
        title: `Load stop removed`,
        description: `Load stop deleted from multi-stop load`,
        type: "info"
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting load stop:", error);
      res.status(500).json({ message: "Failed to delete load stop" });
    }
  });

  // Fuel Purchase routes
  app.get("/api/fuel-purchases", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const { loadId, truckId, demo_user_id } = req.query;
      
      // Support demo mode - use demo_user_id if provided by founder, otherwise use actual user ID  
      const effectiveUserId = demo_user_id && req.isFounderAccess ? demo_user_id as string : userId;
      
      
      // All users (including founders) only see their own fuel purchases for data isolation
      const purchases = await storage.getFuelPurchasesByUser(effectiveUserId, loadId as string, truckId as string);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching fuel purchases:", error);
      res.status(500).json({ message: "Failed to fetch fuel purchases" });
    }
  });

  app.post("/api/fuel-purchases", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      console.log("[POST /api/fuel-purchases] Request body:", JSON.stringify(req.body, null, 2));
      
      // Validate required fields
      const { truckId, gallons, pricePerGallon, totalCost, purchaseDate } = req.body;
      
      if (!truckId || !gallons || !pricePerGallon || !totalCost) {
        return res.status(400).json({ 
          message: "Missing required fields: truckId, gallons, pricePerGallon, totalCost" 
        });
      }

      // Verify the truck belongs to the authenticated user
      const truck = await storage.getTruck(truckId);
      if (!truck || truck.userId !== userId) {
        return res.status(403).json({ error: "Access denied: Truck not found or not owned by user" });
      }
      
      // Convert purchaseDate string to Date object if provided
      const processedData = {
        ...req.body,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date()
      };
      
      console.log("[POST /api/fuel-purchases] Processed data:", JSON.stringify(processedData, null, 2));
      
      const purchase = await storage.createFuelPurchase(processedData);
      console.log("[POST /api/fuel-purchases] Successfully created fuel purchase:", purchase);
      
      // Note: Fuel purchases are tracked separately from weekly cost breakdowns
      // Weekly cost breakdown remains manual for driver entry
      
      // Create activity for fuel purchase
      await storage.createActivity({
        title: `Fuel purchase recorded`,
        description: `${gallons.toFixed(1)} gallons at $${pricePerGallon.toFixed(2)}/gal for $${totalCost.toFixed(2)}`,
        type: "info",
        relatedTruckId: truckId
      });
      
      res.json(purchase);
    } catch (error) {
      console.error("Error creating fuel purchase:", error);
      res.status(500).json({ message: "Failed to create fuel purchase", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete fuel purchase
  app.delete("/api/fuel-purchases/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      // Get the fuel purchase before deleting to know which truck to update
      const fuelPurchases = await storage.getFuelPurchasesByUser(userId);
      const purchaseToDelete = fuelPurchases.find(p => p.id === req.params.id);
      
      if (!purchaseToDelete) {
        return res.status(404).json({ message: "Fuel purchase not found or access denied" });
      }
      
      const deleted = await storage.deleteFuelPurchase(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Fuel purchase not found" });
      }
      
      // Note: Fuel purchases are tracked separately from weekly cost breakdowns
      // Weekly cost breakdown remains manual for driver entry
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting fuel purchase:", error);
      res.status(500).json({ message: "Failed to delete fuel purchase" });
    }
  });

  // Update fuel purchase
  app.put("/api/fuel-purchases/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      console.log(`[PUT /api/fuel-purchases/${req.params.id}] Request body:`, JSON.stringify(req.body, null, 2));
      
      // Convert purchaseDate string to Date object if provided
      const processedData = {
        ...req.body,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined
      };
      
      // Verify the fuel purchase belongs to the authenticated user
      const existingPurchases = await storage.getFuelPurchasesByUser(userId);
      const existingPurchase = existingPurchases.find(p => p.id === req.params.id);
      if (!existingPurchase) {
        return res.status(404).json({ message: "Fuel purchase not found or access denied" });
      }

      const updated = await storage.updateFuelPurchase(req.params.id, processedData);
      if (!updated) {
        return res.status(404).json({ message: "Fuel purchase not found" });
      }
      
      console.log(`[PUT /api/fuel-purchases/${req.params.id}] Successfully updated fuel purchase:`, updated);
      
      // Create activity for fuel purchase update
      await storage.createActivity({
        title: `Fuel purchase updated`,
        description: `Updated fuel purchase: ${updated.gallons?.toFixed(1)} gallons at $${updated.pricePerGallon?.toFixed(2)}/gal for $${updated.totalCost?.toFixed(2)}`,
        type: "info",
        relatedTruckId: updated.truckId
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating fuel purchase:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Attach/detach fuel purchase to/from load
  app.patch("/api/fuel-purchases/:id/attach", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { loadId } = req.body;
      const updated = await storage.updateFuelPurchase(req.params.id, { loadId });
      if (!updated) {
        return res.status(404).json({ message: "Fuel purchase not found" });
      }
      
      // Update weekly fuel costs when fuel purchase is attached to a load
      if (loadId && updated.truckId) {
        console.log(`[ATTACH] Fuel purchase ${req.params.id} attached to load ${loadId}, updating weekly costs for truck ${updated.truckId}`);
        await updateWeeklyFuelCosts(updated.truckId);
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error attaching fuel purchase:", error);
      res.status(500).json({ message: "Failed to attach fuel purchase" });
    }
  });

  // Manual trigger for fuel cost updates (for debugging/testing)
  app.post("/api/trucks/:truckId/update-fuel-costs", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { truckId } = req.params;
      console.log(`[MANUAL] Manually updating fuel costs for truck ${truckId}`);
      await updateWeeklyFuelCosts(truckId);
      res.json({ success: true, message: "Fuel costs updated successfully" });
    } catch (error) {
      console.error("Error updating fuel costs:", error);
      res.status(500).json({ message: "Failed to update fuel costs" });
    }
  });

  // Load status update endpoint with automatic deadhead calculation
  app.patch("/api/loads/:id/status", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const loadId = req.params.id;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Get the current load before updating to check previous status
      const currentLoad = await storage.getLoad(loadId);
      if (!currentLoad) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      const updatedLoad = await storage.updateLoad(loadId, { status });
      if (!updatedLoad) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Automatic deadhead calculation: When a load is marked as delivered
      if (status === 'delivered' && currentLoad.status !== 'delivered' && updatedLoad.truckId && updatedLoad.destinationCity && updatedLoad.destinationState) {
        console.log(`[PATCH /api/loads/:id/status] Load ${loadId} marked as delivered. Triggering automatic deadhead calculation for truck ${updatedLoad.truckId}`);
        
        // Calculate deadhead miles for the next load for this truck using actual delivery location
        await calculateAndUpdateDeadheadMiles(updatedLoad.truckId, updatedLoad.destinationCity, updatedLoad.destinationState);
      }
      
      // Create activity for status change
      await storage.createActivity({
        title: `Load status changed`,
        description: `Load ${updatedLoad.type} status changed to ${status}`,
        type: "info"
      });
      
      res.json(updatedLoad);
    } catch (error) {
      console.error("Error updating load status:", error);
      res.status(500).json({ message: "Failed to update load status" });
    }
  });

  // Load editing endpoint
  app.patch("/api/loads/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const loadId = req.params.id;
      const updatedLoad = await storage.updateLoad(loadId, req.body);
      if (!updatedLoad) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Create activity for load update
      await storage.createActivity({
        title: `Load updated`,
        description: `${updatedLoad.type} load updated - ${updatedLoad.originCity}, ${updatedLoad.originState} → ${updatedLoad.destinationCity}, ${updatedLoad.destinationState}`,
        type: "info"
      });
      
      res.json(updatedLoad);
    } catch (error) {
      console.error("Error updating load:", error);
      res.status(500).json({ message: "Failed to update load" });
    }
  });

  // Delete load endpoint
  app.delete("/api/loads/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const loadId = req.params.id;
      console.log(`[DELETE /api/loads/${loadId}] Attempting to delete load`);
      
      // Get the load before deleting for activity logging and truck updates
      const loadToDelete = await storage.getLoad(loadId);
      if (!loadToDelete) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      const deleted = await storage.deleteLoad(loadId);
      if (!deleted) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Auto-update truck total miles if load was assigned to a truck
      if (loadToDelete.truckId) {
        console.log(`[DELETE /api/loads/${loadId}] Recalculating truck miles after deletion...`);
        await storage.updateTruckTotalMiles(loadToDelete.truckId);
        console.log(`[DELETE /api/loads/${loadId}] Truck miles automatically updated`);
      }
      
      // Create activity for load deletion
      await storage.createActivity({
        title: `Load deleted`,
        description: `${loadToDelete.type} load deleted - ${loadToDelete.originCity}, ${loadToDelete.originState} → ${loadToDelete.destinationState}, ${loadToDelete.destinationState}`,
        type: "warning"
      });
      
      console.log(`[DELETE /api/loads/${loadId}] Load successfully deleted. Truck miles updated automatically via automated system.`);
      res.json({ success: true });
    } catch (error) {
      console.error(`[DELETE /api/loads/:id] Error:`, error);
      res.status(500).json({ message: "Failed to delete load" });
    }
  });

  // Load categories breakdown
  app.get("/api/load-categories", isAuthenticated, async (req: any, res) => {
    try {
      const loads = await storage.getLoads();
      
      const categories = {
        dryVan: loads.filter(l => l.type === "Dry Van").length,
        reefer: loads.filter(l => l.type === "Reefer").length,
        flatbed: loads.filter(l => l.type === "Flatbed").length
      };
      
      const profitability = {
        dryVan: loads.filter(l => l.type === "Dry Van" && l.isProfitable === 1).length / 
                Math.max(categories.dryVan, 1) * 100,
        reefer: loads.filter(l => l.type === "Reefer" && l.isProfitable === 1).length / 
                Math.max(categories.reefer, 1) * 100,
        flatbed: loads.filter(l => l.type === "Flatbed" && l.isProfitable === 1).length / 
                 Math.max(categories.flatbed, 1) * 100
      };
      
      res.json({ categories, profitability });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch load categories" });
    }
  });

  // Activities endpoint
  app.get("/api/activities", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities.slice(0, 10)); // Return last 10 activities
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Cost per mile trend data (mock data for chart)
  app.get("/api/cost-trend", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      // Mock monthly data - in real app would calculate from historical data
      const trendData = [
        { month: "Jan", costPerMile: 2.1 },
        { month: "Feb", costPerMile: 1.9 },
        { month: "Mar", costPerMile: 1.8 },
        { month: "Apr", costPerMile: 2.0 },
        { month: "May", costPerMile: 2.1 },
        { month: "Jun", costPerMile: 2.0 },
        { month: "Sep", costPerMile: 1.97 }
      ];
      
      res.json(trendData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cost trend" });
    }
  });

  // Driver management endpoints
  app.get("/api/drivers", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      // Support demo mode for founder users
      const demoUserId = req.query.demo_user_id;
      const authenticatedUserId = req.user?.claims?.sub;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      // Use demo user ID if provided and user is founder, otherwise use authenticated user
      const effectiveUserId = demoUserId && req.isFounderAccess ? demoUserId : authenticatedUserId;
      
      // Fetch drivers for the effective user (authenticated user or demo user)
      const drivers = await storage.getDriversByUser(effectiveUserId);
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.post("/api/drivers", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const validatedData = insertDriverSchema.parse({
        ...req.body,
        userId: userId // Ensure driver is associated with the authenticated user
      });
      const driver = await storage.createDriver(validatedData);
      
      await storage.createActivity({
        title: `New driver added`,
        description: `${driver.name} (${driver.cdlNumber}) joined the fleet`,
        type: "info",
        relatedDriverId: driver.id
      });
      
      res.json(driver);
    } catch (error) {
      res.status(400).json({ error: "Invalid driver data" });
    }
  });

  // Update driver
  app.put("/api/drivers/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const driverId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      console.log(`[PUT /api/drivers/${driverId}] Request:`, JSON.stringify(req.body, null, 2));
      
      // Verify the driver belongs to the authenticated user (unless founder)
      const existingDriver = await storage.getDriver(driverId);
      if (!existingDriver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // Only allow user to edit their own drivers (strict data isolation)
      if (existingDriver.userId !== userId) {
        return res.status(403).json({ error: "Access denied: Cannot edit driver belonging to another user" });
      }
      
      // Validate the updated data (partial schema allows updating specific fields)
      const validatedData = insertDriverSchema.partial().parse(req.body);
      console.log(`[PUT /api/drivers/${driverId}] Validation successful:`, validatedData);
      
      const updatedDriver = await storage.updateDriver(driverId, validatedData);
      if (!updatedDriver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // Create activity for driver update
      await storage.createActivity({
        title: `Driver updated`,
        description: `${updatedDriver.name} (${updatedDriver.cdlNumber}) profile updated`,
        type: "info",
        relatedDriverId: driverId
      });
      
      console.log(`[PUT /api/drivers/${driverId}] Successfully updated driver:`, updatedDriver);
      res.json(updatedDriver);
    } catch (error) {
      console.error(`[PUT /api/drivers/:id] Error:`, error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update driver" });
      }
    }
  });

  app.delete("/api/drivers/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const driverId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      // Get driver details before deletion for activity log
      const driver = await storage.getDriver(driverId);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // Only allow user to delete their own drivers (strict data isolation)
      if (driver.userId !== userId) {
        return res.status(403).json({ error: "Access denied: Cannot delete driver belonging to another user" });
      }
      
      // Check if driver is currently assigned to any trucks and unassign them automatically
      const trucks = await storage.getTrucksByUser(userId);
      const assignedTrucks = trucks.filter(truck => truck.currentDriverId === driverId);
      
      // Automatically unassign driver from trucks before deletion
      if (assignedTrucks.length > 0) {
        console.log(`[DELETE /api/drivers/${driverId}] Auto-unassigning driver from ${assignedTrucks.length} truck(s)`);
        for (const truck of assignedTrucks) {
          await storage.updateTruck(truck.id, { currentDriverId: null });
        }
      }
      
      const deleted = await storage.deleteDriver(driverId);
      if (!deleted) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // Create activity for driver deletion
      const activityDescription = assignedTrucks.length > 0 
        ? `${driver.name} (${driver.cdlNumber}) has been removed from the system and automatically unassigned from ${assignedTrucks.length} truck(s)`
        : `${driver.name} (${driver.cdlNumber}) has been removed from the system`;
      
      await storage.createActivity({
        title: `Driver removed from fleet`,
        description: activityDescription,
        type: "warning"
      });
      
      console.log(`[DELETE /api/drivers/${driverId}] Successfully deleted driver: ${driver.name}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete driver error:", error);
      res.status(500).json({ error: "Failed to delete driver" });
    }
  });

  // ELD Hours of Service endpoints
  app.get("/api/hos-logs", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { driverId, truckId } = req.query;
      const logs = await storage.getHosLogs(
        driverId as string, 
        truckId as string
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch HOS logs" });
    }
  });

  app.post("/api/hos-logs", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const validatedData = insertHosLogSchema.parse(req.body);
      const log = await storage.createHosLog(validatedData);
      
      // Check for violations and create activity
      if (validatedData.violations && validatedData.violations.length > 0) {
        await storage.createActivity({
          title: `HOS violation detected`,
          description: `Driver has ${validatedData.violations.length} violation(s)`,
          type: "hos_violation",
          relatedDriverId: validatedData.driverId,
          relatedTruckId: validatedData.truckId
        });
      }
      
      res.json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid HOS log data" });
    }
  });

  // HOS status update endpoint
  app.patch("/api/hos-logs/:id/status", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const hosLogId = req.params.id;
      const { dutyStatus } = req.body;
      
      if (!dutyStatus) {
        return res.status(400).json({ message: "Duty status is required" });
      }
      
      const updatedLog = await storage.updateHosLog(hosLogId, { dutyStatus });
      if (!updatedLog) {
        return res.status(404).json({ message: "HOS log not found" });
      }
      
      // Create activity for status change
      await storage.createActivity({
        title: `HOS status changed`,
        description: `Driver status changed to ${dutyStatus.replace('_', ' ').toLowerCase()}`,
        type: "info",
        relatedDriverId: updatedLog.driverId,
        relatedTruckId: updatedLog.truckId
      });
      
      res.json(updatedLog);
    } catch (error) {
      console.error("Error updating HOS status:", error);
      res.status(500).json({ message: "Failed to update HOS status" });
    }
  });

  app.get("/api/hos-status/:driverId", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { driverId } = req.params;
      const status = await storage.getLatestHosStatus(driverId);
      
      if (!status) {
        return res.status(404).json({ error: "No HOS data found for driver" });
      }
      
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch HOS status" });
    }
  });

  // Load Board endpoints
  app.get("/api/load-board", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { equipmentType, demo_user_id } = req.query;
      
      // Support demo mode
      const effectiveUserId = demo_user_id || req.user.id;
      
      const loads = equipmentType ? 
        await storage.getAvailableLoads(equipmentType as string, effectiveUserId) :
        await storage.getAvailableLoads(undefined, effectiveUserId);
      res.json(loads);
    } catch (error) {
      console.error('[Load Board API] Error:', error);
      res.status(500).json({ error: "Failed to fetch load board items" });
    }
  });

  app.post("/api/load-board", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const validatedData = insertLoadBoardSchema.parse(req.body);
      const item = await storage.createLoadBoardItem(validatedData);
      
      await storage.createActivity({
        title: `New load opportunity`,
        description: `${item.originCity}, ${item.originState} → ${item.destinationCity}, ${item.destinationState} | $${item.ratePerMile}/mi`,
        type: "info"
      });
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid load board data" });
    }
  });

  app.post("/api/load-board", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const loadData = req.body;
      
      // Generate a unique external ID if not provided
      if (!loadData.externalId) {
        loadData.externalId = `MANUAL-${Date.now()}`;
      }
      
      const newLoad = await storage.createLoadBoardItem({
        loadBoardSource: loadData.loadBoardSource || "Manual Entry",
        externalId: loadData.externalId,
        equipmentType: loadData.equipmentType,
        originCity: loadData.originCity,
        originState: loadData.originState,
        destinationCity: loadData.destinationCity,
        destinationState: loadData.destinationState,
        miles: loadData.miles,
        rate: loadData.rate,
        ratePerMile: loadData.ratePerMile,
        pickupDate: loadData.pickupDate,
        deliveryDate: loadData.deliveryDate,
        weight: loadData.weight,
        commodity: loadData.commodity,
        brokerName: loadData.brokerName,
        brokerMc: loadData.brokerMc,
        status: "available"
      });
      
      // Create activity for manual load entry
      await storage.createActivity({
        title: "Manual load added",
        description: `Load ${newLoad.externalId} manually added to load board`,
        type: "load_added"
      });
      
      res.json(newLoad);
    } catch (error) {
      console.error("Failed to create load board item:", error);
      res.status(500).json({ error: "Failed to create load" });
    }
  });

  app.patch("/api/load-board/:id/status", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const item = await storage.updateLoadBoardStatus(id, status);
      
      if (!item) {
        return res.status(404).json({ error: "Load not found" });
      }
      
      if (status === "assigned") {
        await storage.createActivity({
          title: `Load assigned`,
          description: `Load ${item.externalId} from ${item.loadBoardSource} has been assigned`,
          type: "load_assigned"
        });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update load status" });
    }
  });

  // Fleet metrics endpoints for scalable dashboard
  app.get("/api/fleet-metrics", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { fleetSize } = req.query;
      const metrics = await storage.getFleetMetrics(fleetSize as string);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fleet metrics" });
    }
  });

  app.get("/api/fleet-summary", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      // Support demo mode for founder users
      const demoUserId = req.query.demo_user_id;
      const authenticatedUserId = req.user?.claims?.sub;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Use demo user ID if provided and user is founder, otherwise use authenticated user
      const effectiveUserId = demoUserId && req.isFounderAccess ? demoUserId : authenticatedUserId;
      
      const trucks = await storage.getTrucksByUser(effectiveUserId);
      const drivers = await storage.getDriversByUser ? await storage.getDriversByUser(effectiveUserId) : [];
      const loads = await storage.getLoadsByUser(effectiveUserId);
      
      // Determine fleet size category
      const truckCount = trucks.length;
      let fleetSize = "solo";
      if (truckCount >= 2 && truckCount <= 10) fleetSize = "small";
      else if (truckCount >= 11 && truckCount <= 50) fleetSize = "medium";
      else if (truckCount >= 51 && truckCount <= 200) fleetSize = "large";
      else if (truckCount > 200) fleetSize = "enterprise";
      
      const activeTrucks = trucks.filter(t => t.isActive === 1);
      const activeDrivers = drivers.filter(d => d.isActive === 1);
      const totalMiles = trucks.reduce((sum, truck) => sum + truck.totalMiles, 0);
      const totalRevenue = loads.reduce((sum, load) => sum + load.pay, 0);
      
      // Use the actual CPM from each truck's cost breakdown (matches individual truck display)
      const activeTrucksWithCPM = trucks.filter(t => t.isActive === 1);
      let totalCPM = 0;
      for (const truck of activeTrucksWithCPM) {
        const latestBreakdown = await storage.getLatestTruckCostBreakdown(truck.id);
        if (latestBreakdown && latestBreakdown.costPerMile > 0) {
          totalCPM += latestBreakdown.costPerMile;
        } else {
          // Fallback to calculated CPM if no breakdown exists
          const calculatedCPM = truck.totalMiles > 0 ? 
            (truck.fixedCosts + truck.variableCosts) / truck.totalMiles : 0;
          totalCPM += calculatedCPM;
        }
      }
      const avgCostPerMile = activeTrucksWithCPM.length > 0 ? Number((totalCPM / activeTrucksWithCPM.length).toFixed(2)) : 0;
      
      // Calculate true operational costs using rounded cost per mile for consistency  
      const roundedAvgCostPerMile = Number(avgCostPerMile.toFixed(2));
      const totalOperationalCosts = roundedAvgCostPerMile * totalMiles;
      const revenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
      const profitPerMile = revenuePerMile - roundedAvgCostPerMile;
      const profitMarginPercentage = revenuePerMile > 0 ? (profitPerMile / revenuePerMile) * 100 : 0;
      
      // console.log(`[FleetSummary] 💰 PROFIT CALCULATION: Revenue/mile: $${revenuePerMile.toFixed(2)}, Cost/mile: $${avgCostPerMile}, Profit/mile: $${profitPerMile.toFixed(2)}, Margin: ${profitMarginPercentage.toFixed(1)}%`);
      
      const summary = {
        fleetSize,
        totalTrucks: trucks.length,
        activeTrucks: activeTrucks.length,
        totalDrivers: drivers.length,
        activeDrivers: activeDrivers.length,
        totalLoads: loads.length,
        totalMiles,
        totalRevenue,
        avgCostPerMile,
        utilizationRate: trucks.length > 0 ? Number(((activeTrucks.length / trucks.length) * 100).toFixed(1)) : 0,
        profitMargin: Number(profitMarginPercentage.toFixed(1))
      };
      
      res.json(summary);
    } catch (error) {
      console.error("[FleetSummary] Error:", error);
      res.status(500).json({ error: "Failed to fetch fleet summary" });
    }
  });

  // Enhanced metrics with HOS compliance
  app.get("/api/compliance-overview", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      // Support demo mode - use demo user ID if provided, otherwise authenticated user
      const demoUserId = req.query.demo_user_id;
      const authenticatedUserId = req.user?.claims?.sub;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Use demo user ID if provided (demo mode), otherwise use authenticated user
      const effectiveUserId = demoUserId || authenticatedUserId;
      
      // Fetch user-specific drivers and trucks
      const drivers = await storage.getDriversByUser(effectiveUserId);
      const trucks = await storage.getTrucksByUser(effectiveUserId);
      
      // Get latest HOS status for each active driver
      const complianceData = await Promise.all(
        drivers.filter(d => d.isActive === 1).map(async (driver) => {
          const latestStatus = await storage.getLatestHosStatus(driver.id);
          return {
            driverId: driver.id,
            driverName: driver.name,
            truckId: latestStatus?.truckId,
            dutyStatus: latestStatus?.dutyStatus || "OFF_DUTY",
            driveTimeRemaining: latestStatus?.driveTimeRemaining || 11,
            onDutyRemaining: latestStatus?.onDutyRemaining || 14,
            cycleHoursRemaining: latestStatus?.cycleHoursRemaining || 70,
            violations: latestStatus?.violations || [],
            lastUpdate: latestStatus?.timestamp || new Date()
          };
        })
      );
      
      const violationCount = complianceData.reduce((sum, driver) => 
        sum + (driver.violations?.length || 0), 0
      );
      
      const driversWithLowHours = complianceData.filter(driver => 
        driver.driveTimeRemaining < 2 || driver.onDutyRemaining < 2
      ).length;
      
      res.json({
        totalActiveDrivers: complianceData.length,
        driversInViolation: violationCount,
        driversWithLowHours,
        complianceRate: complianceData.length > 0 ? 
          Number((((complianceData.length - violationCount) / complianceData.length) * 100).toFixed(1)) : 100,
        driverDetails: complianceData
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance overview" });
    }
  });

  // Truck Cost Breakdown endpoints (Weekly basis)
  app.get("/api/trucks/:id/cost-breakdowns", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const breakdowns = await storage.getTruckCostBreakdowns(id);
      res.json(breakdowns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cost breakdowns" });
    }
  });

  app.get("/api/trucks/:id/cost-breakdown/latest", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const breakdown = await storage.getLatestTruckCostBreakdown(id);
      
      if (!breakdown) {
        return res.status(404).json({ error: "No cost breakdown found for this truck" });
      }
      
      res.json(breakdown);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest cost breakdown" });
    }
  });

  app.post("/api/trucks/:id/cost-breakdown", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTruckCostBreakdownSchema.parse({
        ...req.body,
        truckId: id
      });
      
      const breakdown = await storage.createTruckCostBreakdown(validatedData);
      res.json(breakdown);
    } catch (error) {
      console.error('Cost breakdown creation error:', error);
      res.status(400).json({ error: "Invalid cost breakdown data" });
    }
  });

  app.put("/api/cost-breakdowns/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      let processedData = { ...req.body };
      
      // Convert driverPayPerMile (cents) to driverPay (weekly dollars) if provided
      if (processedData.driverPayPerMile && !processedData.driverPay) {
        processedData.driverPay = (processedData.driverPayPerMile / 100) * 3000;
        delete processedData.driverPayPerMile; // Remove the field that doesn't exist in schema
      }
      
      const validatedData = insertTruckCostBreakdownSchema.partial().parse(processedData);
      
      const breakdown = await storage.updateTruckCostBreakdown(id, validatedData);
      
      if (!breakdown) {
        return res.status(404).json({ error: "Cost breakdown not found" });
      }
      
      res.json(breakdown);
    } catch (error) {
      console.error("Invalid cost breakdown data:", error);
      res.status(400).json({ error: "Could not save cost changes", details: error instanceof Error ? error.message : 'Invalid data format' });
    }
  });

  app.delete("/api/cost-breakdowns/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTruckCostBreakdown(id);
      
      if (!success) {
        return res.status(404).json({ error: "Cost breakdown not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cost breakdown" });
    }
  });

  // Load Plans endpoints
  app.get("/api/load-plans", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { truckId, driverId } = req.query;
      const plans = await storage.getLoadPlans(
        truckId as string, 
        driverId as string
      );
      
      // Include legs for each plan
      const plansWithLegs = await Promise.all(
        plans.map(async (plan) => {
          const legs = await storage.getLoadPlanLegs(plan.id);
          return { ...plan, legs };
        })
      );
      
      res.json(plansWithLegs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch load plans" });
    }
  });

  app.get("/api/load-plans/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.getLoadPlan(id);
      
      if (!plan) {
        return res.status(404).json({ error: "Load plan not found" });
      }
      
      const legs = await storage.getLoadPlanLegs(id);
      res.json({ ...plan, legs });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch load plan" });
    }
  });

  app.post("/api/load-plans", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const validatedData = insertLoadPlanSchema.parse(req.body);
      const plan = await storage.createLoadPlan(validatedData);
      
      // Create activity for new load plan
      await storage.createActivity({
        title: `New load plan created`,
        description: `${plan.planName} - ${plan.totalMiles} miles planned`,
        type: "info",
        relatedTruckId: plan.truckId,
        relatedDriverId: plan.driverId
      });
      
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: "Invalid load plan data" });
    }
  });

  app.put("/api/load-plans/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLoadPlanSchema.partial().parse(req.body);
      
      const plan = await storage.updateLoadPlan(id, validatedData);
      
      if (!plan) {
        return res.status(404).json({ error: "Load plan not found" });
      }
      
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: "Invalid load plan data" });
    }
  });

  app.delete("/api/load-plans/:id", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteLoadPlan(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Load plan not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete load plan" });
    }
  });

  // Load Plan Legs endpoints
  app.get("/api/load-plans/:planId/legs", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { planId } = req.params;
      const legs = await storage.getLoadPlanLegs(planId);
      res.json(legs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch load plan legs" });
    }
  });

  app.post("/api/load-plans/:planId/legs", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { planId } = req.params;
      const validatedData = insertLoadPlanLegSchema.parse({
        ...req.body,
        loadPlanId: planId
      });
      
      const leg = await storage.createLoadPlanLeg(validatedData);
      
      // Update load plan totals
      const legs = await storage.getLoadPlanLegs(planId);
      const totalMiles = legs.reduce((sum, l) => sum + l.miles, 0);
      const totalRevenue = legs.reduce((sum, l) => sum + l.rate, 0);
      
      // Calculate estimated costs (simplified)
      const avgCostPerMile = 1.5; // This could be calculated from truck breakdown
      const totalProfit = totalRevenue - (totalMiles * avgCostPerMile);
      
      await storage.updateLoadPlan(planId, {
        totalMiles,
        totalRevenue,
        totalProfit
      });
      
      res.json(leg);
    } catch (error) {
      res.status(400).json({ error: "Invalid load plan leg data" });
    }
  });

  app.put("/api/load-plans/:planId/legs/:legId", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { legId } = req.params;
      const validatedData = insertLoadPlanLegSchema.partial().parse(req.body);
      
      const leg = await storage.updateLoadPlanLeg(legId, validatedData);
      
      if (!leg) {
        return res.status(404).json({ error: "Load plan leg not found" });
      }
      
      res.json(leg);
    } catch (error) {
      res.status(400).json({ error: "Invalid load plan leg data" });
    }
  });

  app.delete("/api/load-plans/:planId/legs/:legId", isAuthenticated, enforceDataIsolation, async (req: any, res) => {
    try {
      const { legId } = req.params;
      const deleted = await storage.deleteLoadPlanLeg(legId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Load plan leg not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete load plan leg" });
    }
  });

  // Analytics API endpoints for comprehensive data collection and metrics
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const dashboard = await AnalyticsService.getAnalyticsDashboard(userId);
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching analytics dashboard:", error);
      res.status(500).json({ message: "Failed to fetch analytics dashboard" });
    }
  });

  app.get('/api/analytics/real-time', isAuthenticated, async (req: any, res) => {
    try {
      const metrics = await AnalyticsService.getRealTimeMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching real-time metrics:", error);
      res.status(500).json({ message: "Failed to fetch real-time metrics" });
    }
  });

  app.post('/api/analytics/feature-usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const featureData = { ...req.body, userId };
      
      await AnalyticsService.trackFeatureUsage(featureData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking feature usage:", error);
      res.status(500).json({ message: "Failed to track feature usage" });
    }
  });

  app.post('/api/analytics/user-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = { ...req.body, userId };
      
      await AnalyticsService.trackUserSession(sessionData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking user session:", error);
      res.status(500).json({ message: "Failed to track user session" });
    }
  });

  app.post('/api/analytics/generate-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const metricDate = req.body.date ? new Date(req.body.date) : new Date();
      const metrics = await AnalyticsService.generateSystemMetrics(metricDate);
      res.json(metrics);
    } catch (error) {
      console.error("Error generating system metrics:", error);
      res.status(500).json({ message: "Failed to generate system metrics" });
    }
  });

  app.get('/api/analytics/user/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      // Mock analytics data since these methods aren't implemented yet
      const analytics: any[] = [];
      const featureUsage: any[] = [];
      const dataInputs: any[] = [];
      
      res.json({
        analytics,
        featureUsage,
        dataInputs,
        summary: {
          totalSessions: analytics.length,
          totalFeatureUsage: featureUsage.length,
          totalDataInputs: dataInputs.length,
          lastActive: analytics.length > 0 ? analytics[analytics.length - 1].sessionStartTime : null
        }
      });
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  app.get('/api/analytics/business-impact', isAuthenticated, async (req, res) => {
    try {
      // Mock business impact data since these methods aren't implemented yet
      const impactMetrics = {};
      const dataInputTrends: any[] = [];
      const topFeatures: any[] = [];
      
      res.json({
        businessImpact: impactMetrics,
        inputTrends: dataInputTrends,
        topFeatures,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error fetching business impact analytics:", error);
      res.status(500).json({ message: "Failed to fetch business impact analytics" });
    }
  });

  // Privacy-controlled User Metrics endpoints
  // Get user's own analytics (privacy protected)
  app.get('/api/user-metrics', isAuthenticated, enforceUserMetricsPrivacy, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const analytics = await storage.getUserAnalytics(userId);
      if (!analytics) {
        // Create initial analytics record for new user
        const newAnalytics = await storage.createUserAnalytics({
          userId: userId,
          sessionId: `session-${Date.now()}`,
          sessionStartTime: new Date(),
          totalPageViews: 0,
          trucksManaged: 0,
          loadsCreated: 0,
          driversManaged: 0,
          fuelPurchasesRecorded: 0,
          totalRevenue: 0,
          totalMiles: 0,
          avgProfitPerLoad: 0,
          fleetUtilization: 0,
          isPrivate: 1, // Private by default
          allowAnalytics: 1 // Analytics enabled by default
        });
        return res.json(newAnalytics);
      }

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user metrics:", error);
      res.status(500).json({ error: "Failed to fetch user metrics" });
    }
  });

  // Get specific user's analytics (founder/admin only with privacy checks)
  app.get('/api/user-metrics/:userId', isAuthenticated, enforceUserMetricsPrivacy, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const analytics = await storage.getUserAnalytics(requestedUserId);
      
      if (!analytics) {
        return res.status(404).json({ error: "User metrics not found" });
      }

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user metrics:", error);
      res.status(500).json({ error: "Failed to fetch user metrics" });
    }
  });

  // Get all user analytics (founder only)
  app.get('/api/all-user-metrics', isAuthenticated, requireFounderAccess, async (req: any, res) => {
    try {
      const allAnalytics = await storage.getAllUserAnalytics();
      res.json(allAnalytics);
    } catch (error) {
      console.error("Error fetching all user metrics:", error);
      res.status(500).json({ error: "Failed to fetch all user metrics" });
    }
  });

  // Update user analytics privacy settings
  app.patch('/api/user-metrics/privacy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { isPrivate, allowAnalytics } = req.body;
      
      // Get current analytics
      const currentAnalytics = await storage.getUserAnalytics(userId);
      if (!currentAnalytics) {
        return res.status(404).json({ error: "User metrics not found" });
      }

      const updatedAnalytics = await storage.updateUserAnalytics(currentAnalytics.id, {
        isPrivate: isPrivate !== undefined ? (isPrivate ? 1 : 0) : currentAnalytics.isPrivate,
        allowAnalytics: allowAnalytics !== undefined ? (allowAnalytics ? 1 : 0) : currentAnalytics.allowAnalytics
      });

      res.json(updatedAnalytics);
    } catch (error) {
      console.error("Error updating metrics privacy:", error);
      res.status(500).json({ error: "Failed to update metrics privacy" });
    }
  });

  // Set founder status (for initial setup - should be protected in production)
  app.post('/api/set-founder/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      const targetUserId = req.params.userId;
      
      // Only allow the user to set themselves as founder initially
      if (currentUserId !== targetUserId) {
        return res.status(403).json({ error: "Can only set founder status for yourself" });
      }

      const updatedUser = await storage.updateUser(targetUserId, { isFounder: 1 });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`[Privacy Audit] User ${targetUserId} set as founder`);
      res.json({ message: "Founder status granted", user: updatedUser });
    } catch (error) {
      console.error("Error setting founder status:", error);
      res.status(500).json({ error: "Failed to set founder status" });
    }
  });

  // Integration routes
  app.use('/api/integrations', integrationsRouter);
  app.use('/api/integration', integrationRoutes);
  
  // Load recommendation routes
  app.use('/api/recommendations', recommendationRoutes);

  // Owner dashboard endpoint - comprehensive system-wide visibility
  app.get('/api/owner/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user has owner/founder privileges
      const currentUser = await storage.getUser(userId);
      if (!currentUser?.isFounder) {
        return res.status(403).json({ error: 'Access denied - Owner privileges required' });
      }

      // Get all users and their comprehensive data
      const allUsers = await storage.getAllUsers();
      
      // Calculate system-wide business metrics
      const systemWideMetrics = await Promise.all(
        allUsers.map(async (user) => {
          const [trucks, loads, drivers] = await Promise.all([
            storage.getTrucksForUser(user.id),
            storage.getLoadsForUser(user.id),
            storage.getDriversForUser(user.id)
          ]);

          // Calculate financial metrics
          const totalRevenue = loads.reduce((sum, load) => sum + (load.pay || 0), 0);
          const totalMiles = loads.reduce((sum, load) => sum + (load.miles || 0), 0);
          const activeLoads = loads.filter(l => l.status === 'in_transit').length;
          const completedLoads = loads.filter(l => l.status === 'delivered').length;
          
          // Calculate operational efficiency
          const avgRevenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
          const avgRevenuePerLoad = loads.length > 0 ? totalRevenue / loads.length : 0;
          const truckUtilization = trucks.length > 0 ? (activeLoads / trucks.length) * 100 : 0;

          // Integration adoption metrics
          const integratedTrucks = trucks.filter(t => t.loadBoardIntegration === 'integrated').length;
          const integrationRate = trucks.length > 0 ? (integratedTrucks / trucks.length) * 100 : 0;

          return {
            userId: user.id,
            userInfo: {
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              email: user.email,
              company: user.company || 'Individual Owner-Operator',
              joinDate: user.createdAt,
              isAdmin: user.isAdmin === 1,
              isFounder: user.isFounder === 1,
              isActive: user.isAdmin === 1 // Using isAdmin as active status since we revoke admin on termination
            },
            fleetMetrics: {
              totalTrucks: trucks.length,
              activeTrucks: trucks.filter(t => t.isActive).length,
              totalDrivers: drivers.length,
              equipmentTypes: Array.from(new Set(trucks.map(t => t.equipmentType)))
            },
            operationalMetrics: {
              totalLoads: loads.length,
              activeLoads,
              completedLoads,
              totalRevenue,
              totalMiles,
              avgRevenuePerMile: Number(avgRevenuePerMile.toFixed(2)),
              avgRevenuePerLoad: Number(avgRevenuePerLoad.toFixed(0)),
              truckUtilization: Number(truckUtilization.toFixed(1))
            },
            integrationMetrics: {
              loadBoards: Array.from(new Set(trucks.map(t => t.preferredLoadBoard).filter(Boolean))),
              eldProviders: Array.from(new Set(trucks.map(t => t.elogsProvider).filter(Boolean))),
              integrationRate: Number(integrationRate.toFixed(1)),
              integratedTrucks,
              manualTrucks: trucks.length - integratedTrucks
            },
            recentActivity: loads.slice(-3).map(load => ({
              loadId: load.id,
              route: `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`,
              revenue: load.pay,
              status: load.status,
              date: load.pickupDate
            }))
          };
        })
      );

      // Calculate system-wide business intelligence
      const activeUsers = allUsers.filter(user => user.isAdmin === 1); // Only count active users
      const systemTotals = {
        totalUsers: activeUsers.length,
        totalRevenue: systemWideMetrics.reduce((sum, user) => sum + user.operationalMetrics.totalRevenue, 0),
        totalMiles: systemWideMetrics.reduce((sum, user) => sum + user.operationalMetrics.totalMiles, 0),
        totalTrucks: systemWideMetrics.reduce((sum, user) => sum + user.fleetMetrics.totalTrucks, 0),
        totalLoads: systemWideMetrics.reduce((sum, user) => sum + user.operationalMetrics.totalLoads, 0),
        avgSystemRevenuePerMile: 0,
        topPerformers: {
          byRevenue: [...systemWideMetrics].sort((a, b) => b.operationalMetrics.totalRevenue - a.operationalMetrics.totalRevenue).slice(0, 3),
          byEfficiency: [...systemWideMetrics].sort((a, b) => b.operationalMetrics.avgRevenuePerMile - a.operationalMetrics.avgRevenuePerMile).slice(0, 3),
          byUtilization: [...systemWideMetrics].sort((a, b) => b.operationalMetrics.truckUtilization - a.operationalMetrics.truckUtilization).slice(0, 3)
        }
      };

      systemTotals.avgSystemRevenuePerMile = systemTotals.totalMiles > 0 ? 
        Number((systemTotals.totalRevenue / systemTotals.totalMiles).toFixed(2)) : 0;

      // Market intelligence
      const marketIntelligence: any = {
        loadBoardAdoption: {},
        eldProviderAdoption: {},
        equipmentTypeDistribution: {},
        integrationTrends: {
          fullyIntegrated: systemWideMetrics.filter(u => u.integrationMetrics.integrationRate === 100).length,
          partiallyIntegrated: systemWideMetrics.filter(u => u.integrationMetrics.integrationRate > 0 && u.integrationMetrics.integrationRate < 100).length,
          notIntegrated: systemWideMetrics.filter(u => u.integrationMetrics.integrationRate === 0).length
        }
      };

      // Calculate adoption rates
      const allLoadBoards = systemWideMetrics.flatMap(u => u.integrationMetrics.loadBoards);
      const allEldProviders = systemWideMetrics.flatMap(u => u.integrationMetrics.eldProviders);
      
      // Get all trucks across all users for accurate equipment type count
      const allTrucksForEquipmentCount = await Promise.all(
        allUsers.map(user => storage.getTrucksForUser(user.id))
      );
      const flatTrucksList = allTrucksForEquipmentCount.flat();
      
      // Count occurrences
      allLoadBoards.filter((lb): lb is string => lb !== null).forEach((lb) => marketIntelligence.loadBoardAdoption[lb] = (marketIntelligence.loadBoardAdoption[lb] || 0) + 1);
      allEldProviders.filter((eld): eld is string => eld !== null).forEach((eld) => marketIntelligence.eldProviderAdoption[eld] = (marketIntelligence.eldProviderAdoption[eld] || 0) + 1);
      
      // Count actual trucks by equipment type (not unique types per user)
      flatTrucksList.forEach((truck: any) => {
        const equipmentType = truck.equipmentType;
        marketIntelligence.equipmentTypeDistribution[equipmentType] = (marketIntelligence.equipmentTypeDistribution[equipmentType] || 0) + 1;
      });

      res.json({
        success: true,
        dashboardData: {
          systemTotals,
          marketIntelligence,
          userMetrics: systemWideMetrics,
          timestamp: new Date().toISOString(),
          scalabilityStatus: {
            currentUsers: activeUsers.length,
            maxCapacity: 50,
            utilizationPercentage: (activeUsers.length / 50) * 100,
            growthCapacity: 50 - activeUsers.length
          }
        }
      });

    } catch (error) {
      console.error('Owner dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate owner dashboard'
      });
    }
  });

  // User self-service account deletion endpoint
  app.post('/api/user/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reason } = req.body;
      
      // Get current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent founder from deleting their own account (system safety)
      if (currentUser.isFounder) {
        return res.status(403).json({ 
          error: 'Founder accounts cannot be self-deleted for system integrity. Please contact support.' 
        });
      }

      // Log the self-deletion activity for audit purposes
      await storage.createActivity({
        title: 'Account Self-Deletion',
        description: `User ${currentUser.email || currentUser.id} voluntarily deleted their account${reason ? `: ${reason}` : ''}`,
        type: 'warning'
      });

      // Delete all user-related data
      // 1. Delete all user's trucks (and associated data)
      const userTrucks = await storage.getTrucksByUser(userId);
      for (const truck of userTrucks) {
        await storage.deleteTruck(truck.id);
      }

      // 2. Delete all user's loads
      const userLoads = await storage.getLoadsByUser(userId);
      for (const load of userLoads) {
        await storage.deleteLoad(load.id);
      }

      // 3. Delete all user's drivers
      const userDrivers = await storage.getDriversByUser(userId);
      for (const driver of userDrivers) {
        await storage.deleteDriver(driver.id);
      }

      // 4. Delete the user account itself (set as terminated, keep for audit)
      await storage.updateUser(userId, {
        isAdmin: 0, // Revoke access
        firstName: null,
        lastName: null,
        email: null, // Clear PII
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Account deletion completed successfully'
      });

    } catch (error) {
      console.error('User account deletion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      });
    }
  });

  // Owner user management endpoints - terminate/suspend user access
  app.post('/api/owner/users/:userId/terminate', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;
      
      // Check if current user has founder privileges
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser?.isFounder) {
        return res.status(403).json({ error: 'Access denied - Owner privileges required' });
      }

      // Prevent self-termination
      if (currentUserId === targetUserId) {
        return res.status(400).json({ error: 'Cannot terminate your own access' });
      }

      // Get target user details
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user to inactive status (using existing schema)
      const updatedUser = await storage.updateUser(targetUserId, {
        isAdmin: 0, // Revoke admin privileges as termination
        updatedAt: new Date()
      });

      // Log the termination activity
      await storage.createActivity({
        title: 'User Access Terminated',
        type: 'warning',
        description: `Terminated user access for ${targetUser.email}. Reason: ${req.body.reason || 'No reason provided'}`
      });

      res.json({
        success: true,
        message: `User access terminated for ${targetUser.email}`,
        user: updatedUser
      });

    } catch (error) {
      console.error('User termination error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to terminate user access'
      });
    }
  });

  app.post('/api/owner/users/:userId/reactivate', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;
      
      // Check if current user has founder privileges
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser?.isFounder) {
        return res.status(403).json({ error: 'Access denied - Owner privileges required' });
      }

      // Get target user details
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Reactivate user (using existing schema)  
      const updatedUser = await storage.updateUser(targetUserId, {
        isAdmin: 1, // Restore admin privileges as reactivation
        updatedAt: new Date()
      });

      // Log the reactivation activity
      await storage.createActivity({
        title: 'User Access Reactivated',
        type: 'info',
        description: `Reactivated user access for ${targetUser.email}`
      });

      res.json({
        success: true,
        message: `User access reactivated for ${targetUser.email}`,
        user: updatedUser
      });

    } catch (error) {
      console.error('User reactivation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reactivate user access'
      });
    }
  });

  // Comprehensive system demonstration endpoint for testing multi-user functionality
  app.get('/api/system/demo', async (req, res) => {
    try {
      // Get all user profiles in the system
      const allUsers = await storage.getAllUsers();
      
      // Get comprehensive data for each user
      const systemDemo = await Promise.all(
        allUsers.map(async (user) => {
          const [trucks, loads, drivers] = await Promise.all([
            storage.getTrucksForUser(user.id),
            storage.getLoadsForUser(user.id),
            storage.getDriversForUser(user.id)
          ]);

          // Calculate fleet metrics for each user
          const fleetMetrics = {
            totalTrucks: trucks.length,
            activeTrucks: trucks.filter(t => t.isActive).length,
            totalLoads: loads.length,
            activeLoads: loads.filter(l => l.status === 'in_transit').length,
            totalDrivers: drivers.length,
            totalRevenue: loads.reduce((sum, load) => sum + (load.pay || 0), 0),
            totalMiles: loads.reduce((sum, load) => sum + (load.miles || 0), 0),
            averageRatePerMile: loads.length > 0 ? 
              loads.reduce((sum, load) => sum + (load.ratePerMile || 0), 0) / loads.length : 0
          };

          // Get integration preferences
          const integrationPreferences = {
            loadBoards: Array.from(new Set(trucks.map(t => t.preferredLoadBoard).filter(Boolean))),
            eldProviders: Array.from(new Set(trucks.map(t => t.elogsProvider).filter(Boolean))),
            integratedTrucks: trucks.filter(t => t.loadBoardIntegration === 'integrated').length,
            manualTrucks: trucks.filter(t => t.loadBoardIntegration === 'manual').length
          };

          return {
            user: {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              company: user.company || 'Individual Owner-Operator'
            },
            fleet: trucks.map(truck => ({
              id: truck.id,
              name: truck.name,
              equipmentType: truck.equipmentType,
              preferredLoadBoard: truck.preferredLoadBoard,
              elogsProvider: truck.elogsProvider,
              costPerMile: (truck as any).costPerMile || 0,
              totalMiles: truck.totalMiles,
              driver: (truck as any).driver?.name || 'Unassigned'
            })),
            recentLoads: loads.slice(0, 3).map(load => ({
              id: load.id,
              route: `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`,
              miles: load.miles,
              pay: load.pay,
              status: load.status,
              commodity: load.commodity
            })),
            metrics: fleetMetrics,
            integrations: integrationPreferences
          };
        })
      );

      // System-wide summary
      const systemSummary = {
        totalUsers: allUsers.length,
        totalFleetSize: systemDemo.reduce((sum, user) => sum + user.metrics.totalTrucks, 0),
        totalSystemRevenue: systemDemo.reduce((sum, user) => sum + user.metrics.totalRevenue, 0),
        totalSystemMiles: systemDemo.reduce((sum, user) => sum + user.metrics.totalMiles, 0),
        uniqueLoadBoards: Array.from(new Set(systemDemo.flatMap(user => user.integrations.loadBoards))),
        uniqueELDProviders: Array.from(new Set(systemDemo.flatMap(user => user.integrations.eldProviders))),
        systemUtilization: {
          integratedTrucks: systemDemo.reduce((sum, user) => sum + user.integrations.integratedTrucks, 0),
          manualTrucks: systemDemo.reduce((sum, user) => sum + user.integrations.manualTrucks, 0)
        }
      };

      res.json({
        success: true,
        systemSummary,
        userProfiles: systemDemo,
        timestamp: new Date().toISOString(),
        scalability: {
          currentUsers: allUsers.length,
          maxSupportedUsers: 50,
          utilizationPercentage: (allUsers.length / 50) * 100,
          growthCapacity: 50 - allUsers.length
        }
      });

    } catch (error) {
      console.error('System demo error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate system demonstration'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
