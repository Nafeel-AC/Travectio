import { ELDProviderFactory, ELDProviderConfig, HOSStatus } from './eld-providers.js';
import { LoadBoardProviderFactory, LoadBoardConfig, Load, LoadSearchCriteria } from './loadboard-providers.js';
import { storage } from '../storage.js';

// Integration Credentials Schema (encrypted storage)
interface IntegrationCredentials {
  userId: string;
  truckId: string;
  eldConfig?: ELDProviderConfig;
  loadBoardConfig?: LoadBoardConfig;
  isActive: boolean;
  lastSyncTime?: string;
  syncErrors?: string[];
}

export class IntegrationManager {
  private static instance: IntegrationManager;
  private credentials: Map<string, IntegrationCredentials> = new Map();
  
  static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  // ELD Integration Methods
  async validateELDConnection(userId: string, truckId: string, config: ELDProviderConfig): Promise<boolean> {
    try {
      const provider = ELDProviderFactory.createProvider(config.provider);
      const isValid = await provider.validateConnection(config);
      
      if (isValid) {
        await this.storeELDCredentials(userId, truckId, config);
        console.log(`✅ ELD Integration: ${config.provider} connected for truck ${truckId}`);
      }
      
      return isValid;
    } catch (error) {
      console.error(`❌ ELD Integration failed for ${config.provider}:`, error);
      return false;
    }
  }

  async getHOSStatus(userId: string, truckId: string): Promise<HOSStatus | null> {
    try {
      const credentials = await this.getELDCredentials(userId, truckId);
      if (!credentials?.eldConfig) {
        return null;
      }

      const provider = ELDProviderFactory.createProvider(credentials.eldConfig.provider);
      const truck = await storage.getTruck(truckId);
      
      if (!truck?.eldDeviceId) {
        throw new Error('Truck missing ELD Device ID');
      }

      const hosStatus = await provider.getHOSStatus(credentials.eldConfig, truck.eldDeviceId);
      
      // Update last sync time
      await this.updateLastSyncTime(userId, truckId, 'eld');
      
      return hosStatus;
    } catch (error: any) {
      console.error(`❌ Failed to get HOS status for truck ${truckId}:`, error);
      await this.logSyncError(userId, truckId, 'eld', error.message);
      return null;
    }
  }

