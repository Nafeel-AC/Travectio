import { z } from 'zod';
import { integrationManager } from './integration-manager.js';
import { ELDProviderFactory } from './eld-providers.js';
import { LoadBoardProviderFactory } from './loadboard-providers.js';

// Onboarding Integration Request Schema
export const OnboardingIntegrationSchema = z.object({
  userId: z.string(),
  truckId: z.string(),
  integrations: z.object({
    eld: z.object({
      provider: z.enum(['samsara', 'motive', 'garmin', 'bigroad', 'fleetup', 'vdo', 'omnitracs', 'geotab']),
      apiKey: z.string().min(1, 'ELD API key is required'),
      additionalConfig: z.record(z.any()).optional(),
    }).optional(),
    loadBoard: z.object({
      provider: z.enum(['dat', 'truckstop', '123loadboard', 'superdispatch']),
      apiKey: z.string().min(1, 'Load board API key is required'),
      username: z.string().optional(),
      password: z.string().optional(),
      additionalConfig: z.record(z.any()).optional(),
    }).optional(),
  }),
});

export type OnboardingIntegrationRequest = z.infer<typeof OnboardingIntegrationSchema>;

// Integration Test Results
export interface IntegrationTestResult {
  provider: string;
  type: 'eld' | 'loadboard';
  connected: boolean;
  error?: string;
  capabilities?: string[];
  testData?: any;
}

export class OnboardingIntegrationService {
  
  /**
   * Test and setup integrations for a new user during onboarding
   */
  async setupIntegrations(request: OnboardingIntegrationRequest): Promise<{
    success: boolean;
    eldResult?: IntegrationTestResult;
    loadBoardResult?: IntegrationTestResult;
    errors: string[];
    nextSteps: string[];
  }> {
    const results = {
      success: false,
      errors: [] as string[],
      nextSteps: [] as string[],
      eldResult: undefined as IntegrationTestResult | undefined,
      loadBoardResult: undefined as IntegrationTestResult | undefined,
    };

    console.log(`🚀 Starting integration setup for user ${request.userId}, truck ${request.truckId}`);

    // Test ELD Integration
    if (request.integrations.eld) {
      results.eldResult = await this.testELDIntegration(
        request.userId,
        request.truckId,
        request.integrations.eld
      );
      
      if (!results.eldResult.connected) {
        results.errors.push(results.eldResult.error || 'ELD connection failed');
      }
    }

    // Test Load Board Integration
    if (request.integrations.loadBoard) {
      results.loadBoardResult = await this.testLoadBoardIntegration(
        request.userId,
        request.truckId,
        request.integrations.loadBoard
      );
      
      if (!results.loadBoardResult.connected) {
        results.errors.push(results.loadBoardResult.error || 'Load board connection failed');
      }
    }

    // Setup successful integrations
    if (results.eldResult?.connected || results.loadBoardResult?.connected) {
      const setupResult = await integrationManager.setupIntegrationsForNewUser(
        request.userId,
        request.truckId,
        {
          eld: request.integrations.eld,
          loadBoard: request.integrations.loadBoard,
        }
      );

      results.success = setupResult.eldSuccess || setupResult.loadBoardSuccess;
      results.errors.push(...setupResult.errors);
    }

    // Generate next steps
    results.nextSteps = this.generateNextSteps(results);

    console.log(`✅ Integration setup completed. Success: ${results.success}, Errors: ${results.errors.length}`);
    
    return results;
  }

