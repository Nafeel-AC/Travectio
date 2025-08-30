import { z } from 'zod';

// Load Board Provider Configuration Schema
export const LoadBoardConfigSchema = z.object({
  provider: z.enum(['dat', 'truckstop', '123loadboard', 'superdispatch']),
  apiKey: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  baseUrl: z.string(),
  additionalConfig: z.record(z.any()).optional(),
});

export type LoadBoardConfig = z.infer<typeof LoadBoardConfigSchema>;

// Load Schema
export const LoadSchema = z.object({
  id: z.string(),
  originCity: z.string(),
  originState: z.string(),
  destinationCity: z.string(),
  destinationState: z.string(),
  equipmentType: z.string(),
  weight: z.number().optional(),
  length: z.number().optional(),
  rate: z.number(),
  allInRate: z.number().optional(),
  mileage: z.number(),
  ratePerMile: z.number(),
  pickupDate: z.string(),
  deliveryDate: z.string().optional(),
  broker: z.object({
    name: z.string(),
    mcNumber: z.string().optional(),
    rating: z.number().optional(),
    phone: z.string().optional(),
  }),
  loadDetails: z.string().optional(),
  specialRequirements: z.array(z.string()).optional(),
  deadheadMiles: z.number().optional(),
  totalMiles: z.number(),
  provider: z.string(),
  lastUpdated: z.string(),
});

export type Load = z.infer<typeof LoadSchema>;

// Load Search Criteria
export const LoadSearchCriteriaSchema = z.object({
  originRadius: z.number().default(100), // miles from truck's current location
  equipmentTypes: z.array(z.string()),
  minRate: z.number().optional(),
  maxDeadheadMiles: z.number().default(150),
  pickupDateStart: z.string(),
  pickupDateEnd: z.string(),
  destinationStates: z.array(z.string()).optional(),
});

export type LoadSearchCriteria = z.infer<typeof LoadSearchCriteriaSchema>;

// Load Board Provider Interface
export interface LoadBoardProvider {
  validateConnection(config: LoadBoardConfig): Promise<boolean>;
  searchLoads(config: LoadBoardConfig, criteria: LoadSearchCriteria, truckLocation: { latitude: number; longitude: number }): Promise<Load[]>;
  getLoadDetails(config: LoadBoardConfig, loadId: string): Promise<Load>;
  getMarketRates(config: LoadBoardConfig, origin: string, destination: string, equipmentType: string): Promise<{ average: number; high: number; low: number }>;
}

// DAT Load Board Provider
export class DATProvider implements LoadBoardProvider {
  async validateConnection(config: LoadBoardConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.baseUrl}/v2/loads/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: { city: 'Atlanta', state: 'GA' },
          destination: { city: 'Miami', state: 'FL' },
          equipment: 'V',
          maxResults: 1,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('DAT connection validation failed:', error);
      return false;
    }
  }

  async searchLoads(config: LoadBoardConfig, criteria: LoadSearchCriteria, truckLocation: { latitude: number; longitude: number }): Promise<Load[]> {
    const searchPayload = {
      origin: {
        latitude: truckLocation.latitude,
        longitude: truckLocation.longitude,
        radiusMiles: criteria.originRadius,
      },
      equipment: this.mapEquipmentTypes(criteria.equipmentTypes),
      pickupDateStart: criteria.pickupDateStart,
      pickupDateEnd: criteria.pickupDateEnd,
      maxResults: 50,
      ...(criteria.minRate && { minRate: criteria.minRate }),
      ...(criteria.destinationStates && { destinationStates: criteria.destinationStates }),
    };

    const response = await fetch(`${config.baseUrl}/v2/loads/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      throw new Error(`DAT API error: ${response.status}`);
    }

    const data = await response.json();
    return data.loads.map((load: any) => this.transformDATLoad(load));
  }

  async getLoadDetails(config: LoadBoardConfig, loadId: string): Promise<Load> {
    const response = await fetch(`${config.baseUrl}/v2/loads/${loadId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DAT API error: ${response.status}`);
    }

    const load = await response.json();
    return this.transformDATLoad(load);
  }

  async getMarketRates(config: LoadBoardConfig, origin: string, destination: string, equipmentType: string): Promise<{ average: number; high: number; low: number }> {
    const response = await fetch(`${config.baseUrl}/v2/rates/market`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: origin,
        destination: destination,
        equipment: this.mapEquipmentType(equipmentType),
        period: 'LAST_30_DAYS',
      }),
    });

    if (!response.ok) {
      throw new Error(`DAT API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      average: data.averageRate,
      high: data.highRate,
      low: data.lowRate,
    };
  }

  private transformDATLoad(datLoad: any): Load {
    return {
      id: datLoad.loadId,
      originCity: datLoad.origin.city,
      originState: datLoad.origin.state,
      destinationCity: datLoad.destination.city,
      destinationState: datLoad.destination.state,
      equipmentType: this.mapDATEquipment(datLoad.equipment),
      weight: datLoad.weight,
      length: datLoad.length,
      rate: datLoad.rate,
      allInRate: datLoad.allInRate,
      mileage: datLoad.mileage,
      ratePerMile: parseFloat((datLoad.rate / datLoad.mileage).toFixed(2)),
      pickupDate: datLoad.pickupDate,
      deliveryDate: datLoad.deliveryDate,
      broker: {
        name: datLoad.broker.name,
        mcNumber: datLoad.broker.mcNumber,
        rating: datLoad.broker.rating,
        phone: datLoad.broker.phone,
      },
      loadDetails: datLoad.comments,
      specialRequirements: datLoad.specialRequirements || [],
      deadheadMiles: datLoad.deadheadMiles,
      totalMiles: datLoad.mileage + (datLoad.deadheadMiles || 0),
      provider: 'DAT',
      lastUpdated: datLoad.lastUpdated,
    };
  }

  private mapEquipmentTypes(types: string[]): string[] {
    const equipmentMap: Record<string, string> = {
      'Dry Van': 'V',
      'Reefer': 'R',
      'Flatbed': 'F',
      'Step Deck': 'SD',
      'Lowboy': 'LB',
      'Power Only': 'PO',
    };
    return types.map(type => equipmentMap[type] || 'V');
  }

  private mapEquipmentType(type: string): string {
    const equipmentMap: Record<string, string> = {
      'Dry Van': 'V',
      'Reefer': 'R',
      'Flatbed': 'F',
      'Step Deck': 'SD',
      'Lowboy': 'LB',
      'Power Only': 'PO',
    };
    return equipmentMap[type] || 'V';
  }

  private mapDATEquipment(datEquipment: string): string {
    const equipmentMap: Record<string, string> = {
      'V': 'Dry Van',
      'R': 'Reefer',
      'F': 'Flatbed',
      'SD': 'Step Deck',
      'LB': 'Lowboy',
      'PO': 'Power Only',
    };
    return equipmentMap[datEquipment] || 'Dry Van';
  }
}

