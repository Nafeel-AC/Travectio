import { Router } from 'express';
import { z } from 'zod';
import { integrationManager } from '../integrations/integration-manager.js';
import { onboardingIntegrationService, OnboardingIntegrationSchema } from '../integrations/onboarding-integration.js';
import { ELDProviderFactory } from '../integrations/eld-providers.js';
import { LoadBoardProviderFactory, LoadSearchCriteriaSchema } from '../integrations/loadboard-providers.js';
// Simple middleware for now - will use existing auth pattern
const checkAuth = (req: any, res: any, next: any) => {
  // For now, use a simple user check - in production this would be proper auth
  req.user = { userId: '45506370' }; // Default user for testing
  next();
};

const validateRequest = (schema: any) => (req: any, res: any, next: any) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data', details: (error as any).message });
  }
};

const router = Router();

// Get available integration providers
router.get('/providers', checkAuth, async (req, res) => {
  try {
    const providers = onboardingIntegrationService.getAvailableProviders();
    res.json(providers);
  } catch (error) {
    console.error('Error getting integration providers:', error);
    res.status(500).json({ error: 'Failed to get integration providers' });
  }
});

// Setup integrations during onboarding
router.post('/setup', checkAuth, validateRequest(OnboardingIntegrationSchema), async (req, res) => {
  try {
    const { userId } = req.user;
    const setupRequest = { ...req.body, userId };
    
    console.log(`🚀 Setting up integrations for user ${userId}, truck ${setupRequest.truckId}`);
    
    const result = await onboardingIntegrationService.setupIntegrations(setupRequest);
    
    res.json({
      success: result.success,
      eldConnected: result.eldResult?.connected || false,
      loadBoardConnected: result.loadBoardResult?.connected || false,
      eldProvider: result.eldResult?.provider,
      loadBoardProvider: result.loadBoardResult?.provider,
      capabilities: {
        eld: result.eldResult?.capabilities || [],
        loadBoard: result.loadBoardResult?.capabilities || [],
      },
      testData: {
        eld: result.eldResult?.testData,
        loadBoard: result.loadBoardResult?.testData,
      },
      errors: result.errors,
      nextSteps: result.nextSteps,
    });
    
  } catch (error) {
    console.error('Integration setup error:', error);
    res.status(500).json({ 
      error: 'Failed to setup integrations',
      details: (error as any).message 
    });
  }
});

// Get HOS status for a truck
router.get('/trucks/:truckId/hos-status', checkAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { truckId } = req.params;
    
    const hosStatus = await integrationManager.getHOSStatus(userId, truckId);
    
    if (!hosStatus) {
      return res.status(404).json({ error: 'HOS status not available. Check ELD integration.' });
    }
    
    res.json(hosStatus);
    
  } catch (error) {
    console.error('Error getting HOS status:', error);
    res.status(500).json({ 
      error: 'Failed to get HOS status',
      details: (error as any).message 
    });
  }
});

// Search loads for a truck
router.post('/trucks/:truckId/search-loads', checkAuth, validateRequest(LoadSearchCriteriaSchema), async (req, res) => {
  try {
    const { userId } = req.user;
    const { truckId } = req.params;
    const searchCriteria = req.body;
    
    const loads = await integrationManager.searchLoads(userId, truckId, searchCriteria);
    
    res.json({
      loads,
      count: loads.length,
      searchCriteria,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error searching loads:', error);
    res.status(500).json({ 
      error: 'Failed to search loads',
      details: (error as any).message 
    });
  }
});

// Get market rates
router.get('/market-rates', checkAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { truckId, origin, destination } = req.query as { truckId: string; origin: string; destination: string };
    
    if (!truckId || !origin || !destination) {
      return res.status(400).json({ error: 'Missing required parameters: truckId, origin, destination' });
    }
    
    const rates = await integrationManager.getMarketRates(userId, truckId, origin, destination);
    
    if (!rates) {
      return res.status(404).json({ error: 'Market rates not available. Check load board integration.' });
    }
    
    res.json({
      origin,
      destination,
      rates,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error getting market rates:', error);
    res.status(500).json({ 
      error: 'Failed to get market rates',
      details: (error as any).message 
    });
  }
});

// Sync driver logs for a truck
router.post('/trucks/:truckId/sync-logs', checkAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { truckId } = req.params;
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const logs = await integrationManager.syncDriverLogs(userId, truckId, startDate, endDate);
    
    res.json({
      success: true,
      logsCount: logs.length,
      syncPeriod: { startDate, endDate },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error syncing driver logs:', error);
    res.status(500).json({ 
      error: 'Failed to sync driver logs',
      details: (error as any).message 
    });
  }
});

// Get integration status for a truck
router.get('/trucks/:truckId/status', checkAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { truckId } = req.params;
    
    const status = integrationManager.getIntegrationStatus(userId, truckId);
    
    if (!status) {
      return res.json({
        eldConnected: false,
        loadBoardConnected: false,
        lastSyncTime: null,
        syncErrors: [],
      });
    }
    
    res.json({
      eldConnected: !!status.eldConfig,
      loadBoardConnected: !!status.loadBoardConfig,
      eldProvider: status.eldConfig?.provider,
      loadBoardProvider: status.loadBoardConfig?.provider,
      lastSyncTime: status.lastSyncTime,
      syncErrors: status.syncErrors || [],
      isActive: status.isActive,
    });
    
  } catch (error) {
    console.error('Error getting integration status:', error);
    res.status(500).json({ 
      error: 'Failed to get integration status',
      details: (error as any).message 
    });
  }
});

// Trigger manual sync for a truck
router.post('/trucks/:truckId/sync', checkAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { truckId } = req.params;
    
    // Perform scheduled sync (includes HOS status and recent logs)
    await integrationManager.performScheduledSync(userId, truckId);
    
    res.json({
      success: true,
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error performing manual sync:', error);
    res.status(500).json({ 
      error: 'Failed to perform sync',
      details: (error as any).message 
    });
  }
});

// Test ELD connection
router.post('/test-eld', checkAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { truckId, provider, apiKey, additionalConfig } = req.body;
    
    if (!truckId || !provider || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields: truckId, provider, apiKey' });
    }
    
    const config = {
      provider,
      apiKey,
      baseUrl: ELDProviderFactory.getProviderBaseUrls()[provider],
      additionalConfig,
    };
    
    const isConnected = await integrationManager.validateELDConnection(userId, truckId, config);
    
    res.json({
      connected: isConnected,
      provider,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error testing ELD connection:', error);
    res.status(500).json({ 
      error: 'Failed to test ELD connection',
      details: (error as any).message 
    });
  }
});

// Test load board connection
router.post('/test-loadboard', checkAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { truckId, provider, apiKey, username, password, additionalConfig } = req.body;
    
    if (!truckId || !provider || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields: truckId, provider, apiKey' });
    }
    
    const config = {
      provider,
      apiKey,
      username,
      password,
      baseUrl: LoadBoardProviderFactory.getProviderBaseUrls()[provider],
      additionalConfig,
    };
    
    const isConnected = await integrationManager.validateLoadBoardConnection(userId, truckId, config);
    
    res.json({
      connected: isConnected,
      provider,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error testing load board connection:', error);
    res.status(500).json({ 
      error: 'Failed to test load board connection',
      details: (error as any).message 
    });
  }
});

export default router;