import { Router } from "express";
import { datService } from "../integrations/dat-service";
import { eldService } from "../integrations/eld-service";
import { loadBoardService } from "../integrations/load-board-service";
import { multiELDService } from "../integrations/multi-eld-service";
import { isAuthenticated } from "../replitAuth";

const router = Router();

// DAT Load Board Integration Routes
router.get('/dat/loads/search', isAuthenticated, async (req: any, res) => {
  try {
    const {
      originCity,
      originState,
      originRadius,
      destCity,
      destState,
      destRadius,
      equipmentType,
      minRate,
      maxRate,
      pickupDateStart,
      pickupDateEnd,
      limit
    } = req.query;

    const criteria: any = {};
    
    if (originCity && originState) {
      criteria.origin = {
        city: originCity,
        state: originState,
        radius: originRadius ? parseInt(originRadius) : undefined
      };
    }
    
    if (destCity && destState) {
      criteria.destination = {
        city: destCity,
        state: destState,
        radius: destRadius ? parseInt(destRadius) : undefined
      };
    }
    
    if (equipmentType) criteria.equipmentType = equipmentType;
    if (minRate) criteria.minRate = parseFloat(minRate);
    if (maxRate) criteria.maxRate = parseFloat(maxRate);
    if (pickupDateStart) criteria.pickupDateStart = pickupDateStart;
    if (pickupDateEnd) criteria.pickupDateEnd = pickupDateEnd;
    if (limit) criteria.limit = parseInt(limit);

    const loads = await datService.searchLoads(criteria);
    
    res.json({
      success: true,
      loads,
      count: loads.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DAT load search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search loads'
    });
  }
});

router.get('/dat/rates/:origin/:destination/:equipmentType', isAuthenticated, async (req: any, res) => {
  try {
    const { origin, destination, equipmentType } = req.params;
    
    const rates = await datService.getMarketRates(origin, destination, equipmentType);
    
    res.json({
      success: true,
      rates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DAT rates error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get market rates'
    });
  }
});

router.post('/dat/trucks/post', isAuthenticated, async (req: any, res) => {
  try {
    const { origin, destination, equipmentType, length, weight, availableDate, notes } = req.body;
    
    const result = await datService.postTruck({
      origin,
      destination,
      equipmentType,
      length,
      weight,
      availableDate,
      notes
    });
    
    if (result.success) {
      res.json({
        success: true,
        postId: result.postId,
        message: 'Truck posted successfully to DAT'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to post truck to DAT'
      });
    }
  } catch (error) {
    console.error('DAT truck posting error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to post truck'
    });
  }
});

router.post('/dat/loads/book', isAuthenticated, async (req: any, res) => {
  try {
    const { loadId, driverId, truckId, notes } = req.body;
    
    const result = await datService.bookLoad(loadId, { driverId, truckId, notes });
    
    if (result.success) {
      res.json({
        success: true,
        bookingId: result.bookingId,
        message: 'Load booked successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to book load'
      });
    }
  } catch (error) {
    console.error('DAT load booking error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to book load'
    });
  }
});

router.get('/dat/test-connection', isAuthenticated, async (req: any, res) => {
  try {
    const result = await datService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    });
  }
});

// ELD/HOS Integration Routes
router.get('/eld/drivers/:driverId/hos-status', isAuthenticated, async (req: any, res) => {
  try {
    const { driverId } = req.params;
    
    const hosStatus = await eldService.getDriverHOSStatus(driverId);
    
    res.json({
      success: true,
      hosStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ELD HOS status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get HOS status'
    });
  }
});

router.get('/eld/drivers/:driverId/hos-logs', isAuthenticated, async (req: any, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }
    
    const hosLogs = await eldService.getDriverHOSLogs(driverId, startDate as string, endDate as string);
    
    res.json({
      success: true,
      hosLogs,
      count: hosLogs.length,
      dateRange: { startDate, endDate },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ELD HOS logs error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get HOS logs'
    });
  }
});

router.get('/eld/vehicles/locations', isAuthenticated, async (req: any, res) => {
  try {
    const { vehicleIds } = req.query;
    const vehicleIdArray = vehicleIds ? (vehicleIds as string).split(',') : undefined;
    
    const locations = await eldService.getVehicleLocations(vehicleIdArray);
    
    res.json({
      success: true,
      locations,
      count: locations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ELD vehicle locations error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get vehicle locations'
    });
  }
});

router.post('/eld/drivers/:driverId/duty-status', isAuthenticated, async (req: any, res) => {
  try {
    const { driverId } = req.params;
    const { status, location } = req.body;
    
    const result = await eldService.updateDriverDutyStatus(driverId, status, location);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Duty status updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to update duty status'
      });
    }
  } catch (error) {
    console.error('ELD duty status update error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update duty status'
    });
  }
});

router.get('/eld/hos-violations', isAuthenticated, async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }
    
    const violations = await eldService.getHOSViolations(startDate as string, endDate as string);
    
    res.json({
      success: true,
      violations,
      count: violations.length,
      dateRange: { startDate, endDate },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ELD HOS violations error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get HOS violations'
    });
  }
});

router.get('/eld/test-connection', isAuthenticated, async (req: any, res) => {
  try {
    const result = await eldService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      connected: false,
      provider: 'unknown',
      error: error instanceof Error ? error.message : 'Connection test failed'
    });
  }
});

