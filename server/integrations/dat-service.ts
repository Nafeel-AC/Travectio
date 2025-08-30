import { z } from "zod";

// DAT API Configuration
const DAT_CONFIG = {
  BASE_URL: process.env.DAT_API_BASE_URL || "https://api.dat.com/v1",
  API_KEY: process.env.DAT_API_KEY,
  APP_ID: process.env.DAT_APP_ID,
  USER_ID: process.env.DAT_USER_ID,
  TIMEOUT: 30000
};

// DAT Load Schema
export const DATLoadSchema = z.object({
  loadId: z.string(),
  origin: z.object({
    city: z.string(),
    state: z.string(),
    zip: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional()
  }),
  destination: z.object({
    city: z.string(),
    state: z.string(),
    zip: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional()
  }),
  equipmentType: z.string(),
  length: z.number().optional(),
  weight: z.number().optional(),
  rate: z.number(),
  rateType: z.enum(["flat", "per_mile"]),
  miles: z.number(),
  commodity: z.string().optional(),
  pickupDate: z.string(),
  deliveryDate: z.string().optional(),
  broker: z.object({
    name: z.string(),
    mcNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional()
  }),
  loadDescription: z.string().optional(),
  requirements: z.array(z.string()).optional()
});

export type DATLoad = z.infer<typeof DATLoadSchema>;

// DAT Rate Schema
export const DATRateSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  equipmentType: z.string(),
  averageRate: z.number(),
  highRate: z.number(),
  lowRate: z.number(),
  loadCount: z.number(),
  truckCount: z.number(),
  ratePerMile: z.number(),
  lastUpdated: z.string()
});

export type DATRate = z.infer<typeof DATRateSchema>;

