import { z } from "zod";
import { datService } from "./dat-service";

// Universal Load Schema - standardized across all load boards
export const UniversalLoadSchema = z.object({
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
  requirements: z.array(z.string()).optional(),
  source: z.string() // DAT, Truckstop, 123Loadboard, etc.
});

export type UniversalLoad = z.infer<typeof UniversalLoadSchema>;

// Truckstop.com Service
class TruckstopService {
  private apiKey: string;
  private baseUrl: string = 'https://api.truckstop.com/v2';

  constructor() {
    this.apiKey = process.env.TRUCKSTOP_API_KEY || '';
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  async searchLoads(criteria: any): Promise<UniversalLoad[]> {
    if (!this.isConfigured()) {
      throw new Error("Truckstop API credentials not configured. Please set TRUCKSTOP_API_KEY environment variable.");
    }

    try {
      const params = new URLSearchParams();
      if (criteria.origin) {
        params.append('pickup_city', criteria.origin.city);
        params.append('pickup_state', criteria.origin.state);
      }
      if (criteria.destination) {
        params.append('delivery_city', criteria.destination.city);
        params.append('delivery_state', criteria.destination.state);
      }
      if (criteria.equipmentType) {
        params.append('equipment_type', criteria.equipmentType);
      }

      const response = await fetch(`${this.baseUrl}/loads/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Truckstop API Error: ${response.status}`);
      }

      const data = await response.json();
      return (data.loads || []).map((load: any) => this.transformLoad(load));
    } catch (error) {
      console.error('Truckstop API error:', error);
      throw new Error('Unable to search loads from Truckstop.com');
    }
  }

  private transformLoad(load: any): UniversalLoad {
    return {
      loadId: load.load_id || load.id,
      origin: {
        city: load.pickup_city,
        state: load.pickup_state,
        zip: load.pickup_zip,
        lat: load.pickup_lat,
        lng: load.pickup_lng
      },
      destination: {
        city: load.delivery_city,
        state: load.delivery_state,
        zip: load.delivery_zip,
        lat: load.delivery_lat,
        lng: load.delivery_lng
      },
      equipmentType: load.equipment_type || 'Van',
      length: load.length,
      weight: load.weight,
      rate: load.rate || 0,
      rateType: load.rate_type || 'flat',
      miles: load.miles || 0,
      commodity: load.commodity,
      pickupDate: load.pickup_date,
      deliveryDate: load.delivery_date,
      broker: {
        name: load.broker_name || 'Unknown Broker',
        mcNumber: load.mc_number,
        phone: load.contact_phone,
        email: load.contact_email
      },
      loadDescription: load.comments,
      requirements: load.requirements || [],
      source: 'Truckstop'
    };
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { 
        connected: false, 
        error: 'Truckstop API credentials not configured. Please set TRUCKSTOP_API_KEY environment variable.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return { connected: response.ok };
    } catch {
      return { connected: false, error: 'Unable to connect to Truckstop.com API' };
    }
  }
}

// 123Loadboard Service
class LoadBoard123Service {
  private apiKey: string;
  private baseUrl: string = 'https://api.123loadboard.com/v1';

  constructor() {
    this.apiKey = process.env.LOADBOARD123_API_KEY || '';
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  async searchLoads(criteria: any): Promise<UniversalLoad[]> {
    if (!this.isConfigured()) {
      throw new Error("123Loadboard API credentials not configured. Please set LOADBOARD123_API_KEY environment variable.");
    }

    try {
      const payload = {
        origin: criteria.origin,
        destination: criteria.destination,
        equipment_type: criteria.equipmentType,
        limit: criteria.limit || 50
      };

      const response = await fetch(`${this.baseUrl}/loads/search`, {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`123Loadboard API Error: ${response.status}`);
      }

      const data = await response.json();
      return (data.results || []).map((load: any) => this.transformLoad(load));
    } catch (error) {
      console.error('123Loadboard API error:', error);
      throw new Error('Unable to search loads from 123Loadboard');
    }
  }

  private transformLoad(load: any): UniversalLoad {
    return {
      loadId: load.id,
      origin: {
        city: load.pickup.city,
        state: load.pickup.state,
        zip: load.pickup.zip,
        lat: load.pickup.latitude,
        lng: load.pickup.longitude
      },
      destination: {
        city: load.delivery.city,
        state: load.delivery.state,
        zip: load.delivery.zip,
        lat: load.delivery.latitude,
        lng: load.delivery.longitude
      },
      equipmentType: load.equipment_type,
      length: load.trailer_length,
      weight: load.weight,
      rate: load.rate,
      rateType: 'flat',
      miles: load.distance,
      commodity: load.commodity,
      pickupDate: load.pickup_date,
      deliveryDate: load.delivery_date,
      broker: {
        name: load.company_name,
        mcNumber: load.mc_number,
        phone: load.contact_phone,
        email: load.contact_email
      },
      loadDescription: load.notes,
      requirements: load.special_requirements || [],
      source: '123Loadboard'
    };
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { 
        connected: false, 
        error: '123Loadboard API credentials not configured. Please set LOADBOARD123_API_KEY environment variable.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        headers: { 'Authorization': `ApiKey ${this.apiKey}` }
      });
      return { connected: response.ok };
    } catch {
      return { connected: false, error: 'Unable to connect to 123Loadboard API' };
    }
  }
}

// Super Dispatch Service
class SuperDispatchService {
  private apiKey: string;
  private baseUrl: string = 'https://api.superdispatch.com/v1';