// Truckstop.com Load Board Provider
export class TruckstopProvider implements LoadBoardProvider {
  async validateConnection(config: LoadBoardConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.baseUrl}/api/loads/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: 'Atlanta, GA',
          destination: 'Miami, FL',
          equipmentType: 'Van',
          maxResults: 1,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Truckstop connection validation failed:', error);
      return false;
    }
  }

  async searchLoads(config: LoadBoardConfig, criteria: LoadSearchCriteria, truckLocation: { latitude: number; longitude: number }): Promise<Load[]> {
    const searchPayload = {
      origin: {
        latitude: truckLocation.latitude,
        longitude: truckLocation.longitude,
        radius: criteria.originRadius,
      },
      equipmentType: criteria.equipmentTypes[0] || 'Van',
      pickupDateStart: criteria.pickupDateStart,
      pickupDateEnd: criteria.pickupDateEnd,
      maxResults: 50,
      ...(criteria.minRate && { minRate: criteria.minRate }),
    };

    const response = await fetch(`${config.baseUrl}/api/loads/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      throw new Error(`Truckstop API error: ${response.status}`);
    }

    const data = await response.json();
    return data.loads.map((load: any) => this.transformTruckstopLoad(load));
  }

  async getLoadDetails(config: LoadBoardConfig, loadId: string): Promise<Load> {
    const response = await fetch(`${config.baseUrl}/api/loads/${loadId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Truckstop API error: ${response.status}`);
    }

    const load = await response.json();
    return this.transformTruckstopLoad(load);
  }

  async getMarketRates(config: LoadBoardConfig, origin: string, destination: string, equipmentType: string): Promise<{ average: number; high: number; low: number }> {
    const response = await fetch(`${config.baseUrl}/api/rates/market?origin=${origin}&destination=${destination}&equipment=${equipmentType}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Truckstop API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      average: data.averageRate,
      high: data.highRate,
      low: data.lowRate,
    };
  }

  private transformTruckstopLoad(load: any): Load {
    return {
      id: load.id,
      originCity: load.pickup.city,
      originState: load.pickup.state,
      destinationCity: load.delivery.city,
      destinationState: load.delivery.state,
      equipmentType: load.equipmentType,
      weight: load.weight,
      length: load.length,
      rate: load.rate,
      allInRate: load.allInRate,
      mileage: load.miles,
      ratePerMile: parseFloat((load.rate / load.miles).toFixed(2)),
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      broker: {
        name: load.company.name,
        mcNumber: load.company.mcNumber,
        rating: load.company.rating,
        phone: load.company.phone,
      },
      loadDetails: load.notes,
      specialRequirements: load.requirements || [],
      deadheadMiles: load.deadheadMiles,
      totalMiles: load.miles + (load.deadheadMiles || 0),
      provider: 'Truckstop',
      lastUpdated: load.lastModified,
    };
  }
}

// Load Board Provider Factory
export class LoadBoardProviderFactory {
  static createProvider(providerName: string): LoadBoardProvider {
    switch (providerName.toLowerCase()) {
      case 'dat':
        return new DATProvider();
      case 'truckstop':
        return new TruckstopProvider();
      case '123loadboard':
        // Would implement 123LoadboardProvider
        throw new Error('123Loadboard provider not yet implemented');
      case 'superdispatch':
        // Would implement SuperDispatchProvider
        throw new Error('SuperDispatch provider not yet implemented');
      default:
        throw new Error(`Unknown load board provider: ${providerName}`);
    }
  }

  static getSupportedProviders(): string[] {
    return ['dat', 'truckstop', '123loadboard', 'superdispatch'];
  }

  static getProviderBaseUrls(): Record<string, string> {
    return {
      dat: 'https://power.dat.com',
      truckstop: 'https://api.truckstop.com',
      '123loadboard': 'https://api.123loadboard.com',
      superdispatch: 'https://api.superdispatch.com',
    };
  }
}