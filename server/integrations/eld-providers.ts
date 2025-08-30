import { z } from 'zod';

// ELD Provider Configuration Schema
export const ELDProviderConfigSchema = z.object({
  provider: z.enum(['samsara', 'motive', 'garmin', 'bigroad', 'fleetup', 'vdo', 'omnitracs', 'geotab']),
  apiKey: z.string(),
  baseUrl: z.string(),
  additionalConfig: z.record(z.any()).optional(),
});

export type ELDProviderConfig = z.infer<typeof ELDProviderConfigSchema>;

// HOS Status Schema
export const HOSStatusSchema = z.object({
  driverId: z.string(),
  vehicleId: z.string(),
  status: z.enum(['on_duty', 'driving', 'sleeper', 'off_duty']),
  timeRemaining: z.number(), // minutes remaining for current status
  dutyStartTime: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  lastUpdated: z.string(),
});

export type HOSStatus = z.infer<typeof HOSStatusSchema>;

// ELD Provider Interface
export interface ELDProvider {
  validateConnection(config: ELDProviderConfig): Promise<boolean>;
  getHOSStatus(config: ELDProviderConfig, vehicleId: string): Promise<HOSStatus>;
  getDriverLogs(config: ELDProviderConfig, driverId: string, startDate: string, endDate: string): Promise<any[]>;
  getVehicleLocation(config: ELDProviderConfig, vehicleId: string): Promise<{ latitude: number; longitude: number; timestamp: string }>;
}

// Samsara ELD Provider
export class SamsaraProvider implements ELDProvider {
  async validateConnection(config: ELDProviderConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.baseUrl}/fleet/drivers`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Samsara connection validation failed:', error);
      return false;
    }
  }

  async getHOSStatus(config: ELDProviderConfig, vehicleId: string): Promise<HOSStatus> {
    const response = await fetch(`${config.baseUrl}/fleet/hos_logs?vehicleId=${vehicleId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Samsara API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Samsara response to standard format
    return {
      driverId: data.driverId,
      vehicleId: vehicleId,
      status: this.mapSamsaraStatus(data.dutyStatus),
      timeRemaining: data.timeUntilBreak || 0,
      dutyStartTime: data.dutyStartTime,
      location: {
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
        address: data.location?.address,
      },
      lastUpdated: data.logDate,
    };
  }

  async getDriverLogs(config: ELDProviderConfig, driverId: string, startDate: string, endDate: string): Promise<any[]> {
    const response = await fetch(`${config.baseUrl}/fleet/hos_logs?driverId=${driverId}&startMs=${new Date(startDate).getTime()}&endMs=${new Date(endDate).getTime()}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Samsara API error: ${response.status}`);
    }

    return await response.json();
  }

  async getVehicleLocation(config: ELDProviderConfig, vehicleId: string): Promise<{ latitude: number; longitude: number; timestamp: string }> {
    const response = await fetch(`${config.baseUrl}/fleet/vehicles/${vehicleId}/locations`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Samsara API error: ${response.status}`);
    }

    const data = await response.json();
    const location = data.data[0];
    
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.time,
    };
  }

  private mapSamsaraStatus(status: string): 'on_duty' | 'driving' | 'sleeper' | 'off_duty' {
    const statusMap: Record<string, 'on_duty' | 'driving' | 'sleeper' | 'off_duty'> = {
      'ON_DUTY': 'on_duty',
      'DRIVING': 'driving',
      'SLEEPER': 'sleeper',
      'OFF_DUTY': 'off_duty',
    };
    return statusMap[status] || 'off_duty';
  }
}

// Motive (KeepTruckin) ELD Provider
export class MotiveProvider implements ELDProvider {
  async validateConnection(config: ELDProviderConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.baseUrl}/v1/drivers`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Motive connection validation failed:', error);
      return false;
    }
  }

  async getHOSStatus(config: ELDProviderConfig, vehicleId: string): Promise<HOSStatus> {
    const response = await fetch(`${config.baseUrl}/v1/hos_logs?vehicle_id=${vehicleId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Motive API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      driverId: data.driver_id,
      vehicleId: vehicleId,
      status: this.mapMotiveStatus(data.current_status),
      timeRemaining: data.remaining_drive_time || 0,
      dutyStartTime: data.cycle_start_time,
      location: {
        latitude: data.location?.lat || 0,
        longitude: data.location?.lng || 0,
        address: data.location?.formatted_address,
      },
      lastUpdated: data.updated_at,
    };
  }

  async getDriverLogs(config: ELDProviderConfig, driverId: string, startDate: string, endDate: string): Promise<any[]> {
    const response = await fetch(`${config.baseUrl}/v1/hos_logs?driver_id=${driverId}&start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Motive API error: ${response.status}`);
    }

    return await response.json();
  }

  async getVehicleLocation(config: ELDProviderConfig, vehicleId: string): Promise<{ latitude: number; longitude: number; timestamp: string }> {
    const response = await fetch(`${config.baseUrl}/v1/vehicles/${vehicleId}/locations`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Motive API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      latitude: data.lat,
      longitude: data.lng,
      timestamp: data.recorded_at,
    };
  }

  private mapMotiveStatus(status: string): 'on_duty' | 'driving' | 'sleeper' | 'off_duty' {
    const statusMap: Record<string, 'on_duty' | 'driving' | 'sleeper' | 'off_duty'> = {
      'on_duty_not_driving': 'on_duty',
      'driving': 'driving',
      'sleeper_berth': 'sleeper',
      'off_duty': 'off_duty',
    };
    return statusMap[status] || 'off_duty';
  }
}

// ELD Provider Factory
export class ELDProviderFactory {
  static createProvider(providerName: string): ELDProvider {
    switch (providerName.toLowerCase()) {
      case 'samsara':
        return new SamsaraProvider();
      case 'motive':
      case 'keeptruckin':
        return new MotiveProvider();
      case 'garmin':
        // Would implement GarminProvider
        throw new Error('Garmin provider not yet implemented');
      case 'bigroad':
        // Would implement BigRoadProvider
        throw new Error('BigRoad provider not yet implemented');
      case 'fleetup':
        // Would implement FleetUpProvider
        throw new Error('FleetUp provider not yet implemented');
      case 'vdo':
        // Would implement VDOProvider
        throw new Error('VDO RoadLog provider not yet implemented');
      case 'omnitracs':
        // Would implement OmnitracsProvider
        throw new Error('Omnitracs provider not yet implemented');
      case 'geotab':
        // Would implement GeotabProvider
        throw new Error('Geotab provider not yet implemented');
      default:
        throw new Error(`Unknown ELD provider: ${providerName}`);
    }
  }

  static getSupportedProviders(): string[] {
    return ['samsara', 'motive', 'garmin', 'bigroad', 'fleetup', 'vdo', 'omnitracs', 'geotab'];
  }

  static getProviderBaseUrls(): Record<string, string> {
    return {
      samsara: 'https://api.samsara.com',
      motive: 'https://api.gomotive.com',
      garmin: 'https://api.garmin.com',
      bigroad: 'https://api.bigroad.com',
      fleetup: 'https://api.fleetup.com',
      vdo: 'https://api.vdoroadlog.com',
      omnitracs: 'https://api.omnitracs.com',
      geotab: 'https://api.geotab.com',
    };
  }
}