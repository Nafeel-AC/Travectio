import { IStorage } from "./storage";

export class DualModeService {
  constructor(private storage: IStorage) {}

  // HOS Data Entry - Auto-detect mode based on truck configuration
  async processHOSEntry(truckId: string, manualData?: any, elogData?: any) {
    const truck = await this.storage.getTruck(truckId);
    if (!truck) throw new Error("Truck not found");

    let hosRecord;

    if (truck.elogsIntegration === 'integrated' && elogData && !manualData) {
      // AUTOMATIC MODE: Process E-logs data
      console.log(`[HOS] Using automatic E-logs data for truck ${truck.name}`);
      
      hosRecord = {
        truckId,
        driverId: truck.currentDriverId,
        dutyStatus: elogData.dutyStatus,
        timestamp: new Date(elogData.timestamp),
        latitude: elogData.location?.latitude,
        longitude: elogData.location?.longitude,
        address: elogData.location?.address || "Auto-detected location",
        driveTimeRemaining: elogData.hoursRemaining?.drive || 0,
        onDutyRemaining: elogData.hoursRemaining?.onDuty || 0,
        cycleHoursRemaining: elogData.hoursRemaining?.cycle || 0,
        annotations: `Auto-imported from ${truck.elogsProvider}`,
        source: 'elogs_api',
        eldDeviceId: truck.eldDeviceId
      };
    } else {
      // MANUAL MODE: Process manual entry
      console.log(`[HOS] Using manual entry for truck ${truck.name}`);
      
      hosRecord = {
        ...manualData,
        truckId,
        source: 'manual_entry',
        timestamp: manualData.timestamp || new Date()
      };
    }

    // Store HOS record (same storage regardless of source)
    const savedRecord = await this.storage.createHOSLog(hosRecord);
    
    // Update truck's compliance status using existing formulas
    await this.updateComplianceMetrics(truckId, savedRecord);
    
    return savedRecord;
  }

  // Load Entry - Auto-detect mode based on truck configuration
  async processLoadEntry(truckId: string, manualData?: any, loadBoardData?: any) {
    const truck = await this.storage.getTruck(truckId);
    if (!truck) throw new Error("Truck not found");

    let loadRecord;

    if (truck.loadBoardIntegration === 'integrated' && loadBoardData && !manualData) {
      // AUTOMATIC MODE: Process Load Board data
      console.log(`[Load] Using automatic load board data for truck ${truck.name}`);
      
      // Calculate miles using existing city-to-city formula
      const calculatedMiles = await this.calculateMilesFromCities(
        loadBoardData.originCity,
        loadBoardData.originState,
        loadBoardData.destinationCity,
        loadBoardData.destinationState
      );

      // Get truck's last location for deadhead calculation
      const lastLocation = await this.storage.getTruckLastKnownLocation(truckId);
      const deadheadMiles = lastLocation 
        ? await this.calculateMilesFromCities(
            lastLocation.city,
            lastLocation.state,
            loadBoardData.originCity,
            loadBoardData.originState
          )
        : 0;

      loadRecord = {
        truckId,
        type: truck.equipmentType,
        pay: loadBoardData.totalPay,
        miles: calculatedMiles,
        
        // Driver pay calculation using existing formulas
        driverPayType: "percentage",
        driverPayPercentage: 70,
        calculatedDriverPay: loadBoardData.totalPay * 0.70,
        
        // Location data from load board
        originCity: loadBoardData.originCity,
        originState: loadBoardData.originState,
        destinationCity: loadBoardData.destinationCity,
        destinationState: loadBoardData.destinationState,
        
        // Deadhead tracking
        deadheadMiles,
        totalMilesWithDeadhead: calculatedMiles + deadheadMiles,
        
        // Load details from API
        commodity: loadBoardData.commodity,
        weight: loadBoardData.weight,
        brokerName: loadBoardData.brokerCompany,
        brokerContact: loadBoardData.brokerContact,
        rateConfirmation: loadBoardData.loadId,
        
        // Dates
        pickupDate: new Date(loadBoardData.pickupDate),
        deliveryDate: new Date(loadBoardData.deliveryDate),
        
        // Calculated fields using existing formulas
        ratePerMile: loadBoardData.totalPay / calculatedMiles,
        
        source: 'load_board_api',
        loadBoardSource: truck.preferredLoadBoard,
        externalId: loadBoardData.loadId
      };
    } else {
      // MANUAL MODE: Process manual entry
      console.log(`[Load] Using manual entry for truck ${truck.name}`);
      
      loadRecord = {
        ...manualData,
        truckId,
        source: 'manual_entry',
        
        // Calculate driver pay using existing formulas
        calculatedDriverPay: this.calculateDriverPay(
          manualData.pay,
          manualData.driverPayType,
          manualData.driverPayPercentage,
          manualData.driverPayFlat,
          manualData.miles
        ),
        
        // Calculate rate per mile
        ratePerMile: manualData.pay / manualData.miles
      };
    }

    // Profitability calculation using existing cost-per-mile formulas
    const truckCostPerMile = await this.getTruckCostPerMile(truckId);
    const profit = (loadRecord.ratePerMile - truckCostPerMile) * loadRecord.miles;
    loadRecord.profit = profit;
    loadRecord.isProfitable = profit > 0 ? 1 : 0;

    // Store load record (same storage regardless of source)
    const savedLoad = await this.storage.createLoad(loadRecord);
    
    // Update truck total miles using existing method
    await this.storage.updateTruckTotalMiles(truckId);
    
    return savedLoad;
  }

