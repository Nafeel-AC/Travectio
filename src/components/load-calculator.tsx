import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, CheckCircle, XCircle, Truck, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import { TruckService } from "@/lib/supabase-client";

interface CalculationResult {
  costPerMile: number;
  loadRPM: number;
  profit: number;
  isProfitable: boolean;
  fuelCostForLoad: number;
  estimatedGallons: number;
  milesPerGallon: number;
  fuelEfficiency: "excellent" | "good" | "average" | "poor";
}

export default function LoadCalculator() {
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [fixedCosts, setFixedCosts] = useState("");
  const [variableCosts, setVariableCosts] = useState("");
  const [weeklyMiles, setWeeklyMiles] = useState("3000"); // Default to 3000 miles standard
  const [loadPay, setLoadPay] = useState("");
  const [loadMiles, setLoadMiles] = useState("");
  const [milesPerGallon, setMilesPerGallon] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Stable queries with aggressive caching to prevent infinite loops
  const { data: trucks = [] } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // TODO: Implement proper services for cost breakdowns, fuel purchases, and loads
  const { data: costBreakdowns = [] } = useQuery({
    queryKey: ['cost-breakdowns', selectedTruckId],
    queryFn: () => Promise.resolve([]), // Placeholder
    enabled: !!selectedTruckId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Fetch fuel purchases for accurate MPG and fuel price calculations
  const { data: fuelPurchases = [] } = useQuery({
    queryKey: ['fuel-purchases', selectedTruckId],
    queryFn: () => Promise.resolve([]), // Placeholder
    enabled: !!selectedTruckId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Fetch loads for weekly miles calculation
  const { data: loads = [] } = useQuery({
    queryKey: ['loads', selectedTruckId],
    queryFn: () => Promise.resolve([]), // Placeholder
    enabled: !!selectedTruckId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Mutation to save load calculation results for cross-tab synchronization
  const saveCalculationMutation = useMutation({
    mutationFn: (data: { 
      truckId: string; 
      loadPay: number; 
      loadMiles: number; 
      calculationResult: CalculationResult;
    }) => apiRequest("/api/load-calculations", "POST", data),
    ...createSynchronizedMutation(queryClient, 'all'), // Comprehensive synchronization
    onSuccess: () => {
      toast({
        title: "Calculation Saved & Synchronized",
        description: "Load profitability calculation saved and all fleet metrics updated across system.",
      });
    },
  });

  // Auto-populate cost data when truck is selected
  useEffect(() => {

    if (selectedTruckId && trucks.length > 0) {
      const selectedTruck = trucks.find((truck: any) => truck.id === selectedTruckId);
      
      if (selectedTruck) {
        
        // Use the truck's TOTAL accumulated operational data
        // This represents all operations since the truck was added
        setFixedCosts(selectedTruck.fixedCosts?.toString() || "1030");
        setVariableCosts(selectedTruck.variableCosts?.toString() || "3174.435");
        setWeeklyMiles(selectedTruck.totalMiles?.toString() || "3312");
        
        // Calculate MPG and fuel price from actual operational data
        const totalMiles = selectedTruck.totalMiles || 0;
        
        // Use operational fuel data if available
        if (fuelPurchases && Array.isArray(fuelPurchases) && fuelPurchases.length > 0) {
          const truckFuelPurchases = fuelPurchases.filter((purchase: any) => 
            purchase.truckId === selectedTruckId && purchase.loadId
          );
          
          if (truckFuelPurchases.length > 0) {
            const totalGallons = truckFuelPurchases.reduce((sum: number, purchase: any) => sum + purchase.gallons, 0);
            const totalFuelCost = truckFuelPurchases.reduce((sum: number, purchase: any) => sum + purchase.totalCost, 0);
            
            if (totalGallons > 0 && totalMiles > 0) {
              const calculatedMPG = totalMiles / totalGallons;
              const avgFuelPrice = totalFuelCost / totalGallons;
              setMilesPerGallon(calculatedMPG.toFixed(2));
              setFuelPrice(avgFuelPrice.toFixed(4));
              
            } else {
              setMilesPerGallon("6.5"); // Industry standard for Class 8 trucks
              setFuelPrice("3.75"); // Current national average
            }
          } else {
            setMilesPerGallon("6.5"); // Industry standard for Class 8 trucks
            setFuelPrice("3.75"); // Current national average
          }
        } else {
          setMilesPerGallon("6.5"); // Industry standard for Class 8 trucks
          setFuelPrice("3.75"); // Current national average
        }
      }
    }
  }, [selectedTruckId, trucks, fuelPurchases]);

  const calculateProfitability = () => {
    const fixed = parseFloat(fixedCosts);
    const variable = parseFloat(variableCosts);
    const miles = parseFloat(weeklyMiles);
    const pay = parseFloat(loadPay);
    const lMiles = parseFloat(loadMiles);
    const mpg = parseFloat(milesPerGallon);
    const fuelPricePerGal = parseFloat(fuelPrice);

    if (!fixed || !variable || !miles || !pay || !lMiles) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to calculate profitability.",
        variant: "destructive",
      });
      return;
    }

    if (miles <= 0 || lMiles <= 0) {
      toast({
        title: "Invalid Input",
        description: "Miles must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    const totalCost = fixed + variable;
    const costPerMile = totalCost / miles;
    const loadRPM = pay / lMiles;
    
    // Calculate fuel efficiency metrics
    let fuelCostForLoad = 0;
    let estimatedGallons = 0;
    let calculatedMPG = mpg || 6.5; // Industry standard for Class 8 trucks
    let fuelEfficiency: "excellent" | "good" | "average" | "poor" = "average";
    
    if (mpg && fuelPricePerGal) {
      estimatedGallons = lMiles / mpg;
      fuelCostForLoad = estimatedGallons * fuelPricePerGal;
      
      // Determine efficiency rating
      if (mpg >= 8) fuelEfficiency = "excellent";
      else if (mpg >= 7) fuelEfficiency = "good";
      else if (mpg >= 6) fuelEfficiency = "average";
      else fuelEfficiency = "poor";
    }
    
    const profit = pay - (lMiles * costPerMile);
    const isProfitable = loadRPM > costPerMile;

    const calcResult = {
      costPerMile: Number(costPerMile.toFixed(3)),
      loadRPM: Number(loadRPM.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      isProfitable,
      fuelCostForLoad: Number(fuelCostForLoad.toFixed(2)),
      estimatedGallons: Number(estimatedGallons.toFixed(1)),
      milesPerGallon: calculatedMPG,
      fuelEfficiency,
    };

    setResult(calcResult);
    
    // Save calculation for cross-tab synchronization
    if (selectedTruckId && calcResult) {
      saveCalculationMutation.mutate({
        truckId: selectedTruckId,
        loadPay: pay,
        loadMiles: lMiles,
        calculationResult: calcResult,
      });
    }

    toast({
      title: "Calculation Complete",
      description: isProfitable ? "This load is profitable!" : "This load is not profitable.",
      variant: isProfitable ? "default" : "destructive",
    });
  };



  const resetForm = () => {
    setSelectedTruckId("");
    setFixedCosts("");
    setVariableCosts("");
    setWeeklyMiles("3000");
    setLoadPay("");
    setLoadMiles("");
    setMilesPerGallon("");
    setFuelPrice("");
    setResult(null);
  };

  return (
    <Card className="bg-[var(--dark-card)] border-gray-700">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[var(--primary-blue)] bg-opacity-20 rounded-lg flex items-center justify-center">
            <Calculator className="text-[var(--primary-blue)] h-5 w-5" />
          </div>
          <CardTitle className="text-white">Load Profitability Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Truck Selection */}
        <div>
          <Label className="text-gray-300 flex items-center space-x-2">
            <Truck className="w-4 h-4" />
            <span>Select Truck (Auto-fills costs)</span>
          </Label>
          <div className="flex gap-2">
            <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
              <SelectTrigger className="bg-[var(--dark-elevated)] border-gray-600 text-white focus:border-[var(--primary-blue)]">
                <SelectValue placeholder="Choose a truck..." />
              </SelectTrigger>
              <SelectContent className="bg-[var(--dark-card)] border-gray-600">
                {trucks.map((truck: any) => {
                  // Calculate CPM for display - use operational CPM if available, otherwise calculate from costs
                  let displayCPM = truck.costPerMile || 0;
                  if (displayCPM === 0 && truck.fixedCosts && truck.variableCosts) {
                    // Calculate CPM based on fixed/variable costs and standard weekly mileage
                    const weeklyMileage = truck.totalMiles > 0 ? truck.totalMiles : 3000; // Use operational miles or standard
                    displayCPM = (truck.fixedCosts + truck.variableCosts) / weeklyMileage;
                  }
                  
                  // Ensure displayCPM is a valid number before calling toFixed
                  const formattedCPM = (displayCPM && !isNaN(displayCPM)) ? displayCPM.toFixed(2) : '0.00';
                  
                  return (
                    <SelectItem key={truck.id} value={truck.id} className="text-white hover:bg-[var(--dark-elevated)]">
                      {truck.name} - ${formattedCPM}/mi {truck.totalMiles === 0 ? '(calculated)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedTruckId && (
              <Button
                onClick={() => window.location.href = `/truck/${selectedTruckId}`}
                variant="outline"
                size="sm"
                className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                title="Edit truck cost breakdown"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Weekly Fixed Costs</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <Input
                type="number"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(e.target.value)}
                className="bg-[var(--dark-elevated)] border-gray-600 text-white pl-8 focus:border-[var(--primary-blue)]"
                placeholder="1200"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Variable Costs</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <Input
                type="number"
                value={variableCosts}
                onChange={(e) => setVariableCosts(e.target.value)}
                className="bg-[var(--dark-elevated)] border-gray-600 text-white pl-8 focus:border-[var(--primary-blue)]"
                placeholder="1800"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-gray-300">Weekly Miles (Industry Standard: 3000)</Label>
          <Input
            type="number"
            value={weeklyMiles}
            onChange={(e) => setWeeklyMiles(e.target.value)}
            className="bg-[var(--dark-elevated)] border-gray-600 text-white focus:border-[var(--primary-blue)]"
            placeholder="3000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Miles Per Gallon (MPG)</Label>
            <Input
              type="number"
              step="0.1"
              value={milesPerGallon}
              onChange={(e) => setMilesPerGallon(e.target.value)}
              className="bg-[var(--dark-elevated)] border-gray-600 text-white focus:border-[var(--primary-blue)]"
              placeholder="7.2"
            />
            <p className="text-xs text-gray-500 mt-1">Based on total miles (loaded + deadhead)</p>
          </div>
          <div>
            <Label className="text-gray-300">Fuel Price per Gallon</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <Input
                type="number"
                step="0.01"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                className="bg-[var(--dark-elevated)] border-gray-600 text-white pl-8 focus:border-[var(--primary-blue)]"
                placeholder="3.75"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-600" />

        <h3 className="text-lg font-semibold text-white">Load Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Load Pay</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <Input
                type="number"
                value={loadPay}
                onChange={(e) => setLoadPay(e.target.value)}
                className="bg-[var(--dark-elevated)] border-gray-600 text-white pl-8 focus:border-[var(--primary-blue)]"
                placeholder="1100"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Load Miles</Label>
            <Input
              type="number"
              value={loadMiles}
              onChange={(e) => setLoadMiles(e.target.value)}
              className="bg-[var(--dark-elevated)] border-gray-600 text-white focus:border-[var(--primary-blue)]"
              placeholder="500"
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={calculateProfitability}
            className="flex-1 bg-[var(--primary-blue)] hover:bg-[var(--blue-accent)] text-white"
          >
            Calculate Profitability
          </Button>
          <Button
            onClick={resetForm}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
          >
            Reset
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-[var(--dark-elevated)] rounded-lg border border-gray-600">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Cost Per Mile:</span>
                <span className="text-white font-semibold">${result.costPerMile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Load RPM:</span>
                <span className="text-white font-semibold">${result.loadRPM}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Estimated Profit:</span>
                <span className={`font-semibold ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${result.profit}
                </span>
              </div>
              
              {/* Fuel Efficiency Information */}
              {result.fuelCostForLoad > 0 && (
                <>
                  <hr className="border-gray-600 my-3" />
                  <h4 className="text-sm font-semibold text-white mb-2">Fuel Cost Breakdown</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Estimated Fuel Cost:</span>
                    <span className="text-yellow-400 font-semibold">${result.fuelCostForLoad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Estimated Gallons:</span>
                    <span className="text-white font-semibold">{result.estimatedGallons} gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Miles Per Gallon:</span>
                    <span className="text-white font-semibold">{result.milesPerGallon} MPG</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {costBreakdowns.length > 0 && costBreakdowns[0]?.milesPerGallon > 0 
                      ? `✓ Actual: ${costBreakdowns[0].milesPerGallon} MPG from ${costBreakdowns[0].gallonsUsed} gal @ $${costBreakdowns[0].avgFuelPrice?.toFixed(3)}` 
                      : "Estimated - add fuel transactions for accuracy"}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Fuel Efficiency:</span>
                    <span className={`font-semibold capitalize ${
                      result.fuelEfficiency === 'excellent' ? 'text-green-400' :
                      result.fuelEfficiency === 'good' ? 'text-blue-400' :
                      result.fuelEfficiency === 'average' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {result.fuelEfficiency}
                    </span>
                  </div>
                </>
              )}

              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  {result.isProfitable ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-bold">PROFITABLE</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-bold">NOT PROFITABLE</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
