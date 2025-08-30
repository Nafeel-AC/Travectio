import { Router } from "express";
import { loadRecommendationEngine } from "../services/load-recommendation-engine.js";
import { isAuthenticated } from "../replitAuth.js";
import { z } from "zod";

const router = Router();

// Schema for recommendation request validation
const RecommendationRequestSchema = z.object({
  truckId: z.string(),
  driverHours: z.object({
    driveTimeRemaining: z.number().min(0).max(14),
    onDutyRemaining: z.number().min(0).max(14)
  }),
  currentLocation: z.object({
    city: z.string(),
    state: z.string()
  }).optional(),
  marketConditions: z.object({
    fuelPrice: z.number().positive(),
    seasonality: z.string(),
    marketDemand: z.enum(['high', 'medium', 'low'])
  }).optional()
});

// Get load recommendations for a truck/driver
router.post('/loads', isAuthenticated, async (req: any, res) => {
  try {
    // Support demo mode - use demo user ID if provided, otherwise authenticated user
    const demoUserId = req.query.demo_user_id;
    const authenticatedUserId = req.user?.claims?.sub;
    
    if (!authenticatedUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Use demo user ID if provided (demo mode), otherwise use authenticated user
    const userId = demoUserId || authenticatedUserId;
    
    // Validate request
    const validatedData = RecommendationRequestSchema.parse(req.body);
    
    // Get truck details from database with demo mode support
    const demoParam = demoUserId ? `?demo_user_id=${demoUserId}` : '';
    const truckResponse = await fetch(`http://localhost:5000/api/trucks/${validatedData.truckId}${demoParam}`, {
      headers: { 'Cookie': req.headers.cookie || '' }
    });
    
    if (!truckResponse.ok) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    const truck = await truckResponse.json();
    
    // Get available loads with demo mode support
    const loadsResponse = await fetch(`http://localhost:5000/api/load-board${demoParam}`, {
      headers: { 'Cookie': req.headers.cookie || '' }
    });
    
    const availableLoads = loadsResponse.ok ? await loadsResponse.json() : [];
    
    // Calculate average cost per mile
    const avgCostPerMile = truck.totalMiles > 0 ? 
      (truck.fixedCosts + truck.variableCosts) / truck.totalMiles : 
      ((truck.fixedCosts + truck.variableCosts) / 3000); // Use weekly standard if no miles
    
    // Prepare recommendation request
    const recommendationRequest = {
      userId,
      truckId: validatedData.truckId,
      driverHours: validatedData.driverHours,
      currentLocation: validatedData.currentLocation,
      fleetData: {
        avgCostPerMile,
        equipmentType: truck.equipmentType || 'Dry Van',
        preferredRoutes: [], // Could be enhanced with historical data
        historicalPerformance: null // Could be enhanced with past load performance
      },
      availableLoads,
      marketConditions: validatedData.marketConditions
    };
    
    // Generate recommendations
    const recommendations = loadRecommendationEngine.generateRecommendations(recommendationRequest);
    
    // Generate market insights
    const marketInsights = loadRecommendationEngine.generateMarketInsights(recommendationRequest);
    
    res.json({
      success: true,
      recommendations,
      marketInsights,
      metadata: {
        totalLoadsAnalyzed: availableLoads.length,
        recommendationsGenerated: recommendations.length,
        truckInfo: {
          name: truck.name,
          equipmentType: truck.equipmentType,
          avgCostPerMile
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Load recommendation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate load recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get forward-leg recommendations after completing a load
router.post('/loads/forward-leg', isAuthenticated, async (req: any, res) => {
  try {
    // Support demo mode - use demo user ID if provided, otherwise authenticated user
    const demoUserId = req.query.demo_user_id;
    const authenticatedUserId = req.user?.claims?.sub;
    
    if (!authenticatedUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Use demo user ID if provided (demo mode), otherwise use authenticated user
    const userId = demoUserId || authenticatedUserId;
    
    const { completedLoadId, ...requestData } = req.body;
    
    // Validate request
    const validatedData = RecommendationRequestSchema.parse(requestData);
    
    // Get completed load details with demo mode support
    const demoParam = demoUserId ? `?demo_user_id=${demoUserId}` : '';
    const completedLoadResponse = await fetch(`http://localhost:5000/api/load-board/${completedLoadId}${demoParam}`, {
      headers: { 'Cookie': req.headers.cookie || '' }
    });
    
    if (!completedLoadResponse.ok) {
      return res.status(404).json({ error: 'Completed load not found' });
    }
    
    const completedLoad = await completedLoadResponse.json();
    
    // Get truck details with demo mode support
    const truckResponse = await fetch(`http://localhost:5000/api/trucks/${validatedData.truckId}${demoParam}`, {
      headers: { 'Cookie': req.headers.cookie || '' }
    });
    
    if (!truckResponse.ok) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    const truck = await truckResponse.json();
    
    // Get available loads with demo mode support
    const loadsResponse = await fetch(`http://localhost:5000/api/load-board${demoParam}`, {
      headers: { 'Cookie': req.headers.cookie || '' }
    });
    
    const availableLoads = loadsResponse.ok ? await loadsResponse.json() : [];
    
    // Calculate average cost per mile
    const avgCostPerMile = truck.totalMiles > 0 ? 
      (truck.fixedCosts + truck.variableCosts) / truck.totalMiles : 
      ((truck.fixedCosts + truck.variableCosts) / 3000);
    
    // Prepare recommendation request
    const recommendationRequest = {
      userId,
      truckId: validatedData.truckId,
      driverHours: validatedData.driverHours,
      currentLocation: validatedData.currentLocation,
      fleetData: {
        avgCostPerMile,
        equipmentType: truck.equipmentType || 'Dry Van',
        preferredRoutes: [],
        historicalPerformance: null
      },
      availableLoads,
      marketConditions: validatedData.marketConditions
    };
    
    // Generate forward-leg recommendations
    const forwardLegRecommendations = loadRecommendationEngine.generateForwardLegRecommendations(
      completedLoad,
      recommendationRequest
    );
    
    res.json({
      success: true,
      forwardLegRecommendations,
      completedLoad: {
        id: completedLoad.id,
        destination: `${completedLoad.destinationCity}, ${completedLoad.destinationState}`
      },
      metadata: {
        nearbyLoadsAnalyzed: forwardLegRecommendations.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Forward-leg recommendation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate forward-leg recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market insights and trends
router.get('/market-insights', isAuthenticated, async (req: any, res) => {
  try {
    // Support demo mode - use demo user ID if provided, otherwise authenticated user
    const demoUserId = req.query.demo_user_id;
    const authenticatedUserId = req.user?.claims?.sub;
    
    if (!authenticatedUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Use demo user ID if provided (demo mode), otherwise use authenticated user
    const userId = demoUserId || authenticatedUserId;
    
    // Get user's truck fleet with demo mode support
    const demoParam = demoUserId ? `?demo_user_id=${demoUserId}` : '';
    const trucksResponse = await fetch(`http://localhost:5000/api/trucks${demoParam}`, {
      headers: { 'Cookie': req.headers.cookie || '' }
    });
    
    const trucks = trucksResponse.ok ? await trucksResponse.json() : [];
    
    if (trucks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No trucks found for market analysis'
      });
    }
    
    // Get available loads with demo mode support
    const loadsResponse = await fetch(`http://localhost:5000/api/load-board${demoParam}`, {
      headers: { 'Cookie': req.headers.cookie || '' }
    });
    
    const availableLoads = loadsResponse.ok ? await loadsResponse.json() : [];
    
    // Use primary truck for analysis
    const primaryTruck = trucks[0];
    const avgCostPerMile = primaryTruck.totalMiles > 0 ? 
      (primaryTruck.fixedCosts + primaryTruck.variableCosts) / primaryTruck.totalMiles : 
      ((primaryTruck.fixedCosts + primaryTruck.variableCosts) / 3000);
    
    // Prepare request for market insights
    const recommendationRequest = {
      userId,
      truckId: primaryTruck.id,
      driverHours: { driveTimeRemaining: 11, onDutyRemaining: 14 }, // Default values for analysis
      fleetData: {
        avgCostPerMile,
        equipmentType: primaryTruck.equipmentType || 'Dry Van',
        preferredRoutes: [],
        historicalPerformance: null
      },
      availableLoads,
      marketConditions: {
        fuelPrice: parseFloat(req.query.fuelPrice as string) || 3.50,
        seasonality: (req.query.seasonality as string) || 'standard',
        marketDemand: (req.query.marketDemand as 'high' | 'medium' | 'low') || 'medium'
      }
    };
    
    // Generate market insights
    const marketInsights = loadRecommendationEngine.generateMarketInsights(recommendationRequest);
    
    res.json({
      success: true,
      marketInsights,
      fleetContext: {
        totalTrucks: trucks.length,
        primaryEquipmentType: primaryTruck.equipmentType,
        avgFleetCostPerMile: avgCostPerMile
      },
      marketData: {
        totalLoadsAnalyzed: availableLoads.length,
        analysisTimestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Market insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate market insights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;