  async syncDriverLogs(userId: string, truckId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const credentials = await this.getELDCredentials(userId, truckId);
      if (!credentials?.eldConfig) {
        return [];
      }

      const provider = ELDProviderFactory.createProvider(credentials.eldConfig.provider);
      const truck = await storage.getTruck(truckId);
      
      if (!truck?.currentDriverId) {
        throw new Error('No active driver assigned to truck');
      }

      const logs = await provider.getDriverLogs(credentials.eldConfig, truck.currentDriverId, startDate, endDate);
      
      // Store logs in database
      for (const log of logs) {
        await storage.createHosLog({
          driverId: truck.currentDriverId,
          truckId: truckId,
          dutyStatus: log.status,
          startTime: log.startTime,
          endTime: log.endTime,
          location: log.location,
          notes: log.notes || '',
        });
      }

      await this.updateLastSyncTime(userId, truckId, 'eld');
      console.log(`✅ Synced ${logs.length} HOS logs for truck ${truckId}`);
      
      return logs;
    } catch (error: any) {
      console.error(`❌ Failed to sync driver logs for truck ${truckId}:`, error);
      await this.logSyncError(userId, truckId, 'eld', error.message);
      return [];
    }
  }

  // Load Board Integration Methods
  async validateLoadBoardConnection(userId: string, truckId: string, config: LoadBoardConfig): Promise<boolean> {
    try {
      const provider = LoadBoardProviderFactory.createProvider(config.provider);
      const isValid = await provider.validateConnection(config);
      
      if (isValid) {
        await this.storeLoadBoardCredentials(userId, truckId, config);
        console.log(`✅ Load Board Integration: ${config.provider} connected for truck ${truckId}`);
      }
      
      return isValid;
    } catch (error) {
      console.error(`❌ Load Board Integration failed for ${config.provider}:`, error);
      return false;
    }
  }

  async searchLoads(userId: string, truckId: string, criteria: LoadSearchCriteria): Promise<Load[]> {
    try {
      const credentials = await this.getLoadBoardCredentials(userId, truckId);
      if (!credentials?.loadBoardConfig) {
        return [];
      }

      const provider = LoadBoardProviderFactory.createProvider(credentials.loadBoardConfig.provider);
      
      // Get truck's current location (or use last known location)
      const truckLocation = await this.getTruckLocation(userId, truckId);
      if (!truckLocation) {
        throw new Error('Unable to determine truck location for load search');
      }

      const loads = await provider.searchLoads(credentials.loadBoardConfig, criteria, truckLocation);
      
      // Filter loads based on truck's equipment type
      const truck = await storage.getTruck(truckId);
      const filteredLoads = loads.filter(load => 
        criteria.equipmentTypes.includes(load.equipmentType) || 
        load.equipmentType === truck?.equipmentType
      );

      await this.updateLastSyncTime(userId, truckId, 'loadboard');
      console.log(`✅ Found ${filteredLoads.length} matching loads for truck ${truckId}`);
      
      return filteredLoads;
    } catch (error: any) {
      console.error(`❌ Failed to search loads for truck ${truckId}:`, error);
      await this.logSyncError(userId, truckId, 'loadboard', error.message);
      return [];
    }
  }

  async getMarketRates(userId: string, truckId: string, origin: string, destination: string): Promise<{ average: number; high: number; low: number } | null> {
    try {
      const credentials = await this.getLoadBoardCredentials(userId, truckId);
      if (!credentials?.loadBoardConfig) {
        return null;
      }

      const provider = LoadBoardProviderFactory.createProvider(credentials.loadBoardConfig.provider);
      const truck = await storage.getTruck(truckId);
      
      const rates = await provider.getMarketRates(
        credentials.loadBoardConfig,
        origin,
        destination,
        truck?.equipmentType || 'Dry Van'
      );
      
      return rates;
    } catch (error: any) {
      console.error(`❌ Failed to get market rates:`, error);
      return null;
    }
  }

  // Onboarding Integration Setup
  async setupIntegrationsForNewUser(userId: string, truckId: string, integrations: {
    eld?: { provider: string; apiKey: string; additionalConfig?: any };
    loadBoard?: { provider: string; apiKey: string; username?: string; password?: string; additionalConfig?: any };
  }): Promise<{ eldSuccess: boolean; loadBoardSuccess: boolean; errors: string[] }> {
    const results = {
      eldSuccess: false,
      loadBoardSuccess: false,
      errors: [] as string[],
    };

    // Setup ELD Integration
    if (integrations.eld) {
      try {
        const eldConfig: ELDProviderConfig = {
          provider: integrations.eld.provider as any,
          apiKey: integrations.eld.apiKey,
          baseUrl: ELDProviderFactory.getProviderBaseUrls()[integrations.eld.provider],
          additionalConfig: integrations.eld.additionalConfig,
        };

        results.eldSuccess = await this.validateELDConnection(userId, truckId, eldConfig);
        if (!results.eldSuccess) {
          results.errors.push(`Failed to connect to ${integrations.eld.provider} ELD system`);
        }
      } catch (error) {
        results.errors.push(`ELD setup error: ${(error as any).message}`);
      }
    }

    // Setup Load Board Integration
    if (integrations.loadBoard) {
      try {
        const loadBoardConfig: LoadBoardConfig = {
          provider: integrations.loadBoard.provider as any,
          apiKey: integrations.loadBoard.apiKey,
          username: integrations.loadBoard.username,
          password: integrations.loadBoard.password,
          baseUrl: LoadBoardProviderFactory.getProviderBaseUrls()[integrations.loadBoard.provider],
          additionalConfig: integrations.loadBoard.additionalConfig,
        };

        results.loadBoardSuccess = await this.validateLoadBoardConnection(userId, truckId, loadBoardConfig);
        if (!results.loadBoardSuccess) {
          results.errors.push(`Failed to connect to ${integrations.loadBoard.provider} load board`);
        }
      } catch (error) {
        results.errors.push(`Load board setup error: ${(error as any).message}`);
      }
    }

    // Update truck integration status
    if (results.eldSuccess || results.loadBoardSuccess) {
      await storage.updateTruck(truckId, {
        elogsIntegration: results.eldSuccess ? 'connected' : 'manual',
        loadBoardIntegration: results.loadBoardSuccess ? 'connected' : 'manual',
        elogsProvider: integrations.eld?.provider,
        preferredLoadBoard: integrations.loadBoard?.provider,
      });
    }

    return results;
  }

  // Automatic Sync Methods
  async performScheduledSync(userId: string, truckId: string): Promise<void> {
    console.log(`🔄 Starting scheduled sync for truck ${truckId}`);
    
    // Sync HOS data every 15 minutes
    const hosStatus = await this.getHOSStatus(userId, truckId);
    if (hosStatus) {
      // Update driver status in database
      await storage.updateDriver(hosStatus.driverId, {
        currentStatus: hosStatus.status,
        lastLocation: JSON.stringify(hosStatus.location),
        updatedAt: new Date(),
      });
    }

    // Sync driver logs daily
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    await this.syncDriverLogs(userId, truckId, yesterday.toISOString(), today.toISOString());
  }

  // Private Helper Methods
  private async storeELDCredentials(userId: string, truckId: string, config: ELDProviderConfig): Promise<void> {
    const key = `${userId}-${truckId}`;
    const existing = this.credentials.get(key) || { userId, truckId, isActive: true };
    existing.eldConfig = config;
    this.credentials.set(key, existing);
  }

  private async storeLoadBoardCredentials(userId: string, truckId: string, config: LoadBoardConfig): Promise<void> {
    const key = `${userId}-${truckId}`;
    const existing = this.credentials.get(key) || { userId, truckId, isActive: true };
    existing.loadBoardConfig = config;
    this.credentials.set(key, existing);
  }

  private async getELDCredentials(userId: string, truckId: string): Promise<IntegrationCredentials | null> {
    return this.credentials.get(`${userId}-${truckId}`) || null;
  }

  private async getLoadBoardCredentials(userId: string, truckId: string): Promise<IntegrationCredentials | null> {
    return this.credentials.get(`${userId}-${truckId}`) || null;
  }

  private async getTruckLocation(userId: string, truckId: string): Promise<{ latitude: number; longitude: number } | null> {
    // Try to get location from ELD first
    const credentials = await this.getELDCredentials(userId, truckId);
    if (credentials?.eldConfig) {
      try {
        const provider = ELDProviderFactory.createProvider(credentials.eldConfig.provider);
        const truck = await storage.getTruckById(truckId);
        if (truck?.eldDeviceId) {
          const location = await provider.getVehicleLocation(credentials.eldConfig, truck.eldDeviceId);
          return { latitude: location.latitude, longitude: location.longitude };
        }
      } catch (error) {
        console.warn('Could not get real-time truck location from ELD, using default');
      }
    }

    // Fallback to default location (Atlanta, GA)
    return { latitude: 33.7490, longitude: -84.3880 };
  }

  private async updateLastSyncTime(userId: string, truckId: string, type: 'eld' | 'loadboard'): Promise<void> {
    const key = `${userId}-${truckId}`;
    const credentials = this.credentials.get(key);
    if (credentials) {
      credentials.lastSyncTime = new Date().toISOString();
      credentials.syncErrors = []; // Clear errors on successful sync
      this.credentials.set(key, credentials);
    }
  }

  private async logSyncError(userId: string, truckId: string, type: 'eld' | 'loadboard', error: string): Promise<void> {
    const key = `${userId}-${truckId}`;
    const credentials = this.credentials.get(key);
    if (credentials) {
      credentials.syncErrors = credentials.syncErrors || [];
      credentials.syncErrors.push(`${type}: ${error} (${new Date().toISOString()})`);
      this.credentials.set(key, credentials);
    }
  }

  // Public utility methods
  getSupportedELDProviders(): string[] {
    return ELDProviderFactory.getSupportedProviders();
  }

  getSupportedLoadBoardProviders(): string[] {
    return LoadBoardProviderFactory.getSupportedProviders();
  }

  getIntegrationStatus(userId: string, truckId: string): IntegrationCredentials | null {
    return this.credentials.get(`${userId}-${truckId}`) || null;
  }
}

export const integrationManager = IntegrationManager.getInstance();