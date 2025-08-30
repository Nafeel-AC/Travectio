import { z } from "zod";

// ELD Configuration - Support multiple providers
const ELD_CONFIG = {
  PROVIDER: process.env.ELD_PROVIDER || "samsara", // samsara, omnitracs, geotab, etc.
  API_KEY: process.env.ELD_API_KEY,
  API_SECRET: process.env.ELD_API_SECRET,
  BASE_URL: process.env.ELD_API_BASE_URL,
  TIMEOUT: 30000
};

// HOS Status Schema
export const HOSStatusSchema = z.object({
  driverId: z.string(),
  driverName: z.string(),
  vehicleId: z.string().optional(),
  currentDutyStatus: z.enum(["ON_DUTY", "OFF_DUTY", "DRIVING", "SLEEPER_BERTH"]),
  timeInCurrentStatus: z.number(), // minutes
  availableDriveTime: z.number(), // minutes remaining
  availableOnDutyTime: z.number(), // minutes remaining
  cycleHours: z.number(), // hours used in current cycle
  cycleDaysRemaining: z.number(),
  lastStatusChange: z.string(), // ISO date
  violations: z.array(z.object({
    type: z.string(),
    description: z.string(),
    severity: z.enum(["warning", "violation"]),
    timestamp: z.string()
  })).optional(),
  nextRequiredBreak: z.string().optional(), // ISO date
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional()
  }).optional()
});

export type HOSStatus = z.infer<typeof HOSStatusSchema>;

// HOS Log Entry Schema
export const HOSLogEntrySchema = z.object({
  id: z.string(),
  driverId: z.string(),
  vehicleId: z.string().optional(),
  dutyStatus: z.enum(["ON_DUTY", "OFF_DUTY", "DRIVING", "SLEEPER_BERTH"]),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number(), // minutes
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional()
  }).optional(),
  odometer: z.number().optional(),
  engineHours: z.number().optional(),
  notes: z.string().optional(),
  editedBy: z.string().optional(),
  certified: z.boolean().default(false)
});

export type HOSLogEntry = z.infer<typeof HOSLogEntrySchema>;

// Vehicle Location Schema
export const VehicleLocationSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
  speed: z.number().optional(), // mph
  heading: z.number().optional(), // degrees
  odometer: z.number().optional(),
  engineHours: z.number().optional(),
  fuelLevel: z.number().optional(), // percentage
  timestamp: z.string(),
  ignitionStatus: z.boolean().optional()
});

export type VehicleLocation = z.infer<typeof VehicleLocationSchema>;

export class ELDService {
  private provider: string;
  private apiKey: string;
  private apiSecret?: string;
  private baseUrl: string;