  // Helper: Calculate miles using existing city-to-city distance utils
  private async calculateMilesFromCities(
    originCity: string,
    originState: string,
    destinationCity: string,
    destinationState: string
  ): Promise<number> {
    const { calculateDistanceBetweenCities } = await import("../shared/distance-utils");
    return calculateDistanceBetweenCities(originCity, originState, destinationCity, destinationState);
  }

  // Helper: Calculate driver pay using existing formulas
  private calculateDriverPay(
    totalPay: number,
    payType: string,
    percentage: number,
    flatRate: number,
    miles: number
  ): number {
    switch (payType) {
      case 'percentage':
        return totalPay * (percentage / 100);
      case 'per_mile':
        return flatRate * miles;
      case 'flat_rate':
        return flatRate;
      default:
        return totalPay * 0.70; // Default 70%
    }
  }

  // Helper: Get truck cost per mile using existing calculations
  private async getTruckCostPerMile(truckId: string): Promise<number> {
    const latestBreakdown = await this.storage.getLatestTruckCostBreakdown(truckId);
    if (latestBreakdown && latestBreakdown.costPerMile > 0) {
      // Use real weekly data when available for accurate CPM
      return latestBreakdown.costPerMile;
    }
    
    // Fallback to truck's calculated cost per mile using 3,000 mile baseline
    const truck = await this.storage.getTruck(truckId);
    if (truck) {
      // Fixed and variable costs are weekly, divide by 3,000 mile standard
      const standardWeeklyMiles = 3000;
      return (truck.fixedCosts + truck.variableCosts) / standardWeeklyMiles;
    }
    return 0;
  }

  // Helper: Update compliance metrics using existing formulas
  private async updateComplianceMetrics(truckId: string, hosRecord: any) {
    // This would integrate with existing compliance tracking
    console.log(`[Compliance] Updated HOS metrics for truck ${truckId}`);
    
    // Example: Update driver availability status
    if (hosRecord.driveTimeRemaining < 2) {
      console.log(`[Alert] Driver approaching drive time limit: ${hosRecord.driveTimeRemaining}h remaining`);
    }
  }

  // Sync status checker for UI
  async getSyncStatus(truckId: string) {
    const truck = await this.storage.getTruck(truckId);
    if (!truck) return null;

    return {
      elogsStatus: truck.elogsIntegration === 'integrated' 
        ? await this.checkElogsConnection(truckId)
        : 'manual',
      loadBoardStatus: truck.loadBoardIntegration === 'integrated'
        ? await this.checkLoadBoardConnection(truckId)
        : 'manual'
    };
  }

  private async checkElogsConnection(truckId: string): Promise<'connected' | 'disconnected' | 'syncing'> {
    // This would ping the actual E-logs API
    // For now, simulate connection status
    return 'connected';
  }

  private async checkLoadBoardConnection(truckId: string): Promise<'connected' | 'disconnected' | 'syncing'> {
    // This would ping the actual Load Board API
    // For now, simulate connection status
    return 'connected';
  }
}