  /**
   * Test ELD provider connection and capabilities
   */
  private async testELDIntegration(
    userId: string,
    truckId: string,
    eldConfig: { provider: string; apiKey: string; additionalConfig?: any }
  ): Promise<IntegrationTestResult> {
    const result: IntegrationTestResult = {
      provider: eldConfig.provider,
      type: 'eld',
      connected: false,
      capabilities: [],
    };

    try {
      console.log(`🔧 Testing ELD connection: ${eldConfig.provider}`);

      const config = {
        provider: eldConfig.provider as any,
        apiKey: eldConfig.apiKey,
        baseUrl: ELDProviderFactory.getProviderBaseUrls()[eldConfig.provider],
        additionalConfig: eldConfig.additionalConfig,
      };

      // Test basic connection
      const isConnected = await integrationManager.validateELDConnection(userId, truckId, config);
      result.connected = isConnected;

      if (isConnected) {
        // Test capabilities
        result.capabilities = ['hos_status', 'driver_logs', 'vehicle_location'];
        
        // Try to get sample data
        try {
          const hosStatus = await integrationManager.getHOSStatus(userId, truckId);
          if (hosStatus) {
            result.testData = {
              sampleHOSStatus: {
                status: hosStatus.status,
                timeRemaining: hosStatus.timeRemaining,
                location: hosStatus.location,
              },
            };
          }
        } catch (error) {
          console.warn('Could not retrieve sample HOS data:', error.message);
          result.capabilities.push('connection_only');
        }

        console.log(`✅ ELD ${eldConfig.provider} connected successfully`);
      } else {
        result.error = `Failed to connect to ${eldConfig.provider} ELD system. Please verify your API key.`;
        console.log(`❌ ELD ${eldConfig.provider} connection failed`);
      }

    } catch (error) {
      result.error = `ELD integration error: ${(error as any).message}`;
      console.error(`❌ ELD ${eldConfig.provider} test failed:`, error);
    }

    return result;
  }

