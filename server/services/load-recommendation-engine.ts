export interface LoadRecommendationRequest {
  userId: string;
  truckId: string;
  driverHours: {
    driveTimeRemaining: number;
    onDutyRemaining: number;
  };
  currentLocation?: {
    city: string;
    state: string;
  };
  fleetData: {
    avgCostPerMile: number;
    equipmentType: string;
    preferredRoutes?: string[];
    historicalPerformance?: any;
  };
  availableLoads: any[];
  marketConditions?: {
    fuelPrice: number;
    seasonality: string;
    marketDemand: 'high' | 'medium' | 'low';
  };
}

export interface LoadRecommendation {
  loadId: string;
  score: number;
  profitPotential: number;
  riskAssessment: 'low' | 'medium' | 'high';
  recommendations: {
    reasons: string[];
    warnings: string[];
    optimizations: string[];
  };
  marketAnalysis: {
    rateCompetitiveness: number;
    demandForecast: string;
    seasonalFactors: string[];
  };
  routeOptimization: {
    suggestedRoute: string;
    estimatedFuelCost: number;
    deadheadOptimization: string;
  };
  timeCompatibility: {
    estimatedDriveTime: number;
    bufferTime: number;
    compatible: boolean;
  };
}

export class LoadRecommendationEngine {
  
  // Enhanced recommendation algorithm with multiple scoring factors
  generateRecommendations(request: LoadRecommendationRequest): LoadRecommendation[] {
    const { fleetData, driverHours, availableLoads, marketConditions } = request;
    
    return availableLoads
      .filter(load => load.status === "available")
      .filter(load => this.isEquipmentCompatible(load.equipmentType, fleetData.equipmentType))
      .map(load => this.analyzeLoad(load, request))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 recommendations
  }

  private isEquipmentCompatible(loadEquipment: string, truckEquipment: string): boolean {
    // Dry van trucks can handle most loads, reefer and flatbed are specialized
    if (truckEquipment === "Dry Van") {
      return loadEquipment === "Dry Van" || loadEquipment === "Van";
    }
    return loadEquipment === truckEquipment;
  }

  private analyzeLoad(load: any, request: LoadRecommendationRequest): LoadRecommendation {
    const { fleetData, driverHours, marketConditions } = request;
    
    // Calculate basic financial metrics
    const grossRevenue = load.rate || 0;
    const miles = load.miles || 0;
    const estimatedCost = miles * fleetData.avgCostPerMile;
    const netProfit = grossRevenue - estimatedCost;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const ratePerMile = miles > 0 ? grossRevenue / miles : 0;
    
    // Time analysis
    const estimatedDriveTime = miles / 55; // Assuming 55 mph average
    const loadingUnloadingTime = 2; // 2 hours for loading/unloading
    const totalTimeRequired = estimatedDriveTime + loadingUnloadingTime;
    const timeCompatible = totalTimeRequired <= driverHours.onDutyRemaining;
    const driveTimeCompatible = estimatedDriveTime <= driverHours.driveTimeRemaining;
    const bufferTime = driverHours.onDutyRemaining - totalTimeRequired;

    // Calculate comprehensive score
    let score = 0;
    const reasons = [];
    const warnings = [];
    const optimizations = [];

    // Profitability Score (40% weight)
    const profitScore = this.calculateProfitScore(ratePerMile, profitMargin);
    score += profitScore * 0.4;
    if (profitScore >= 80) reasons.push(`Excellent rate: $${ratePerMile.toFixed(2)}/mile`);
    if (profitMargin > 25) reasons.push(`High profit margin: ${profitMargin.toFixed(1)}%`);
    if (profitMargin < 10) warnings.push("Low profit margin - consider negotiating");

    // Time Compatibility Score (25% weight)
    const timeScore = this.calculateTimeScore(timeCompatible, driveTimeCompatible, bufferTime);
    score += timeScore * 0.25;
    if (timeCompatible && driveTimeCompatible) {
      reasons.push("Compatible with current HOS");
      if (bufferTime > 3) reasons.push("Comfortable time buffer available");
    } else {
      warnings.push("HOS constraints - check timing carefully");
    }

    // Distance Efficiency Score (20% weight)
    const distanceScore = this.calculateDistanceScore(miles);
    score += distanceScore * 0.2;
    if (miles >= 300 && miles <= 600) reasons.push("Optimal distance range");
    if (miles < 200) optimizations.push("Consider combining with short backhaul");
    if (miles > 800) warnings.push("Long haul - monitor driver fatigue");

    // Load Board Reliability Score (10% weight)
    const reliabilityScore = this.calculateReliabilityScore(load.loadBoardSource);
    score += reliabilityScore * 0.1;

    // Market Conditions Score (5% weight)
    const marketScore = this.calculateMarketScore(load, marketConditions);
    score += marketScore * 0.05;

    // Route and fuel optimization
    const estimatedFuelCost = this.calculateFuelCost(miles, marketConditions?.fuelPrice || 3.50);
    
    // Add general optimizations
    optimizations.push("Plan fuel stops for cost savings");
    if (miles > 500) optimizations.push("Consider rest stop locations for HOS compliance");
    optimizations.push("Monitor weather conditions along route");

    // Risk assessment
    let riskAssessment: 'low' | 'medium' | 'high' = 'low';
    if (profitMargin < 5 || !timeCompatible) riskAssessment = 'high';
    else if (profitMargin < 15 || bufferTime < 1) riskAssessment = 'medium';

    // Market analysis
    const rateCompetitiveness = this.assessRateCompetitiveness(ratePerMile, load.equipmentType);
    
    return {
      loadId: load.id,
      score: Math.round(score),
      profitPotential: profitMargin,
      riskAssessment,
      recommendations: {
        reasons,
        warnings,
        optimizations
      },
      marketAnalysis: {
        rateCompetitiveness,
        demandForecast: this.generateDemandForecast(load, marketConditions),
        seasonalFactors: this.getSeasonalFactors(marketConditions?.seasonality || 'standard')
      },
      routeOptimization: {
        suggestedRoute: `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`,
        estimatedFuelCost,
        deadheadOptimization: "Plan return load to minimize deadhead miles"
      },
      timeCompatibility: {
        estimatedDriveTime,
        bufferTime: Math.max(0, bufferTime),
        compatible: timeCompatible && driveTimeCompatible
      }
    };
  }