// Integration status endpoint - comprehensive support for all load boards and ELD providers
router.get('/status', async (req: any, res) => {
  try {
    // Test all load board connections
    const loadBoardStatus = await loadBoardService.testAllConnections();
    
    // Test all ELD provider connections  
    const eldStatus = await multiELDService.testAllConnections();

    res.json({
      // Legacy compatibility
      dat: loadBoardStatus.DAT || { connected: false, error: "DAT not configured" },
      eld: eldStatus.Samsara || { connected: false, provider: "Samsara", error: "Samsara not configured" },
      
      // Comprehensive status for all providers
      loadBoards: loadBoardStatus,
      eldProviders: eldStatus,
      
      // Summary
      summary: {
        totalLoadBoards: Object.keys(loadBoardStatus).length,
        connectedLoadBoards: Object.values(loadBoardStatus).filter(status => status.connected).length,
        totalELDProviders: Object.keys(eldStatus).length,
        connectedELDProviders: Object.values(eldStatus).filter(status => status.connected).length,
        lastChecked: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error testing integration status:", error);
    res.status(500).json({ 
      error: "Failed to test integration connections",
      dat: { connected: false, error: "Connection test failed" },
      eld: { connected: false, provider: "unknown", error: "Connection test failed" },
      loadBoards: {},
      eldProviders: {},
      summary: {
        totalLoadBoards: 0,
        connectedLoadBoards: 0,
        totalELDProviders: 0,
        connectedELDProviders: 0,
        lastChecked: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Multi-provider load board search
router.get('/loads/search', isAuthenticated, async (req: any, res) => {
  try {
    const {
      originCity,
      originState,
      originRadius,
      destCity,
      destState,
      destRadius,
      equipmentType,
      minRate,
      maxRate,
      pickupDateStart,
      pickupDateEnd,
      limit,
      loadBoards // comma-separated list of load boards to search
    } = req.query;

    const criteria: any = {};
    
    if (originCity && originState) {
      criteria.origin = {
        city: originCity,
        state: originState,
        radius: originRadius ? parseInt(originRadius) : undefined
      };
    }
    
    if (destCity && destState) {
      criteria.destination = {
        city: destCity,
        state: destState,
        radius: destRadius ? parseInt(destRadius) : undefined
      };
    }
    
    if (equipmentType) criteria.equipmentType = equipmentType;
    if (minRate) criteria.minRate = parseFloat(minRate);
    if (maxRate) criteria.maxRate = parseFloat(maxRate);
    if (pickupDateStart) criteria.pickupDateStart = pickupDateStart;
    if (pickupDateEnd) criteria.pickupDateEnd = pickupDateEnd;
    if (limit) criteria.limit = parseInt(limit);
    if (loadBoards) criteria.loadBoards = (loadBoards as string).split(',');

    const loads = await loadBoardService.searchLoads(criteria);
    
    res.json({
      success: true,
      loads,
      count: loads.length,
      searchedBoards: criteria.loadBoards || ['DAT', 'Truckstop', '123Loadboard', 'SuperDispatch'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Multi-provider load search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search loads'
    });
  }
});

// Multi-provider market rates
router.get('/rates/:origin/:destination/:equipmentType', isAuthenticated, async (req: any, res) => {
  try {
    const { origin, destination, equipmentType } = req.params;
    
    const rates = await loadBoardService.getMarketRates(origin, destination, equipmentType);
    
    res.json({
      success: true,
      rates,
      count: rates.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Multi-provider rates error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get market rates'
    });
  }
});

// Multi-ELD provider HOS status
router.get('/eld/:provider/drivers/:driverId/hos-status', isAuthenticated, async (req: any, res) => {
  try {
    const { provider, driverId } = req.params;
    
    const hosStatus = await multiELDService.getDriverHOSStatus(driverId, provider);
    
    res.json({
      success: true,
      provider,
      hosStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`ELD ${req.params.provider} HOS status error:`, error);
    res.status(500).json({
      success: false,
      provider: req.params.provider,
      error: error instanceof Error ? error.message : 'Failed to get HOS status'
    });
  }
});

// Multi-ELD provider HOS logs
router.get('/eld/:provider/drivers/:driverId/hos-logs', isAuthenticated, async (req: any, res) => {
  try {
    const { provider, driverId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }
    
    const hosLogs = await multiELDService.getDriverHOSLogs(driverId, provider, startDate as string, endDate as string);
    
    res.json({
      success: true,
      provider,
      hosLogs,
      count: hosLogs.length,
      dateRange: { startDate, endDate },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`ELD ${req.params.provider} HOS logs error:`, error);
    res.status(500).json({
      success: false,
      provider: req.params.provider,
      error: error instanceof Error ? error.message : 'Failed to get HOS logs'
    });
  }
});

// Multi-ELD provider vehicle locations
router.get('/eld/:provider/vehicles/locations', isAuthenticated, async (req: any, res) => {
  try {
    const { provider } = req.params;
    const { vehicleIds } = req.query;
    const vehicleIdArray = vehicleIds ? (vehicleIds as string).split(',') : undefined;
    
    const locations = await multiELDService.getVehicleLocations(provider, vehicleIdArray);
    
    res.json({
      success: true,
      provider,
      locations,
      count: locations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`ELD ${req.params.provider} vehicle locations error:`, error);
    res.status(500).json({
      success: false,
      provider: req.params.provider,
      error: error instanceof Error ? error.message : 'Failed to get vehicle locations'
    });
  }
});

export default router;