  constructor() {
    this.apiKey = process.env.SUPERDISPATCH_API_KEY || '';
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  async searchLoads(criteria: any): Promise<UniversalLoad[]> {
    if (!this.isConfigured()) {
      throw new Error("Super Dispatch API credentials not configured. Please set SUPERDISPATCH_API_KEY environment variable.");
    }

    try {
      const queryParams = new URLSearchParams();
      if (criteria.origin) {
        queryParams.append('pickup_city', criteria.origin.city);
        queryParams.append('pickup_state', criteria.origin.state);
      }
      if (criteria.destination) {
        queryParams.append('delivery_city', criteria.destination.city);
        queryParams.append('delivery_state', criteria.destination.state);
      }

      const response = await fetch(`${this.baseUrl}/loads?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Super Dispatch API Error: ${response.status}`);
      }

      const data = await response.json();
      return (data.data || []).map((load: any) => this.transformLoad(load));
    } catch (error) {
      console.error('Super Dispatch API error:', error);
      throw new Error('Unable to search loads from Super Dispatch');
    }
  }

  private transformLoad(load: any): UniversalLoad {
    return {
      loadId: load.id,
      origin: {
        city: load.pickup_location.city,
        state: load.pickup_location.state,
        zip: load.pickup_location.zip,
        lat: load.pickup_location.lat,
        lng: load.pickup_location.lng
      },
      destination: {
        city: load.delivery_location.city,
        state: load.delivery_location.state,
        zip: load.delivery_location.zip,
        lat: load.delivery_location.lat,
        lng: load.delivery_location.lng
      },
      equipmentType: load.vehicle_type,
      weight: load.total_weight,
      rate: load.price,
      rateType: 'flat',
      miles: load.total_distance,
      commodity: load.cargo_type,
      pickupDate: load.pickup_date,
      deliveryDate: load.delivery_date,
      broker: {
        name: load.shipper_name,
        phone: load.shipper_phone,
        email: load.shipper_email
      },
      loadDescription: load.notes,
      requirements: [],
      source: 'SuperDispatch'
    };
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { 
        connected: false, 
        error: 'Super Dispatch API credentials not configured. Please set SUPERDISPATCH_API_KEY environment variable.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return { connected: response.ok };
    } catch {
      return { connected: false, error: 'Unable to connect to Super Dispatch API' };
    }
  }
}

// Main Load Board Integration Service
export class LoadBoardService {
  private datService = datService;
  private truckstopService = new TruckstopService();
  private loadboard123Service = new LoadBoard123Service();
  private superDispatchService = new SuperDispatchService();

  // Search loads across all configured load boards
  async searchLoads(criteria: {
    origin?: { city: string; state: string; radius?: number };
    destination?: { city: string; state: string; radius?: number };
    equipmentType?: string;
    minRate?: number;
    maxRate?: number;
    pickupDateStart?: string;
    pickupDateEnd?: string;
    limit?: number;
    loadBoards?: string[]; // specific load boards to search
  }): Promise<UniversalLoad[]> {
    const loadBoards = criteria.loadBoards || ['DAT', 'Truckstop', '123Loadboard', 'SuperDispatch'];
    const allLoads: UniversalLoad[] = [];

    // Search each load board in parallel
    const searchPromises = loadBoards.map(async (board) => {
      try {
        switch (board) {
          case 'DAT':
            const datLoads = await this.datService.searchLoads(criteria);
            return datLoads.map(load => ({ ...load, source: 'DAT' }));
          case 'Truckstop':
            return await this.truckstopService.searchLoads(criteria);
          case '123Loadboard':
            return await this.loadboard123Service.searchLoads(criteria);
          case 'SuperDispatch':
            return await this.superDispatchService.searchLoads(criteria);
          default:
            return [];
        }
      } catch (error) {
        console.error(`Error searching ${board}:`, error);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    results.forEach(loads => allLoads.push(...loads));

    // Sort by rate (highest first) and apply limit
    const sortedLoads = allLoads.sort((a, b) => b.rate - a.rate);
    return criteria.limit ? sortedLoads.slice(0, criteria.limit) : sortedLoads;
  }

  // Get loads for specific user's preferred load board
  async getLoadsForTruck(truckId: string, userId: string): Promise<UniversalLoad[]> {
    // This would typically get truck details to determine preferred load board
    // For now, return loads from all boards
    return await this.searchLoads({
      limit: 20,
      equipmentType: 'Van' // This would come from truck details
    });
  }

  // Test all load board connections
  async testAllConnections(): Promise<Record<string, { connected: boolean; error?: string }>> {
    const [dat, truckstop, loadboard123, superDispatch] = await Promise.all([
      this.datService.testConnection(),
      this.truckstopService.testConnection(),
      this.loadboard123Service.testConnection(),
      this.superDispatchService.testConnection()
    ]);

    return {
      DAT: dat,
      Truckstop: truckstop,
      '123Loadboard': loadboard123,
      SuperDispatch: superDispatch
    };
  }

  // Get market rates across all load boards
  async getMarketRates(origin: string, destination: string, equipmentType: string): Promise<{
    board: string;
    averageRate: number;
    highRate: number;
    lowRate: number;
    ratePerMile: number;
  }[]> {
    const rates = [];

    try {
      const datRate = await this.datService.getMarketRates(origin, destination, equipmentType);
      rates.push({
        board: 'DAT',
        averageRate: datRate.averageRate,
        highRate: datRate.highRate,
        lowRate: datRate.lowRate,
        ratePerMile: datRate.ratePerMile
      });
    } catch (error) {
      console.error('Error getting DAT market rates:', error);
    }

    // Add other load board market rates here when APIs support it

    return rates;
  }
}

export const loadBoardService = new LoadBoardService();