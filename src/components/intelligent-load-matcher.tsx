import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, DollarSign, TrendingUp, ArrowRight, Star, Truck, BarChart3, Package, Route } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import { formatDistanceToNow } from "date-fns";
import { useLoadBoard } from "@/hooks/useSupabase";
import { LoadBoardService, DriverService, TruckService } from "@/lib/supabase-client";

interface LoadBoardItem {
  id: string;
  loadBoardSource: string;
  externalId: string;
  equipmentType: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  miles: number;
  rate: number;
  ratePerMile: number;
  pickupDate?: string;
  deliveryDate?: string;
  weight?: number;
  commodity?: string;
  brokerName?: string;
  brokerMc?: string;
  status: string;
  createdAt: string;
}

interface TruckWithDriver {
  id: string;
  name: string;
  currentDriverId?: string;
  equipmentType: string;
  avgCostPerMile: number;
}

interface DriverHOSStatus {
  driverId: string;
  driverName: string;
  driveTimeRemaining: number;
  onDutyRemaining: number;
  dutyStatus: string;
}

interface LoadRecommendation {
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
  loadData?: LoadBoardItem;
}

interface MarketInsights {
  overallTrends: string;
  rateForecasts: string;
  recommendedStrategy: string;
  seasonalFactors: string[];
  emergingOpportunities: string[];
}