export class DATService {
  private apiKey: string;
  private appId: string;
  private userId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = DAT_CONFIG.API_KEY || '';
    this.appId = DAT_CONFIG.APP_ID || '';
    this.userId = DAT_CONFIG.USER_ID || '';
    this.baseUrl = DAT_CONFIG.BASE_URL;
  }

  private isConfigured(): boolean {
    return !!(this.apiKey && this.appId && this.userId);
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-DAT-App-ID': this.appId,
      'X-DAT-User-ID': this.userId,
      ...options.headers
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DAT_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DAT API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DAT API Request failed:', error);
      throw error;
    }
  }

  // Search for loads based on criteria
  async searchLoads(criteria: {
    origin?: { city: string; state: string; radius?: number };
    destination?: { city: string; state: string; radius?: number };
    equipmentType?: string;
    minRate?: number;
    maxRate?: number;
    pickupDateStart?: string;
    pickupDateEnd?: string;
    limit?: number;
  }): Promise<DATLoad[]> {
    if (!this.isConfigured()) {
      throw new Error("DAT API credentials not configured. Please set DAT_API_KEY, DAT_APP_ID, and DAT_USER_ID environment variables.");
    }
    
    try {
      const params = new URLSearchParams();
      
      if (criteria.origin) {
        params.append('origin_city', criteria.origin.city);
        params.append('origin_state', criteria.origin.state);
        if (criteria.origin.radius) {
          params.append('origin_radius', criteria.origin.radius.toString());
        }
      }
      
      if (criteria.destination) {
        params.append('dest_city', criteria.destination.city);
        params.append('dest_state', criteria.destination.state);
        if (criteria.destination.radius) {
          params.append('dest_radius', criteria.destination.radius.toString());
        }
      }
      
      if (criteria.equipmentType) {
        params.append('equipment_type', criteria.equipmentType);
      }
      
      if (criteria.minRate) {
        params.append('min_rate', criteria.minRate.toString());
      }
      
      if (criteria.maxRate) {
        params.append('max_rate', criteria.maxRate.toString());
      }
      
      if (criteria.pickupDateStart) {
        params.append('pickup_date_start', criteria.pickupDateStart);
      }
      
      if (criteria.pickupDateEnd) {
        params.append('pickup_date_end', criteria.pickupDateEnd);
      }
      
      params.append('limit', (criteria.limit || 50).toString());

      const response = await this.makeRequest(`/loads/search?${params.toString()}`);
      
      // Validate and transform response data
      const loads = response.loads || [];
      return loads.map((load: any) => this.transformDATLoad(load));
    } catch (error) {
      console.error('Failed to search DAT loads:', error);
      throw new Error('Unable to search loads from DAT. Please check your API credentials.');
    }
  }

  // Get market rates for a specific lane
  async getMarketRates(origin: string, destination: string, equipmentType: string): Promise<DATRate> {
    try {
      const params = new URLSearchParams({
        origin,
        destination,
        equipment_type: equipmentType
      });

      const response = await this.makeRequest(`/rates/lane?${params.toString()}`);
      
      return {
        origin,
        destination,
        equipmentType,
        averageRate: response.average_rate || 0,
        highRate: response.high_rate || 0,
        lowRate: response.low_rate || 0,
        loadCount: response.load_count || 0,
        truckCount: response.truck_count || 0,
        ratePerMile: response.rate_per_mile || 0,
        lastUpdated: response.last_updated || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get DAT market rates:', error);
      throw new Error('Unable to fetch market rates from DAT.');
    }
  }

  // Post truck availability to DAT
  async postTruck(truckData: {
    origin: { city: string; state: string };
    destination?: { city: string; state: string };
    equipmentType: string;
    length?: number;
    weight?: number;
    availableDate: string;
    notes?: string;
  }): Promise<{ success: boolean; postId?: string }> {
    try {
      const payload = {
        origin_city: truckData.origin.city,
        origin_state: truckData.origin.state,
        equipment_type: truckData.equipmentType,
        available_date: truckData.availableDate,
        ...(truckData.destination && {
          dest_city: truckData.destination.city,
          dest_state: truckData.destination.state
        }),
        ...(truckData.length && { length: truckData.length }),
        ...(truckData.weight && { weight: truckData.weight }),
        ...(truckData.notes && { notes: truckData.notes })
      };

      const response = await this.makeRequest('/trucks/post', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        postId: response.post_id
      };
    } catch (error) {
      console.error('Failed to post truck to DAT:', error);
      return { success: false };
    }
  }

  // Book a load from DAT
  async bookLoad(loadId: string, truckInfo: {
    driverId: string;
    truckId: string;
    notes?: string;
  }): Promise<{ success: boolean; bookingId?: string }> {
    try {
      const payload = {
        load_id: loadId,
        driver_id: truckInfo.driverId,
        truck_id: truckInfo.truckId,
        notes: truckInfo.notes || ''
      };

      const response = await this.makeRequest('/loads/book', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        bookingId: response.booking_id
      };
    } catch (error) {
      console.error('Failed to book DAT load:', error);
      return { success: false };
    }
  }

  // Transform DAT API response to our schema
  private transformDATLoad(datLoad: any): DATLoad {
    return {
      loadId: datLoad.load_id || datLoad.id,
      origin: {
        city: datLoad.origin_city || datLoad.pickup_city,
        state: datLoad.origin_state || datLoad.pickup_state,
        zip: datLoad.origin_zip || datLoad.pickup_zip,
        lat: datLoad.origin_lat || datLoad.pickup_lat,
        lng: datLoad.origin_lng || datLoad.pickup_lng
      },
      destination: {
        city: datLoad.dest_city || datLoad.delivery_city,
        state: datLoad.dest_state || datLoad.delivery_state,
        zip: datLoad.dest_zip || datLoad.delivery_zip,
        lat: datLoad.dest_lat || datLoad.delivery_lat,
        lng: datLoad.dest_lng || datLoad.delivery_lng
      },
      equipmentType: datLoad.equipment_type || 'Van',
      length: datLoad.length,
      weight: datLoad.weight,
      rate: datLoad.rate || datLoad.line_haul_rate || 0,
      rateType: datLoad.rate_type || 'flat',
      miles: datLoad.miles || datLoad.loaded_miles || 0,
      commodity: datLoad.commodity,
      pickupDate: datLoad.pickup_date || datLoad.available_date,
      deliveryDate: datLoad.delivery_date,
      broker: {
        name: datLoad.broker_name || datLoad.company_name || 'Unknown Broker',
        mcNumber: datLoad.mc_number,
        phone: datLoad.broker_phone || datLoad.contact_phone,
        email: datLoad.broker_email || datLoad.contact_email
      },
      loadDescription: datLoad.load_description || datLoad.comments,
      requirements: datLoad.requirements || []
    };
  }

  // Test connection to DAT API
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { 
        connected: false, 
        error: 'DAT API credentials not configured. Please set DAT_API_KEY, DAT_APP_ID, and DAT_USER_ID environment variables.'
      };
    }
    
    try {
      await this.makeRequest('/health');
      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }
}

export const datService = new DATService();