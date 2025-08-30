import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, DollarSign, TrendingUp, ArrowRight, Star, Truck, BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import { formatDistanceToNow } from "date-fns";
import { useDemoApi } from "@/hooks/useDemoApi";

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
  const { useDemoQuery } = useDemoApi();
  
  // Clear any cached queries on component mount to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ 
      predicate: (query) => Boolean(query.queryKey[0]?.toString().includes('intelligent-load-matcher'))
    });
  }, [queryClient]);
  // Fetch available trucks with driver assignments - respects demo mode
  const { data: trucksData = [] } = useDemoQuery(
    ["intelligent-load-matcher-trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  
  const trucks = (trucksData as any[]).map(truck => ({
    id: truck.id,
    name: truck.name,
    currentDriverId: truck.currentDriverId,
    equipmentType: truck.equipmentType || "Dry Van",
    avgCostPerMile: truck.totalMiles > 0 ? 
      ((truck.fixedCosts + truck.variableCosts) / truck.totalMiles) : 1.5
  }));

  // Fetch compliance data for HOS status - respects demo mode
  const { data: complianceData, isError: complianceError } = useDemoQuery(
    ["intelligent-load-matcher-compliance"],
    "/api/compliance-overview",
    {
      staleTime: 1000 * 30, // Much shorter cache - only 30 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: false // Don't retry on auth errors
    }
  );

  // Fetch available loads - respects demo mode
  const { data: loads = [] } = useDemoQuery(
    ["intelligent-load-matcher-loads"],
    "/api/load-board",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Fetch market insights - ALWAYS for authenticated user, never demo mode
  const { data: marketInsightsData } = useQuery({
    queryKey: ["intelligent-load-matcher-market-insights"],
    queryFn: async () => {
      const response = await fetch("/api/recommendations/market-insights", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch market insights');
      }
      return response.json();
    },
    enabled: false,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const assignLoadMutation = useMutation({
    mutationFn: async (loadId: string) => {
      const response = await fetch(`/api/load-board/${loadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: "assigned" })
      });
      if (!response.ok) {
        throw new Error('Failed to assign load');
      }
      return response.json();
    },
    ...createSynchronizedMutation(queryClient, 'load'),
    onSuccess: (_, loadId) => {
      const load = (loads as any[]).find(l => l.id === loadId);
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

    const driver = (complianceData as any)?.driverDetails?.find((d: any) => d.driverId === selectedDriverId);
    // Find truck based on driver assignment or selected truck ID
    let truck = trucks.find(t => t.id === selectedTruckId);
    if (!truck) {
      truck = trucks.find(t => t.currentDriverId === selectedDriverId);
      if (truck) {
        setSelectedTruckId(truck.id); // Update the state for consistency
      }
    }
    
    if (!driver || !truck) {
      toast({
        title: "Data Missing",
        description: "Driver or truck information not found.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingRecommendations(true);

    try {
      // Prepare request data
      const requestData = {
        truckId: selectedTruckId,
        driverHours: {
          driveTimeRemaining: driver.driveTimeRemaining,
          onDutyRemaining: driver.onDutyRemaining
        },
        marketConditions: {
          fuelPrice: 3.50, // Could be fetched from a fuel price API
          seasonality: 'standard',
          marketDemand: 'medium' as const
        }
      };

      // Call the advanced recommendation engine - ALWAYS for authenticated user
      const response = await fetch('/api/recommendations/loads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      if (!response.ok) {
        throw new Error('Failed to generate load recommendations');
      }
      const data = await response.json();
      
      if (data.success) {
        // Merge load data with recommendations
        const enhancedRecommendations = data.recommendations.map((rec: any) => {
          const loadData = (loads as any[]).find(l => l.id === rec.loadId);
          return {
            ...rec,
            loadData
          };
        }).filter((rec: any) => rec.loadData); // Only show recommendations for available loads

        setRecommendations(enhancedRecommendations);
        setMarketInsights(data.marketInsights);
        
        toast({
          title: "Recommendations Generated",
          description: `Found ${enhancedRecommendations.length} optimized load opportunities.`,
        });
      } else {
        throw new Error(data.error || 'Failed to generate recommendations');
      }
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

    const driver = (complianceData as any)?.driverDetails?.find((d: any) => d.driverId === selectedDriverId);
    
    if (!driver) return;

    try {
      // Calculate remaining hours after completing the assigned load
      const assignedLoadDriveTime = assignedLoad.miles / 55;
      const remainingDriveTime = Math.max(0, driver.driveTimeRemaining - assignedLoadDriveTime);
      const remainingOnDutyTime = Math.max(0, driver.onDutyRemaining - assignedLoadDriveTime - 2);

      const requestData = {
        completedLoadId: assignedLoad.id,
        truckId: selectedTruckId,
        driverHours: {
          driveTimeRemaining: remainingDriveTime,
          onDutyRemaining: remainingOnDutyTime
        },
        currentLocation: {
          city: assignedLoad.destinationCity,
          state: assignedLoad.destinationState
        },
        marketConditions: {
          fuelPrice: 3.50,
          seasonality: 'standard',
          marketDemand: 'medium' as const
        }
      };

      const response = await fetch('/api/recommendations/loads/forward-leg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      if (!response.ok) {
        throw new Error('Failed to generate forward leg recommendations');
      }
      const data = await response.json();
      
      if (data.success) {
        const enhancedForwardRecommendations = data.forwardLegRecommendations.map((rec: any) => {
          const loadData = (loads as any[]).find(l => l.id === rec.loadId);
          return {
            ...rec,
            loadData
          };
        }).filter((rec: any) => rec.loadData);

        setForwardLegRecommendations(enhancedForwardRecommendations);
        
        toast({
          title: "Forward-Leg Recommendations",
          description: `Found ${enhancedForwardRecommendations.length} forward-leg opportunities.`,
        });
      }
    } catch (error) {
      console.error('Forward-leg recommendation error:', error);
    }
  };

  // Debug effect to log data changes
  useEffect(() => {
    console.log('[Load Matcher Debug] Compliance data:', complianceData);
    console.log('[Load Matcher Debug] Drivers count:', (complianceData as any)?.driverDetails?.length || 0);
    console.log('[Load Matcher Debug] Trucks data:', trucksData);
  }, [complianceData, trucksData]);

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
                  {(complianceData as any)?.driverDetails?.map((driver: any) => {
                    const truck = trucks.find(t => t.currentDriverId === driver.driverId);
                    return (
                      <SelectItem key={driver.driverId} value={driver.driverId}>
                        {driver.driverName} {truck && `(${truck.name})`}
                      </SelectItem>
                    );
                  })}
                  {/* Debug: Show if no drivers found */}
                  {!(complianceData as any)?.driverDetails?.length && (
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
                      Drive Time: <span className="text-blue-400">{(complianceData as any)?.driverDetails?.find((d: any) => d.driverId === selectedDriverId)?.driveTimeRemaining || 0}h</span> | 
                      On Duty: <span className="text-blue-400">{(complianceData as any)?.driverDetails?.find((d: any) => d.driverId === selectedDriverId)?.onDutyRemaining || 0}h</span>
                    </p>
                  </div>
                  <Button 
                    onClick={generateLoadRecommendations}
                    disabled={isGeneratingRecommendations || !selectedDriverId || !(complianceData as any)?.driverDetails?.find((d: any) => d.driverId === selectedDriverId)}
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