  constructor() {
    this.provider = ELD_CONFIG.PROVIDER;
    this.apiKey = ELD_CONFIG.API_KEY || '';
    this.apiSecret = ELD_CONFIG.API_SECRET;
    this.baseUrl = ELD_CONFIG.BASE_URL || this.getDefaultBaseUrl();
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getDefaultBaseUrl(): string {
    switch (this.provider.toLowerCase()) {
      case 'samsara':
        return 'https://api.samsara.com/v1';
      case 'omnitracs':
        return 'https://api.omnitracs.com/v1';
      case 'geotab':
        return 'https://api.geotab.com/v1';
      case 'fleetcomplete':
        return 'https://api.fleetcomplete.com/v1';
      default:
        return 'https://api.example-eld.com/v1';
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': this.getAuthHeader(),
      ...options.headers
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ELD_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ELD API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ELD API Request failed:', error);
      throw error;
    }
  }

  private getAuthHeader(): string {
    switch (this.provider.toLowerCase()) {
      case 'samsara':
        return `Bearer ${this.apiKey}`;
      case 'omnitracs':
        return `ApiKey ${this.apiKey}`;
      case 'geotab':
        return `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
      default:
        return `Bearer ${this.apiKey}`;
    }
  }

  // Get current HOS status for a driver
  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    if (!this.isConfigured()) {
      throw new Error("ELD API credentials not configured. Please set ELD_API_KEY and ELD_PROVIDER environment variables.");
    }
    
    try {
      const endpoint = this.getEndpoint('hos-status', { driverId });
      const response = await this.makeRequest(endpoint);
      
      return this.transformHOSStatus(response, driverId);
    } catch (error) {
      console.error('Failed to get HOS status:', error);
      throw new Error('Unable to fetch HOS status from ELD provider.');
    }
  }

  // Get HOS logs for a driver within date range
  async getDriverHOSLogs(driverId: string, startDate: string, endDate: string): Promise<HOSLogEntry[]> {
    try {
      const endpoint = this.getEndpoint('hos-logs', { driverId, startDate, endDate });
      const response = await this.makeRequest(endpoint);
      
      const logs = response.logs || response.data || [];
      return logs.map((log: any) => this.transformHOSLogEntry(log, driverId));
    } catch (error) {
      console.error('Failed to get HOS logs:', error);
      throw new Error('Unable to fetch HOS logs from ELD provider.');
    }
  }

  // Get current vehicle locations
  async getVehicleLocations(vehicleIds?: string[]): Promise<VehicleLocation[]> {
    try {
      const endpoint = this.getEndpoint('vehicle-locations', { vehicleIds });
      const response = await this.makeRequest(endpoint);
      
      const locations = response.locations || response.data || [];
      return locations.map((location: any) => this.transformVehicleLocation(location));
    } catch (error) {
      console.error('Failed to get vehicle locations:', error);
      throw new Error('Unable to fetch vehicle locations from ELD provider.');
    }
  }

  // Update driver duty status
  async updateDriverDutyStatus(driverId: string, status: string, location?: { lat: number; lng: number }): Promise<{ success: boolean }> {
    try {
      const payload = {
        driver_id: driverId,
        duty_status: status,
        timestamp: new Date().toISOString(),
        ...(location && { location })
      };

      const endpoint = this.getEndpoint('update-duty-status');
      await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update duty status:', error);
      return { success: false };
    }
  }

  // Get HOS violations for fleet
  async getHOSViolations(startDate: string, endDate: string): Promise<Array<{
    driverId: string;
    driverName: string;
    violationType: string;
    description: string;
    timestamp: string;
    severity: string;
  }>> {
    try {
      const endpoint = this.getEndpoint('hos-violations', { startDate, endDate });
      const response = await this.makeRequest(endpoint);
      
      const violations = response.violations || response.data || [];
      return violations.map((violation: any) => ({
        driverId: violation.driver_id || violation.driverId,
        driverName: violation.driver_name || violation.driverName,
        violationType: violation.violation_type || violation.type,
        description: violation.description,
        timestamp: violation.timestamp || violation.occurred_at,
        severity: violation.severity || 'violation'
      }));
    } catch (error) {
      console.error('Failed to get HOS violations:', error);
      throw new Error('Unable to fetch HOS violations from ELD provider.');
    }
  }

  // Provider-specific endpoint mapping
  private getEndpoint(action: string, params?: any): string {
    switch (this.provider.toLowerCase()) {
      case 'samsara':
        return this.getSamsaraEndpoint(action, params);
      case 'omnitracs':
        return this.getOmnitracsEndpoint(action, params);
      case 'geotab':
        return this.getGeotabEndpoint(action, params);
      default:
        return this.getGenericEndpoint(action, params);
    }
  }

  private getSamsaraEndpoint(action: string, params?: any): string {
    switch (action) {
      case 'hos-status':
        return `/fleet/drivers/${params.driverId}/hos-status`;
      case 'hos-logs':
        return `/fleet/drivers/${params.driverId}/hos-logs?start=${params.startDate}&end=${params.endDate}`;
      case 'vehicle-locations':
        return '/fleet/vehicles/locations';
      case 'update-duty-status':
        return '/fleet/drivers/duty-status';
      case 'hos-violations':
        return `/fleet/hos-violations?start=${params.startDate}&end=${params.endDate}`;
      default:
        return `/${action}`;
    }
  }

  private getOmnitracsEndpoint(action: string, params?: any): string {
    switch (action) {
      case 'hos-status':
        return `/drivers/${params.driverId}/hos/status`;
      case 'hos-logs':
        return `/drivers/${params.driverId}/hos/logs?from=${params.startDate}&to=${params.endDate}`;
      case 'vehicle-locations':
        return '/vehicles/locations';
      case 'update-duty-status':
        return '/drivers/duty-status';
      case 'hos-violations':
        return `/hos/violations?from=${params.startDate}&to=${params.endDate}`;
      default:
        return `/${action}`;
    }
  }

  private getGeotabEndpoint(action: string, params?: any): string {
    switch (action) {
      case 'hos-status':
        return `/drivers/${params.driverId}/duty-status`;
      case 'hos-logs':
        return `/drivers/${params.driverId}/duty-status-logs?fromDate=${params.startDate}&toDate=${params.endDate}`;
      case 'vehicle-locations':
        return '/vehicles/status';
      case 'update-duty-status':
        return '/drivers/duty-status';
      case 'hos-violations':
        return `/violations?fromDate=${params.startDate}&toDate=${params.endDate}`;
      default:
        return `/${action}`;
    }
  }

  private getGenericEndpoint(action: string, params?: any): string {
    return `/${action}`;
  }

  // Transform provider-specific responses to our schema
  private transformHOSStatus(response: any, driverId: string): HOSStatus {
    return {
      driverId,
      driverName: response.driver_name || response.name || 'Unknown Driver',
      vehicleId: response.vehicle_id || response.vehicleId,
      currentDutyStatus: this.normalizeDutyStatus(response.current_duty_status || response.dutyStatus),
      timeInCurrentStatus: response.time_in_current_status || response.currentStatusDuration || 0,
      availableDriveTime: response.available_drive_time || response.driveTimeRemaining || 0,
      availableOnDutyTime: response.available_on_duty_time || response.onDutyTimeRemaining || 0,
      cycleHours: response.cycle_hours || response.cycleHoursUsed || 0,
      cycleDaysRemaining: response.cycle_days_remaining || response.cycleDaysRemaining || 0,
      lastStatusChange: response.last_status_change || response.lastStatusChangeTime || new Date().toISOString(),
      violations: response.violations || [],
      nextRequiredBreak: response.next_required_break || response.nextBreakTime,
      location: response.location ? {
        lat: response.location.lat || response.location.latitude,
        lng: response.location.lng || response.location.longitude,
        address: response.location.address
      } : undefined
    };
  }

  private transformHOSLogEntry(log: any, driverId: string): HOSLogEntry {
    return {
      id: log.id || log.log_id || `${driverId}-${Date.now()}`,
      driverId,
      vehicleId: log.vehicle_id || log.vehicleId,
      dutyStatus: this.normalizeDutyStatus(log.duty_status || log.status),
      startTime: log.start_time || log.startTime,
      endTime: log.end_time || log.endTime,
      duration: log.duration || 0,
      location: log.location ? {
        lat: log.location.lat || log.location.latitude,
        lng: log.location.lng || log.location.longitude,
        address: log.location.address
      } : undefined,
      odometer: log.odometer,
      engineHours: log.engine_hours || log.engineHours,
      notes: log.notes || log.comments,
      editedBy: log.edited_by || log.editedBy,
      certified: log.certified || false
    };
  }

  private transformVehicleLocation(location: any): VehicleLocation {
    return {
      vehicleId: location.vehicle_id || location.vehicleId,
      driverId: location.driver_id || location.driverId,
      lat: location.lat || location.latitude,
      lng: location.lng || location.longitude,
      address: location.address,
      speed: location.speed,
      heading: location.heading || location.bearing,
      odometer: location.odometer,
      engineHours: location.engine_hours || location.engineHours,
      fuelLevel: location.fuel_level || location.fuelLevel,
      timestamp: location.timestamp || location.recorded_at || new Date().toISOString(),
      ignitionStatus: location.ignition_status || location.ignitionOn
    };
  }

  private normalizeDutyStatus(status: string): "ON_DUTY" | "OFF_DUTY" | "DRIVING" | "SLEEPER_BERTH" {
    const normalizedStatus = status.toUpperCase().replace(/[-_\s]/g, '_');
    
    if (normalizedStatus.includes('DRIVING') || normalizedStatus.includes('DRIVE')) {
      return 'DRIVING';
    } else if (normalizedStatus.includes('SLEEPER') || normalizedStatus.includes('BERTH')) {
      return 'SLEEPER_BERTH';
    } else if (normalizedStatus.includes('ON_DUTY') || normalizedStatus.includes('ONDUTY')) {
      return 'ON_DUTY';
    } else {
      return 'OFF_DUTY';
    }
  }

  // Test connection to ELD provider
  async testConnection(): Promise<{ connected: boolean; provider: string; error?: string }> {
    if (!this.isConfigured()) {
      return { 
        connected: false, 
        provider: this.provider,
        error: 'ELD API credentials not configured. Please set ELD_API_KEY and ELD_PROVIDER environment variables.'
      };
    }
    
    try {
      const endpoint = this.getEndpoint('health') || '/health';
      await this.makeRequest(endpoint);
      return { connected: true, provider: this.provider };
    } catch (error) {
      return { 
        connected: false, 
        provider: this.provider,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }
}

export const eldService = new ELDService();