  private calculateProfitScore(ratePerMile: number, profitMargin: number): number {
    let score = 0;
    
    // Rate per mile scoring
    if (ratePerMile >= 3.0) score += 50;
    else if (ratePerMile >= 2.5) score += 40;
    else if (ratePerMile >= 2.0) score += 30;
    else if (ratePerMile >= 1.5) score += 20;
    else score += 10;
    
    // Profit margin scoring
    if (profitMargin >= 25) score += 50;
    else if (profitMargin >= 20) score += 40;
    else if (profitMargin >= 15) score += 30;
    else if (profitMargin >= 10) score += 20;
    else if (profitMargin >= 5) score += 10;
    
    return Math.min(100, score);
  }

  private calculateTimeScore(timeCompatible: boolean, driveTimeCompatible: boolean, bufferTime: number): number {
    if (!timeCompatible || !driveTimeCompatible) return 0;
    
    if (bufferTime >= 4) return 100;
    if (bufferTime >= 2) return 80;
    if (bufferTime >= 1) return 60;
    if (bufferTime >= 0.5) return 40;
    return 20;
  }

  private calculateDistanceScore(miles: number): number {
    // Optimal range is 300-600 miles
    if (miles >= 300 && miles <= 600) return 100;
    if (miles >= 200 && miles <= 800) return 80;
    if (miles >= 100 && miles <= 1000) return 60;
    if (miles >= 50 && miles <= 1200) return 40;
    return 20;
  }

  private calculateReliabilityScore(loadBoardSource: string): number {
    const reliabilityMap: { [key: string]: number } = {
      "DAT": 100,
      "Truckstop": 90,
      "123Loadboard": 80,
      "SuperDispatch": 75,
      "Manual": 70
    };
    return reliabilityMap[loadBoardSource] || 60;
  }

