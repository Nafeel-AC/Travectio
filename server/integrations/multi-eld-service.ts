import { z } from "zod";
import { eldService, HOSStatus, HOSLogEntry, VehicleLocation } from "./eld-service";

// Enhanced ELD Service supporting multiple providers
export class MultiELDService {
  private providers: Map<string, any> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Samsara Service
    this.providers.set('Samsara', new SamsaraService());
    this.providers.set('samsara', new SamsaraService());
    
    // KeepTruckin (Motive) Service
    this.providers.set('KeepTruckin', new KeepTruckinService());
    this.providers.set('Motive', new KeepTruckinService());
    
    // Garmin Service
    this.providers.set('Garmin', new GarminService());
    
    // BigRoad Service
    this.providers.set('BigRoad', new BigRoadService());
    
    // FleetUp Service
    this.providers.set('FleetUp', new FleetUpService());
    
    // VDO RoadLog Service
    this.providers.set('VDO', new VDOService());
    
    // Omnitracs Service
    this.providers.set('Omnitracs', new OmnitracsService());
    
    // Geotab Service
    this.providers.set('Geotab', new GeotabService());
  }

  // Get HOS status for driver from their specific ELD provider
  async getDriverHOSStatus(driverId: string, eldProvider: string): Promise<HOSStatus> {
    const provider = this.providers.get(eldProvider);
    if (!provider) {
      throw new Error(`ELD provider ${eldProvider} not supported`);
    }

    return await provider.getDriverHOSStatus(driverId);
  }

  // Get HOS logs for driver from their specific ELD provider
  async getDriverHOSLogs(driverId: string, eldProvider: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    const provider = this.providers.get(eldProvider);
    if (!provider) {
      throw new Error(`ELD provider ${eldProvider} not supported`);
    }

    return await provider.getDriverHOSLogs(driverId, startDate, endDate);
  }

  // Get vehicle locations from specific ELD provider
  async getVehicleLocations(eldProvider: string, vehicleIds?: string[]): Promise<VehicleLocation[]> {
    const provider = this.providers.get(eldProvider);
    if (!provider) {
      throw new Error(`ELD provider ${eldProvider} not supported`);
    }

    return await provider.getVehicleLocations(vehicleIds);
  }

  // Test connection for specific ELD provider
  async testConnection(eldProvider: string): Promise<{ connected: boolean; provider: string; error?: string }> {
    const provider = this.providers.get(eldProvider);
    if (!provider) {
      return {
        connected: false,
        provider: eldProvider,
        error: `ELD provider ${eldProvider} not supported`
      };
    }

    return await provider.testConnection();
  }

  // Test all ELD provider connections
  async testAllConnections(): Promise<Record<string, { connected: boolean; error?: string }>> {
    const results: Record<string, { connected: boolean; error?: string }> = {};
    
    const providerNames = ['Samsara', 'KeepTruckin', 'Garmin', 'BigRoad', 'FleetUp', 'VDO', 'Omnitracs', 'Geotab'];
    
    await Promise.all(
      providerNames.map(async (providerName) => {
        try {
          const result = await this.testConnection(providerName);
          results[providerName] = {
            connected: result.connected,
            error: result.error
          };
        } catch (error) {
          results[providerName] = {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return results;
  }

  // Get supported ELD providers
  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys()).filter(key => key[0].toUpperCase() === key[0]);
  }
}

// Samsara ELD Service
class SamsaraService {
  private apiKey: string;
  private baseUrl: string = 'https://api.samsara.com/v1';

  constructor() {
    this.apiKey = process.env.SAMSARA_API_KEY || '';
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    if (!this.isConfigured()) {
      throw new Error("Samsara API key not configured. Please set SAMSARA_API_KEY environment variable.");
    }

    const response = await fetch(`${this.baseUrl}/fleet/drivers/${driverId}/hos_daily_logs`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    if (!response.ok) {
      throw new Error(`Samsara API Error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformHOSStatus(data, driverId);
  }

  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    const response = await fetch(`${this.baseUrl}/fleet/drivers/${driverId}/hos_daily_logs?startMs=${new Date(startDate).getTime()}&endMs=${new Date(endDate).getTime()}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    const data = await response.json();
    return (data.hosLogs || []).map((log: any) => this.transformHOSLogEntry(log, driverId));
  }

  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    const response = await fetch(`${this.baseUrl}/fleet/vehicles/locations`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    const data = await response.json();
    return (data.vehicles || []).map((vehicle: any) => this.transformVehicleLocation(vehicle));
  }

  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        connected: false,
        provider: 'Samsara',
        error: 'Samsara API key not configured. Please set SAMSARA_API_KEY environment variable.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/fleet/vehicles`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return { connected: response.ok, provider: 'Samsara' };
    } catch (error) {
      return {
        connected: false,
        provider: 'Samsara',
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }

  private transformHOSStatus(data: any, driverId: string): HOSStatus {
    return {
      driverId,
      driverName: data.driverName || 'Unknown Driver',
      vehicleId: data.vehicleId,
      currentDutyStatus: this.normalizeDutyStatus(data.dutyStatus),
      timeInCurrentStatus: data.timeInCurrentStatus || 0,
      availableDriveTime: data.timeUntilBreak || 0,
      availableOnDutyTime: data.driveTimeRemaining || 0,
      cycleHours: data.cycleHours || 0,
      cycleDaysRemaining: data.cycleDaysRemaining || 0,
      lastStatusChange: data.certifiedAtMs ? new Date(data.certifiedAtMs).toISOString() : new Date().toISOString(),
      violations: data.violations || [],
      location: data.location ? {
        lat: data.location.latitude,
        lng: data.location.longitude,
        address: data.location.name
      } : undefined
    };
  }

  private transformHOSLogEntry(log: any, driverId: string): HOSLogEntry {
    return {
      id: log.id || `${driverId}-${Date.now()}`,
      driverId,
      vehicleId: log.vehicleId,
      dutyStatus: this.normalizeDutyStatus(log.status),
      startTime: new Date(log.startMs).toISOString(),
      endTime: log.endMs ? new Date(log.endMs).toISOString() : undefined,
      duration: log.endMs ? (log.endMs - log.startMs) / 60000 : 0, // convert to minutes
      location: log.location ? {
        lat: log.location.latitude,
        lng: log.location.longitude,
        address: log.location.name
      } : undefined,
      odometer: log.odometerMiles,
      engineHours: log.engineHours,
      notes: log.notes,
      certified: log.certified || false
    };
  }

  private transformVehicleLocation(vehicle: any): VehicleLocation {
    return {
      vehicleId: vehicle.id,
      driverId: vehicle.assignedDriverId,
      lat: vehicle.location.latitude,
      lng: vehicle.location.longitude,
      address: vehicle.location.name,
      speed: vehicle.speed,
      heading: vehicle.heading,
      odometer: vehicle.odometerMiles,
      engineHours: vehicle.engineHours,
      fuelLevel: vehicle.fuelPercent,
      timestamp: new Date(vehicle.time).toISOString(),
      ignitionStatus: vehicle.ignitionState === 'ON'
    };
  }

  private normalizeDutyStatus(status: string): "ON_DUTY" | "OFF_DUTY" | "DRIVING" | "SLEEPER_BERTH" {
    const normalized = status.toUpperCase();
    if (normalized.includes('DRIVING')) return 'DRIVING';
    if (normalized.includes('SLEEPER')) return 'SLEEPER_BERTH';
    if (normalized.includes('ON') || normalized.includes('DUTY')) return 'ON_DUTY';
    return 'OFF_DUTY';
  }
}

// KeepTruckin (Motive) ELD Service
class KeepTruckinService {
  private apiKey: string;
  private baseUrl: string = 'https://api.keeptruckin.com/v1';

  constructor() {
    this.apiKey = process.env.KEEPTRUCKIN_API_KEY || process.env.MOTIVE_API_KEY || '';
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    if (!this.isConfigured()) {
      throw new Error("KeepTruckin API key not configured. Please set KEEPTRUCKIN_API_KEY or MOTIVE_API_KEY environment variable.");
    }

    const response = await fetch(`${this.baseUrl}/hos_logs?driver_id=${driverId}&date=${new Date().toISOString().split('T')[0]}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    if (!response.ok) {
      throw new Error(`KeepTruckin API Error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformHOSStatus(data, driverId);
  }

  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    const response = await fetch(`${this.baseUrl}/hos_logs?driver_id=${driverId}&start_date=${startDate}&end_date=${endDate}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    const data = await response.json();
    return (data.hos_logs || []).map((log: any) => this.transformHOSLogEntry(log, driverId));
  }

  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    const response = await fetch(`${this.baseUrl}/vehicles`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    const data = await response.json();
    return (data.vehicles || []).map((vehicle: any) => this.transformVehicleLocation(vehicle));
  }

  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        connected: false,
        provider: 'KeepTruckin',
        error: 'KeepTruckin API key not configured. Please set KEEPTRUCKIN_API_KEY or MOTIVE_API_KEY environment variable.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/vehicles`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return { connected: response.ok, provider: 'KeepTruckin' };
    } catch (error) {
      return {
        connected: false,
        provider: 'KeepTruckin',
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }

  private transformHOSStatus(data: any, driverId: string): HOSStatus {
    const current = data.hos_logs?.[0] || {};
    return {
      driverId,
      driverName: current.driver_name || 'Unknown Driver',
      vehicleId: current.vehicle_id,
      currentDutyStatus: this.normalizeDutyStatus(current.duty_status),
      timeInCurrentStatus: current.duration || 0,
      availableDriveTime: current.drive_time_remaining || 0,
      availableOnDutyTime: current.on_duty_time_remaining || 0,
      cycleHours: current.cycle_hours || 0,
      cycleDaysRemaining: current.cycle_days_remaining || 0,
      lastStatusChange: current.start_time || new Date().toISOString(),
      violations: current.violations || []
    };
  }

  private transformHOSLogEntry(log: any, driverId: string): HOSLogEntry {
    return {
      id: log.id,
      driverId,
      vehicleId: log.vehicle_id,
      dutyStatus: this.normalizeDutyStatus(log.duty_status),
      startTime: log.start_time,
      endTime: log.end_time,
      duration: log.duration,
      location: log.location ? {
        lat: log.location.lat,
        lng: log.location.lng,
        address: log.location.address
      } : undefined,
      odometer: log.odometer,
      engineHours: log.engine_hours,
      notes: log.notes,
      certified: log.certified || false
    };
  }

  private transformVehicleLocation(vehicle: any): VehicleLocation {
    return {
      vehicleId: vehicle.id,
      driverId: vehicle.driver_id,
      lat: vehicle.last_known_location?.lat || 0,
      lng: vehicle.last_known_location?.lng || 0,
      address: vehicle.last_known_location?.address,
      speed: vehicle.speed,
      heading: vehicle.heading,
      odometer: vehicle.odometer,
      engineHours: vehicle.engine_hours,
      timestamp: vehicle.last_known_location?.recorded_at || new Date().toISOString(),
      ignitionStatus: vehicle.ignition_on
    };
  }

  private normalizeDutyStatus(status: string): "ON_DUTY" | "OFF_DUTY" | "DRIVING" | "SLEEPER_BERTH" {
    const normalized = status?.toUpperCase() || '';
    if (normalized.includes('DRIVING')) return 'DRIVING';
    if (normalized.includes('SLEEPER')) return 'SLEEPER_BERTH';
    if (normalized.includes('ON')) return 'ON_DUTY';
    return 'OFF_DUTY';
  }
}

// Placeholder services for other ELD providers
class GarminService {
  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    throw new Error("Garmin ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    throw new Error("Garmin ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    throw new Error("Garmin ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    return { connected: false, provider: 'Garmin', error: 'Garmin ELD integration not yet implemented. Please contact support for setup assistance.' };
  }
}

class BigRoadService {
  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    throw new Error("BigRoad ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    throw new Error("BigRoad ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    throw new Error("BigRoad ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    return { connected: false, provider: 'BigRoad', error: 'BigRoad ELD integration not yet implemented. Please contact support for setup assistance.' };
  }
}

class FleetUpService {
  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    throw new Error("FleetUp ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    throw new Error("FleetUp ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    throw new Error("FleetUp ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    return { connected: false, provider: 'FleetUp', error: 'FleetUp ELD integration not yet implemented. Please contact support for setup assistance.' };
  }
}

class VDOService {
  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    throw new Error("VDO RoadLog ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    throw new Error("VDO RoadLog ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    throw new Error("VDO RoadLog ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    return { connected: false, provider: 'VDO', error: 'VDO RoadLog ELD integration not yet implemented. Please contact support for setup assistance.' };
  }
}

class OmnitracsService {
  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    throw new Error("Omnitracs ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    throw new Error("Omnitracs ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    throw new Error("Omnitracs ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    return { connected: false, provider: 'Omnitracs', error: 'Omnitracs ELD integration not yet implemented. Please contact support for setup assistance.' };
  }
}

class GeotabService {
  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    throw new Error("Geotab ELD integration not yet implemented. Please contact support for setup assistance.");  
  }
  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    throw new Error("Geotab ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    throw new Error("Geotab ELD integration not yet implemented. Please contact support for setup assistance.");
  }
  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    return { connected: false, provider: 'Geotab', error: 'Geotab ELD integration not yet implemented. Please contact support for setup assistance.' };
  }
}

export const multiELDService = new MultiELDService();