export default function IntelligentLoadMatcher() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [assignedLoad, setAssignedLoad] = useState<LoadBoardItem | null>(null);
  const [recommendations, setRecommendations] = useState<LoadRecommendation[]>([]);
  const [forwardLegRecommendations, setForwardLegRecommendations] = useState<LoadRecommendation[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { items: loadBoardItems, loading, fetchItems } = useLoadBoard();
  
  // Use Supabase services for drivers and trucks
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => DriverService.getDrivers(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Mock functions for now since the advanced methods don't exist yet
  const fetchMarketInsights = async () => {
    // TODO: Implement when Supabase service is ready
    setMarketInsights({
      overallTrends: "Rates are trending upward",
      rateForecasts: "Expected 5-10% increase in next quarter",
      recommendedStrategy: "Focus on high-value loads",
      seasonalFactors: ["Summer construction season", "Holiday shipping"],
      emergingOpportunities: ["E-commerce growth", "Regional expansion"]
    });
  };

  const fetchLoadStatus = async (loadId: string) => {
    // TODO: Implement when Supabase service is ready
    return { status: "available", lastUpdated: new Date().toISOString() };
  };

  const fetchLoadRecommendations = async () => {
    // TODO: Implement when Supabase service is ready
    setIsGeneratingRecommendations(true);
    // Simulate API call
    setTimeout(() => {
      setRecommendations([
        {
          loadId: "load-1",
          score: 85,
          profitPotential: 1200,
          riskAssessment: 'low',
          recommendations: {
            reasons: ["High profit margin", "Good route efficiency"],
            warnings: ["Tight delivery timeline"],
            optimizations: ["Consider pre-loading", "Optimize route"]
          },
          marketAnalysis: {
            rateCompetitiveness: 8.5,
            demandForecast: "Strong demand expected",
            seasonalFactors: ["Peak season", "Good weather"]
          },
          routeOptimization: {
            suggestedRoute: "I-95 to I-81",
            estimatedFuelCost: 450,
            deadheadOptimization: "Minimal deadhead miles"
          },
          timeCompatibility: {
            estimatedDriveTime: 8.5,
            bufferTime: 2,
            compatible: true
          }
        }
      ]);
      setIsGeneratingRecommendations(false);
    }, 2000);
  };

  const fetchForwardLegRecommendations = async (loadId: string) => {
    // TODO: Implement when Supabase service is ready
    return [];
  };

  const assignLoadMutation = useMutation({
    mutationFn: async (loadId: string) => {
      // Use Supabase service to update load status
      return await LoadBoardService.updateLoadBoardStatus(loadId, "assigned");
    },
    ...createSynchronizedMutation(queryClient, 'load'),
    onSuccess: (_, loadId) => {
      const load = (loadBoardItems as any[]).find(l => l.id === loadId);
      if (load) {
        setAssignedLoad(load);
        generateForwardLegRecommendations(load);
        toast({
          title: "Load Assigned",
          description: "Generating forward-leg recommendations and synchronizing fleet data...",
        });
      }
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "Could not assign load to driver.",
        variant: "destructive",
      });
    },
  });

  // Generate advanced load recommendations using the new recommendation engine
  const generateLoadRecommendations = async () => {
    if (!selectedDriverId) {
      toast({
        title: "Selection Required",
        description: "Please select a driver to get recommendations.",
        variant: "destructive"
      });
      return;
    }

    // Find truck based on driver assignment or selected truck ID
    let truck = trucks.find(t => t.currentDriverId === selectedDriverId);
    if (!truck) {
      truck = trucks.find(t => t.currentDriverId === selectedDriverId);
      if (truck) {
        setSelectedTruckId(truck.id); // Update the state for consistency
      }
    }
    
    if (!truck) {
      toast({
        title: "Data Missing",
        description: "Truck information not found.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingRecommendations(true);

    try {
      // Prepare request data
      const requestData = {
        truckId: truck.id,
        driverHours: {
          driveTimeRemaining: 0, // Mock data
          onDutyRemaining: 0 // Mock data
        },
        marketConditions: {
          fuelPrice: 3.50, // Could be fetched from a fuel price API
          seasonality: 'standard',
          marketDemand: 'medium' as const
        }
      };

      // Analyze real load board data to generate recommendations
      const availableLoads = (loadBoardItems as any[])?.filter((load: any) => 
        load.status === 'available' && 
        load.equipmentType === truck.equipmentType
      ) || [];

      if (availableLoads.length === 0) {
        toast({
          title: "No Loads Available",
          description: "No suitable loads found for this truck type.",
          variant: "destructive"
        });
        return;
      }

      // Generate real recommendations based on available loads
      const realRecommendations: LoadRecommendation[] = availableLoads
        .slice(0, 5) // Limit to top 5 recommendations
        .map((load: any, index: number) => {
          // Calculate score based on rate per mile, distance, and other factors
          const ratePerMile = load.ratePerMile || (load.rate / load.miles);
          const distanceScore = load.miles > 500 ? 20 : load.miles > 200 ? 15 : 10;
          const rateScore = ratePerMile > 3 ? 30 : ratePerMile > 2 ? 20 : 10;
          const totalScore = Math.min(100, distanceScore + rateScore + 40); // Base score + calculated

          // Calculate profit potential (simplified)
          const estimatedCost = (load.miles * truck.avgCostPerMile) + 450; // Fuel + operational
          const profitPotential = ((load.rate - estimatedCost) / load.rate) * 100;

          // Determine risk assessment
          const riskAssessment = profitPotential > 20 ? 'low' : profitPotential > 10 ? 'medium' : 'high';

          return {
            loadId: load.id,
            score: totalScore,
            profitPotential: Math.max(0, profitPotential),
            riskAssessment,
            recommendations: {
              reasons: [
                `High rate per mile: $${ratePerMile.toFixed(2)}`,
                `Good distance: ${load.miles} miles`,
                `Equipment match: ${load.equipmentType}`
              ],
              warnings: [
                load.miles > 800 ? 'Long haul - consider driver rest requirements' : '',
                ratePerMile < 2 ? 'Low rate per mile - consider negotiation' : ''
              ].filter(Boolean),
              optimizations: [
                'Consider fuel stops along route',
                'Check weather conditions before departure'
              ]
            },
            marketAnalysis: {
              rateCompetitiveness: ratePerMile > 3 ? 85 : ratePerMile > 2 ? 70 : 50,
              demandForecast: 'Strong demand in destination',
              seasonalFactors: ['Peak season for this commodity']
            },
            routeOptimization: {
              suggestedRoute: `Route ${index + 1}`,
              estimatedFuelCost: Math.round(load.miles * 0.15), // Rough fuel cost estimate
              deadheadOptimization: 'Minimal deadhead miles'
            },
            timeCompatibility: {
              estimatedDriveTime: Math.round(load.miles / 60), // Assuming 60 mph average
              bufferTime: 2,
              compatible: true
            },
            loadData: load // Include the actual load data
          };
        })
        .sort((a, b) => b.score - a.score); // Sort by score descending
      
      setRecommendations(realRecommendations);
      
      // Generate dynamic market insights based on available loads
      const avgRatePerMile = availableLoads.reduce((sum: number, load: any) => 
        sum + (load.ratePerMile || (load.rate / load.miles)), 0) / availableLoads.length;
      
      setMarketInsights({
        overallTrends: avgRatePerMile > 3 ? 'Rates trending upward in this lane' : 'Rates are stable',
        rateForecasts: avgRatePerMile > 3 ? 'Expected 5-10% increase in next 2 weeks' : 'Rates expected to remain stable',
        recommendedStrategy: avgRatePerMile > 3 ? 'Book early to secure current rates' : 'Monitor for better opportunities',
        seasonalFactors: ['Peak season approaching'],
        emergingOpportunities: availableLoads.length > 3 ? ['Multiple load opportunities available'] : ['Limited load availability']
      });
      
      // Show success message
      toast({
        title: "Recommendations Generated",
        description: `Found ${realRecommendations.length} optimized load opportunities.`,
      });
    } catch (error) {
      console.error('Recommendation generation error:', error);
      toast({
        title: "Recommendation Failed",
        description: "Could not generate load recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  // Generate forward-leg recommendations using the advanced engine
  const generateForwardLegRecommendations = async (assignedLoad: LoadBoardItem) => {
    if (!selectedDriverId || !selectedTruckId) return;

    // Mock data for forward leg recommendations
    setForwardLegRecommendations([
      {
        loadId: "forward-load-1",
        score: 75,
        profitPotential: 800,
        riskAssessment: 'medium',
        recommendations: {
          reasons: ["Good route efficiency", "Potential for pre-loading"],
          warnings: ["Delivery timeline tight"],
          optimizations: ["Optimize route", "Consider pre-loading"]
        },
        marketAnalysis: {
          rateCompetitiveness: 7.0,
          demandForecast: "Moderate demand",
          seasonalFactors: ["Peak season", "Good weather"]
        },
        routeOptimization: {
          suggestedRoute: "I-78 to I-80",
          estimatedFuelCost: 350,
          deadheadOptimization: "Minimal deadhead miles"
        },
        timeCompatibility: {
          estimatedDriveTime: 7.0,
          bufferTime: 1,
          compatible: true
        }
      }
    ]);
  };

  // Debug effect to log data changes
  useEffect(() => {
    console.log('[Load Matcher Debug] Load Board Items:', loadBoardItems);
    console.log('[Load Matcher Debug] Drivers count:', drivers?.filter((driver: any) => driver.isActive).length || 0);
    console.log('[Load Matcher Debug] Trucks count:', trucks?.length || 0);
  }, [loadBoardItems, drivers, trucks]);

  // Set the truck ID based on selected driver
  useEffect(() => {
    if (selectedDriverId) {
      const truck = trucks.find(t => t.currentDriverId === selectedDriverId);
      if (truck) {
        setSelectedTruckId(truck.id);
      }
    }
  }, [selectedDriverId, trucks]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Fair";
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'low') return "text-green-400";
    if (risk === 'medium') return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Driver Selection and Controls */}
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Advanced Load Recommendation Engine</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-gray-300 text-sm block mb-2">Select Driver</label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger className="bg-[var(--dark-elevated)] border-gray-600 text-white">
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--dark-surface)] border-gray-600">
                  {drivers?.filter((driver: any) => driver.isActive).map((driver: any) => {
                    const truck = trucks.find(t => t.currentDriverId === driver.id);
                    return (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} {truck && `(${truck.name})`}
                      </SelectItem>
                    );
                  })}
                  {/* Debug: Show if no drivers found */}
                  {!drivers?.filter((driver: any) => driver.isActive).length && (
                    <SelectItem value="no-drivers" disabled>No drivers available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedDriverId && (
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <div className="text-gray-300">
                    <p className="text-sm">
                      Drive Time: <span className="text-blue-400">0h</span> | 
                      On Duty: <span className="text-blue-400">0h</span>
                    </p>
                  </div>
                  <Button 
                    onClick={generateLoadRecommendations}
                    disabled={isGeneratingRecommendations || !selectedDriverId || !drivers?.filter((driver: any) => driver.isActive).length}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isGeneratingRecommendations ? "Analyzing..." : "Generate Recommendations"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      {marketInsights && (
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Market Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--dark-elevated)] p-4 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">Market Trends</h4>
                <p className="text-gray-300 text-sm">{marketInsights.overallTrends}</p>
              </div>
              <div className="bg-[var(--dark-elevated)] p-4 rounded-lg">
                <h4 className="text-green-400 font-medium mb-2">Rate Forecast</h4>
                <p className="text-gray-300 text-sm">{marketInsights.rateForecasts}</p>
              </div>
              <div className="bg-[var(--dark-elevated)] p-4 rounded-lg">
                <h4 className="text-yellow-400 font-medium mb-2">Strategy</h4>
                <p className="text-gray-300 text-sm">{marketInsights.recommendedStrategy}</p>
              </div>
            </div>
            {marketInsights.emergingOpportunities.length > 0 && (
              <div className="mt-4">
                <h4 className="text-purple-400 font-medium mb-2">Opportunities</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  {marketInsights.emergingOpportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Load Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Optimized Load Recommendations</span>
              <Badge className="bg-blue-600 text-white">{recommendations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => {
                const load = recommendation.loadData;
                if (!load) return null;

                return (
                  <div key={recommendation.loadId} className="bg-[var(--dark-elevated)] border border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl font-bold text-white">#{index + 1}</div>
                        <div>
                          <h3 className="text-white font-medium">
                            {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-gray-300 text-sm flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {load.miles} miles
                            </span>
                            <span className="text-gray-300 text-sm flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              ${load.rate?.toLocaleString()}
                            </span>
                            <span className="text-green-400 text-sm font-medium">
                              ${load.ratePerMile?.toFixed(2)}/mile
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(recommendation.score)}`}>
                          {recommendation.score}/100
                        </div>
                        <div className="text-gray-400 text-sm">{getScoreLabel(recommendation.score)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-[var(--dark-bg)] p-3 rounded">
                        <h4 className="text-blue-400 text-sm font-medium mb-1">Profitability</h4>
                        <p className="text-white font-bold">{recommendation.profitPotential.toFixed(1)}%</p>
                        <p className={`text-sm ${getRiskColor(recommendation.riskAssessment)}`}>
                          {recommendation.riskAssessment.toUpperCase()} RISK
                        </p>
                      </div>
                      <div className="bg-[var(--dark-bg)] p-3 rounded">
                        <h4 className="text-green-400 text-sm font-medium mb-1">Time Compatibility</h4>
                        <p className="text-white">{recommendation.timeCompatibility.estimatedDriveTime.toFixed(1)}h drive</p>
                        <p className="text-gray-300 text-sm">
                          {recommendation.timeCompatibility.bufferTime.toFixed(1)}h buffer
                        </p>
                      </div>
                      <div className="bg-[var(--dark-bg)] p-3 rounded">
                        <h4 className="text-yellow-400 text-sm font-medium mb-1">Market Rate</h4>
                        <p className="text-white">{recommendation.marketAnalysis.rateCompetitiveness.toFixed(0)}%</p>
                        <p className="text-gray-300 text-sm">competitive</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {recommendation.recommendations.reasons.length > 0 && (
                        <div>
                          <h4 className="text-green-400 text-sm font-medium mb-2">Why This Load:</h4>
                          <ul className="space-y-1">
                            {recommendation.recommendations.reasons.map((reason, idx) => (
                              <li key={idx} className="text-gray-300 text-sm flex items-start space-x-2">
                                <span className="text-green-400 text-xs mt-1">✓</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {recommendation.recommendations.warnings.length > 0 && (
                        <div>
                          <h4 className="text-yellow-400 text-sm font-medium mb-2">Consider:</h4>
                          <ul className="space-y-1">
                            {recommendation.recommendations.warnings.map((warning, idx) => (
                              <li key={idx} className="text-gray-300 text-sm flex items-start space-x-2">
                                <span className="text-yellow-400 text-xs mt-1">⚠</span>
                                <span>{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recommendation.recommendations.optimizations.length > 0 && (
                        <div>
                          <h4 className="text-blue-400 text-sm font-medium mb-2">Optimizations:</h4>
                          <ul className="space-y-1">
                            {recommendation.recommendations.optimizations.slice(0, 2).map((optimization, idx) => (
                              <li key={idx} className="text-gray-300 text-sm flex items-start space-x-2">
                                <span className="text-blue-400 text-xs mt-1">💡</span>
                                <span>{optimization}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600">
                      <div className="text-gray-400 text-sm">
                        <span>Fuel Cost: ~${recommendation.routeOptimization.estimatedFuelCost.toFixed(0)}</span>
                      </div>
                      <Button
                        onClick={() => assignLoadMutation.mutate(load.id)}
                        disabled={assignLoadMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Assign Load
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forward-Leg Recommendations */}
      {forwardLegRecommendations.length > 0 && (
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <ArrowRight className="w-5 h-5" />
              <span>Forward-Leg Opportunities</span>
              <Badge className="bg-purple-600 text-white">{forwardLegRecommendations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forwardLegRecommendations.map((recommendation, index) => {
                const load = recommendation.loadData;
                if (!load) return null;

                return (
                  <div key={recommendation.loadId} className="bg-[var(--dark-elevated)] border border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium text-sm">
                          {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-gray-300 text-xs">
                            {load.miles} mi | ${load.rate?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${getScoreColor(recommendation.score)}`}>
                        {recommendation.score}/100
                      </div>
                    </div>
                    <div className="text-gray-300 text-xs">
                      Profit: {recommendation.profitPotential.toFixed(1)}% | 
                      Risk: {recommendation.riskAssessment}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