  /**
   * Test Load Board provider connection and capabilities
   */
  private async testLoadBoardIntegration(
    userId: string,
    truckId: string,
    loadBoardConfig: { provider: string; apiKey: string; username?: string; password?: string; additionalConfig?: any }
  ): Promise<IntegrationTestResult> {
    const result: IntegrationTestResult = {
      provider: loadBoardConfig.provider,
      type: 'loadboard',
      connected: false,
      capabilities: [],
    };

    try {
      console.log(`🔧 Testing Load Board connection: ${loadBoardConfig.provider}`);

      const config = {
        provider: loadBoardConfig.provider as any,
        apiKey: loadBoardConfig.apiKey,
        username: loadBoardConfig.username,
        password: loadBoardConfig.password,
        baseUrl: LoadBoardProviderFactory.getProviderBaseUrls()[loadBoardConfig.provider],
        additionalConfig: loadBoardConfig.additionalConfig,
      };

      // Test basic connection
      const isConnected = await integrationManager.validateLoadBoardConnection(userId, truckId, config);
      result.connected = isConnected;

      if (isConnected) {
        // Test capabilities
        result.capabilities = ['load_search', 'load_details', 'market_rates'];
        
        // Try to get sample loads
        try {
          const sampleLoads = await integrationManager.searchLoads(userId, truckId, {
            originRadius: 50,
            equipmentTypes: ['Dry Van'],
            maxDeadheadMiles: 150,
            pickupDateStart: new Date().toISOString().split('T')[0],
            pickupDateEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          if (sampleLoads.length > 0) {
            result.testData = {
              sampleLoadCount: sampleLoads.length,
              sampleLoad: {
                origin: `${sampleLoads[0].originCity}, ${sampleLoads[0].originState}`,
                destination: `${sampleLoads[0].destinationCity}, ${sampleLoads[0].destinationState}`,
                rate: sampleLoads[0].rate,
                ratePerMile: sampleLoads[0].ratePerMile,
                mileage: sampleLoads[0].mileage,
              },
            };
          }
        } catch (error) {
          console.warn('Could not retrieve sample load data:', error.message);
          result.capabilities.push('connection_only');
        }

        console.log(`✅ Load Board ${loadBoardConfig.provider} connected successfully`);
      } else {
        result.error = `Failed to connect to ${loadBoardConfig.provider} load board. Please verify your credentials.`;
        console.log(`❌ Load Board ${loadBoardConfig.provider} connection failed`);
      }

    } catch (error) {
      result.error = `Load board integration error: ${(error as any).message}`;
      console.error(`❌ Load Board ${loadBoardConfig.provider} test failed:`, error);
    }

    return result;
  }

  /**
   * Generate actionable next steps based on integration results
   */
  private generateNextSteps(results: {
    eldResult?: IntegrationTestResult;
    loadBoardResult?: IntegrationTestResult;
    errors: string[];
  }): string[] {
    const steps: string[] = [];

    // ELD Integration Steps
    if (results.eldResult) {
      if (results.eldResult.connected) {
        steps.push(`✅ ${results.eldResult.provider} ELD is connected and ready for automatic HOS tracking`);
        steps.push(`📊 Your driver logs will automatically sync every 15 minutes`);
        if (results.eldResult.testData) {
          steps.push(`🚛 Real-time vehicle location and driver status monitoring is active`);
        }
      } else {
        steps.push(`❌ Fix ${results.eldResult.provider} ELD connection: ${results.eldResult.error}`);
        steps.push(`🔑 Verify your API key and ensure the ELD device is properly configured`);
      }
    }

    // Load Board Integration Steps
    if (results.loadBoardResult) {
      if (results.loadBoardResult.connected) {
        steps.push(`✅ ${results.loadBoardResult.provider} load board is connected and ready for automatic load matching`);
        if (results.loadBoardResult.testData?.sampleLoadCount) {
          steps.push(`📋 Found ${results.loadBoardResult.testData.sampleLoadCount} available loads in your area`);
        }
        steps.push(`💰 Market rate analysis is available for route planning`);
      } else {
        steps.push(`❌ Fix ${results.loadBoardResult.provider} load board connection: ${results.loadBoardResult.error}`);
        steps.push(`🔑 Verify your credentials and ensure you have active access to the load board`);
      }
    }

    // General next steps
    if (results.eldResult?.connected || results.loadBoardResult?.connected) {
      steps.push(`🚀 Complete your truck setup by adding driver assignments and cost breakdowns`);
      steps.push(`📈 Start tracking your first loads to see profit analysis and performance metrics`);
    } else {
      steps.push(`🔧 Set up integrations later from the truck management page if you need more time`);
      steps.push(`📱 You can still use manual entry for loads and HOS compliance tracking`);
    }

    return steps;
  }

  /**
   * Get available integration providers
   */
  getAvailableProviders(): {
    eld: Array<{ name: string; displayName: string; features: string[] }>;
    loadBoard: Array<{ name: string; displayName: string; features: string[] }>;
  } {
    return {
      eld: [
        { name: 'samsara', displayName: 'Samsara', features: ['Real-time HOS', 'Vehicle tracking', 'Driver management'] },
        { name: 'motive', displayName: 'Motive (KeepTruckin)', features: ['HOS compliance', 'DVIR', 'Fleet tracking'] },
        { name: 'garmin', displayName: 'Garmin', features: ['ELD compliance', 'Navigation', 'Fleet management'] },
        { name: 'geotab', displayName: 'Geotab', features: ['Fleet tracking', 'HOS monitoring', 'Vehicle diagnostics'] },
      ],
      loadBoard: [
        { name: 'dat', displayName: 'DAT Load Board', features: ['Load matching', 'Market rates', 'Credit checks'] },
        { name: 'truckstop', displayName: 'Truckstop.com', features: ['Load search', 'Rate analysis', 'Broker ratings'] },
        { name: '123loadboard', displayName: '123Loadboard', features: ['Load posting', 'Credit reports', 'Load tracking'] },
        { name: 'superdispatch', displayName: 'SuperDispatch', features: ['Auto transport', 'Load management', 'Driver app'] },
      ],
    };
  }
}

export const onboardingIntegrationService = new OnboardingIntegrationService();