  private calculateMarketScore(load: any, marketConditions?: LoadRecommendationRequest['marketConditions']): number {
    if (!marketConditions) return 50;
    
    let score = 50;
    
    // Market demand factor
    if (marketConditions.marketDemand === 'high') score += 30;
    else if (marketConditions.marketDemand === 'medium') score += 15;
    
    // Fuel price consideration (lower fuel prices = higher score)
    if (marketConditions.fuelPrice < 3.0) score += 20;
    else if (marketConditions.fuelPrice < 3.5) score += 10;
    else if (marketConditions.fuelPrice > 4.0) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateFuelCost(miles: number, fuelPrice: number): number {
    const mpg = 6.5; // Average truck MPG
    return (miles / mpg) * fuelPrice;
  }

  private assessRateCompetitiveness(ratePerMile: number, equipmentType: string): number {
    // Equipment-specific rate benchmarks
    const benchmarks: { [key: string]: number } = {
      "Dry Van": 2.0,
      "Reefer": 2.5,
      "Flatbed": 2.3,
      "Van": 2.0
    };
    
    const benchmark = benchmarks[equipmentType] || 2.0;
    const competitiveness = (ratePerMile / benchmark) * 100;
    return Math.min(100, Math.max(0, competitiveness));
  }

  private generateDemandForecast(load: any, marketConditions?: LoadRecommendationRequest['marketConditions']): string {
    const baseFactors = ["Current market analysis", "Historical data patterns"];
    
    if (marketConditions?.marketDemand === 'high') {
      return "High demand expected - rates likely to remain strong";
    } else if (marketConditions?.marketDemand === 'low') {
      return "Soft demand - consider flexible pricing strategies";
    }
    
    return "Stable demand forecasted based on current trends";
  }

  private getSeasonalFactors(seasonality: string): string[] {
    const factors: { [key: string]: string[] } = {
      'spring': ["Produce season beginning", "Construction activity increasing"],
      'summer': ["Peak shipping season", "Vacation impact on drivers"],
      'fall': ["Harvest season", "Holiday preparation shipping"],
      'winter': ["Weather delays possible", "Holiday shipping premium"],
      'standard': ["Normal seasonal patterns apply"]
    };
    
    return factors[seasonality] || factors['standard'];
  }

  // Generate forward-leg recommendations for multi-stop optimization
  generateForwardLegRecommendations(
    completedLoad: any, 
    request: LoadRecommendationRequest
  ): LoadRecommendation[] {
    const updatedRequest = {
      ...request,
      currentLocation: {
        city: completedLoad.destinationCity,
        state: completedLoad.destinationState
      },
      driverHours: {
        driveTimeRemaining: Math.max(0, request.driverHours.driveTimeRemaining - (completedLoad.miles / 55)),
        onDutyRemaining: Math.max(0, request.driverHours.onDutyRemaining - ((completedLoad.miles / 55) + 2))
      }
    };

    // Filter loads that originate near the completed load's destination
    const nearbyLoads = request.availableLoads.filter(load => 
      load.id !== completedLoad.id &&
      this.isLocationNearby(
        { city: load.originCity, state: load.originState },
        { city: completedLoad.destinationCity, state: completedLoad.destinationState },
        100 // 100 mile radius
      )
    );

    return this.generateRecommendations({
      ...updatedRequest,
      availableLoads: nearbyLoads
    });
  }

  private isLocationNearby(
    location1: { city: string; state: string },
    location2: { city: string; state: string },
    radiusMiles: number
  ): boolean {
    // Simple state-based proximity check
    // In production, this would use actual GPS coordinates
    return location1.state === location2.state;
  }

  // Get market insights and trends
  generateMarketInsights(request: LoadRecommendationRequest): any {
    const { availableLoads, fleetData, marketConditions } = request;
    
    const ratesAnalysis = this.analyzeRates(availableLoads, fleetData.equipmentType);
    const demandAnalysis = this.analyzeDemand(availableLoads);
    
    return {
      overallTrends: this.summarizeTrends(ratesAnalysis, demandAnalysis),
      rateForecasts: this.generateRateForecast(ratesAnalysis, marketConditions),
      recommendedStrategy: this.generateStrategy(ratesAnalysis, demandAnalysis, fleetData),
      seasonalFactors: this.getSeasonalFactors(marketConditions?.seasonality || 'standard'),
      emergingOpportunities: this.identifyOpportunities(availableLoads, fleetData)
    };
  }

  private analyzeRates(loads: any[], equipmentType: string) {
    const relevantLoads = loads.filter(load => 
      this.isEquipmentCompatible(load.equipmentType, equipmentType)
    );
    
    const rates = relevantLoads.map(load => load.ratePerMile || 0);
    const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length || 0;
    const maxRate = Math.max(...rates, 0);
    const minRate = Math.min(...rates.filter(r => r > 0), 0);
    
    return { avgRate, maxRate, minRate, totalLoads: relevantLoads.length };
  }

  private analyzeDemand(loads: any[]) {
    return {
      totalAvailable: loads.length,
      byEquipmentType: loads.reduce((acc, load) => {
        acc[load.equipmentType] = (acc[load.equipmentType] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    };
  }

  private summarizeTrends(ratesAnalysis: any, demandAnalysis: any): string {
    if (ratesAnalysis.avgRate > 2.5) {
      return "Strong market with premium rates available";
    } else if (ratesAnalysis.avgRate > 2.0) {
      return "Stable market with decent opportunities";
    } else {
      return "Soft market - focus on operational efficiency";
    }
  }

  private generateRateForecast(ratesAnalysis: any, marketConditions?: LoadRecommendationRequest['marketConditions']): string {
    const trend = marketConditions?.marketDemand === 'high' ? 'increasing' : 
                  marketConditions?.marketDemand === 'low' ? 'decreasing' : 'stable';
    
    return `Rates trending ${trend} - average $${ratesAnalysis.avgRate.toFixed(2)}/mile`;
  }

  private generateStrategy(ratesAnalysis: any, demandAnalysis: any, fleetData: any): string {
    if (ratesAnalysis.avgRate > fleetData.avgCostPerMile * 1.5) {
      return "Take advantage of strong rates - prioritize high-paying loads";
    } else {
      return "Focus on operational efficiency and preferred lanes";
    }
  }

  private identifyOpportunities(loads: any[], fleetData: any): string[] {
    const opportunities = [];
    
    const highRateLoads = loads.filter(load => load.ratePerMile > 2.5).length;
    if (highRateLoads > 0) {
      opportunities.push(`${highRateLoads} premium rate loads available`);
    }
    
    const shortHauls = loads.filter(load => load.miles < 300).length;
    if (shortHauls > 5) {
      opportunities.push("Multiple short hauls available for quick turnaround");
    }
    
    return opportunities;
  }
}

// Export singleton instance
export const loadRecommendationEngine = new LoadRecommendationEngine();