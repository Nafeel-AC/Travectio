import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Calculator, ArrowLeft, Save, Truck, Info, HelpCircle, TrendingUp } from "lucide-react";
import { useLocation, useRoute, useParams } from "wouter";
import { NavigationLayout } from "@/components/global-navigation";
import { useTrucks } from "@/hooks/useSupabase";
import { TruckService } from "@/lib/supabase-client";

export default function TruckCostBreakdown() {
  const { truckId } = useParams();
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [costBreakdowns, setCostBreakdowns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // const { getTruckCostBreakdowns } = useTrucks(); // Not available in useTrucks hook
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/trucks/:truckId/cost-breakdown");
  const truckIdFromParams = params?.truckId;
  // Fixed costs (weekly basis)
  const [fixedCosts, setFixedCosts] = useState({
    truckPayment: "",
    trailerPayment: "",
    elogSubscription: "",
    liabilityInsurance: "",
    physicalInsurance: "",
    cargoInsurance: "",
    trailerInterchange: "",
    bobtailInsurance: "",
    nonTruckingLiability: "",
    basePlateDeduction: "",
    companyPhone: ""
  });

  // Variable costs (per mile and weekly basis)
  const [variableCosts, setVariableCosts] = useState({
    driverPayPerMile: "", // cents per mile
    maintenance: "", // weekly
    iftaTaxes: "", // weekly
    tolls: "", // weekly
    dwellTime: "", // weekly
    reeferFuel: "", // weekly
    truckParking: "" // weekly
  });

  // Get truck data
  const { data: truck, isLoading: loadingTruck } = useQuery({
    queryKey: ['truck', truckIdFromParams],
    queryFn: () => TruckService.getTruck(truckIdFromParams!),
    enabled: !!truckIdFromParams,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    const fetchCostBreakdowns = async () => {
      if (!truckIdFromParams) return;
      
      try {
        setIsLoading(true);
        const data = await TruckService.getTruckCostBreakdown(truckIdFromParams);
        setCostBreakdowns(data || []);
      } catch (error: any) {
        toast({
          title: "Failed to Load Cost Breakdowns",
          description: error.message || "There was an error loading the cost breakdowns.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCostBreakdowns();
  }, [truckIdFromParams, selectedPeriod]);

  // Load existing cost breakdown if available
  useEffect(() => {
    if (truck && (truck as any)?.costBreakdown) {
      const breakdown = (truck as any).costBreakdown;
      setFixedCosts({
        truckPayment: breakdown.truckPayment?.toString() || "",
        trailerPayment: breakdown.trailerPayment?.toString() || "",
        elogSubscription: breakdown.elogSubscription?.toString() || "",
        liabilityInsurance: breakdown.liabilityInsurance?.toString() || "",
        physicalInsurance: breakdown.physicalInsurance?.toString() || "",
        cargoInsurance: breakdown.cargoInsurance?.toString() || "",
        trailerInterchange: breakdown.trailerInterchange?.toString() || "",
        bobtailInsurance: breakdown.bobtailInsurance?.toString() || "",
        nonTruckingLiability: breakdown.nonTruckingLiability?.toString() || "",
        basePlateDeduction: breakdown.basePlateDeduction?.toString() || "",
        companyPhone: breakdown.companyPhone?.toString() || ""
      });
      setVariableCosts({
        driverPayPerMile: breakdown.driverPayPerMile?.toString() || "",
        maintenance: breakdown.maintenance?.toString() || "",
        iftaTaxes: breakdown.iftaTaxes?.toString() || "",
        tolls: breakdown.tolls?.toString() || "",
        dwellTime: breakdown.dwellTime?.toString() || "",
        reeferFuel: breakdown.reeferFuel?.toString() || "",
        truckParking: breakdown.truckParking?.toString() || ""
      });
    }
  }, [truck]);

  const calculateTotalFixedCosts = () => {
    return Object.values(fixedCosts).reduce((sum, cost) => sum + (parseFloat(cost) || 0), 0);
  };

  const calculateTotalVariableCosts = () => {
    const standardWeeklyMiles = 3000;
    const driverPayWeekly = ((parseFloat(variableCosts.driverPayPerMile) || 0) / 100) * standardWeeklyMiles;
    const otherCosts = Object.entries(variableCosts)
      .filter(([key]) => key !== 'driverPayPerMile')
      .reduce((sum, [, cost]) => sum + (parseFloat(cost) || 0), 0);
    return driverPayWeekly + otherCosts;
  };

  const calculateTotalWeeklyCosts = () => {
    return calculateTotalFixedCosts() + calculateTotalVariableCosts();
  };

  const calculateCostPerMile = () => {
    const totalCosts = calculateTotalWeeklyCosts();
    const standardWeeklyMiles = 3000;
    return totalCosts / standardWeeklyMiles;
  };

  // Calculate values in real-time for display
  const totalFixedCosts = calculateTotalFixedCosts();
  const totalVariableCosts = calculateTotalVariableCosts();
  const totalWeeklyCosts = calculateTotalWeeklyCosts();
  const costPerMile = calculateCostPerMile();

  const updateCostsMutation = useMutation({
    mutationFn: async (costData: any) => {
      if (!truckIdFromParams) {
        throw new Error('Truck ID is required');
      }
      
      // Check if we have an existing cost breakdown to update
      const existingBreakdowns = await TruckService.getTruckCostBreakdown(truckIdFromParams);
      const latestBreakdown = existingBreakdowns?.[0];
      
      let result;
      if (latestBreakdown) {
        // Update existing breakdown
        result = await TruckService.updateCostBreakdown(latestBreakdown.id, costData.costBreakdown);
      } else {
        // Create new breakdown
        result = await TruckService.createCostBreakdown(truckIdFromParams, costData.costBreakdown);
      }
      
      // Also update the truck's cost per mile
      await TruckService.updateTruck(truckIdFromParams, {
        costPerMile: costData.costBreakdown.costPerMile
      });
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Cost Breakdown Saved!",
        description: "Your truck's cost breakdown has been updated successfully.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      queryClient.invalidateQueries({ queryKey: ["costBreakdowns"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Save Costs",
        description: "There was an error saving the cost breakdown. Please try again.",
        variant: "destructive",
      });
      console.error("Error:", error);
    },
  });

  const handleSubmit = () => {
    const totalFixedCosts = calculateTotalFixedCosts();
    const totalVariableCosts = calculateTotalVariableCosts();
    const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
    const costPerMile = calculateCostPerMile();

    const costData = {
      truckId: truckIdFromParams,
      costBreakdown: {
        truckPayment: parseFloat(fixedCosts.truckPayment) || 0,
        trailerPayment: parseFloat(fixedCosts.trailerPayment) || 0,
        elogSubscription: parseFloat(fixedCosts.elogSubscription) || 0,
        liabilityInsurance: parseFloat(fixedCosts.liabilityInsurance) || 0,
        physicalInsurance: parseFloat(fixedCosts.physicalInsurance) || 0,
        cargoInsurance: parseFloat(fixedCosts.cargoInsurance) || 0,
        trailerInterchange: parseFloat(fixedCosts.trailerInterchange) || 0,
        bobtailInsurance: parseFloat(fixedCosts.bobtailInsurance) || 0,
        nonTruckingLiability: parseFloat(fixedCosts.nonTruckingLiability) || 0,
        basePlateDeduction: parseFloat(fixedCosts.basePlateDeduction) || 0,
        companyPhone: parseFloat(fixedCosts.companyPhone) || 0,
        driverPayPerMile: parseFloat(variableCosts.driverPayPerMile) || 0,
        maintenance: parseFloat(variableCosts.maintenance) || 0,
        iftaTaxes: parseFloat(variableCosts.iftaTaxes) || 0,
        tolls: parseFloat(variableCosts.tolls) || 0,
        dwellTime: parseFloat(variableCosts.dwellTime) || 0,
        reeferFuel: parseFloat(variableCosts.reeferFuel) || 0,
        truckParking: parseFloat(variableCosts.truckParking) || 0,
        totalFixedCosts,
        totalVariableCosts,
        totalWeeklyCosts,
        costPerMile,
        weekStarting: new Date().toISOString()
      }
    };

    updateCostsMutation.mutate(costData);
  };

  const handleFixedCostChange = (field: keyof typeof fixedCosts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow any valid number input - fully permissive for complete number entry
    setFixedCosts(prev => ({ ...prev, [field]: value }));
  };

  const handleVariableCostChange = (field: keyof typeof variableCosts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow any valid number input - fully permissive for complete number entry
    setVariableCosts(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <NavigationLayout currentPath="/add-truck">
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-white">Loading truck information...</div>
        </div>
      </NavigationLayout>
    );
  }

  if (!truck) {
    return (
      <NavigationLayout currentPath="/add-truck">
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-white">Truck not found</div>
        </div>
      </NavigationLayout>
    );
  }

  return (
    <NavigationLayout currentPath="/add-truck">
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-slate-300 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <Truck className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">{(truck as any)?.name || 'Truck'} - Weekly Cost Setup</h1>
            </div>
            <p className="text-slate-400">
              Set up your weekly operating costs for accurate profitability tracking. These costs will be used to calculate your cost-per-mile and load profitability.
            </p>
          </div>

          {/* Quick Start Guide */}
          <Card className="bg-blue-900/20 border-blue-700/50 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-blue-300 font-semibold mb-2">Getting Started with Cost Tracking</h3>
                  <p className="text-blue-200 text-sm mb-3">
                    Enter your typical weekly operating costs below. Don't worry about being exact - you can always update these numbers later as you get more accurate data.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong className="text-blue-300">Fixed Costs:</strong> Same every week (truck payments, insurance, permits)
                    </div>
                    <div>
                      <strong className="text-blue-300">Variable Costs:</strong> Change with miles driven (fuel, driver pay, maintenance)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="simple" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="simple">Quick Setup</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-8">
              {/* Simple Cost Entry */}
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-xl flex items-center gap-2">
                      <DollarSign className="h-6 w-6 text-green-400" />
                      Fixed Costs (Weekly)
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      These costs stay the same every week
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-3">
                        <Label className="text-white flex items-center gap-2">
                          Truck Payment 
                          <HelpCircle className="h-4 w-4 text-slate-400" />
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fixedCosts.truckPayment}
                          onChange={handleFixedCostChange("truckPayment")}
                          className="bg-slate-700 border-slate-600 text-white text-lg"
                          placeholder="800"
                        />
                        <p className="text-xs text-slate-500">Typical range: $600-$1,200/week</p>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white flex items-center gap-2">
                          Insurance (Total)
                          <HelpCircle className="h-4 w-4 text-slate-400" />
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fixedCosts.liabilityInsurance}
                          onChange={handleFixedCostChange("liabilityInsurance")}
                          className="bg-slate-700 border-slate-600 text-white text-lg"
                          placeholder="300"
                        />
                        <p className="text-xs text-slate-500">Typical range: $200-$500/week</p>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white flex items-center gap-2">
                          Other Fixed Costs
                          <HelpCircle className="h-4 w-4 text-slate-400" />
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fixedCosts.trailerPayment}
                          onChange={handleFixedCostChange("trailerPayment")}
                          className="bg-slate-700 border-slate-600 text-white text-lg"
                          placeholder="250"
                        />
                        <p className="text-xs text-slate-500">ELD, trailer lease, phone, etc.</p>
                      </div>
                    </div>

                    <div className="bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">Total Fixed Costs:</span>
                        <span className="text-green-400 font-bold text-xl">
                          ${calculateTotalFixedCosts().toFixed(2)}/week
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-xl flex items-center gap-2">
                      <Calculator className="h-6 w-6 text-orange-400" />
                      Variable Costs (Weekly)
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      These costs change based on miles driven
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-3">
                        <Label className="text-white flex items-center gap-2">
                          Driver Pay (cents per mile)
                          <HelpCircle className="h-4 w-4 text-slate-400" />
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={variableCosts.driverPayPerMile}
                          onChange={handleVariableCostChange("driverPayPerMile")}
                          className="bg-slate-700 border-slate-600 text-white text-lg"
                          placeholder="65"
                        />
                        <p className="text-xs text-slate-500">
                          Weekly: ${(((parseFloat(variableCosts.driverPayPerMile) || 0) / 100) * 3000).toFixed(2)} @ 3,000 miles
                        </p>
                      </div>



                      <div className="space-y-3">
                        <Label className="text-white flex items-center gap-2">
                          Other Variable Costs
                          <HelpCircle className="h-4 w-4 text-slate-400" />
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variableCosts.maintenance}
                          onChange={handleVariableCostChange("maintenance")}
                          className="bg-slate-700 border-slate-600 text-white text-lg"
                          placeholder="350"
                        />
                        <p className="text-xs text-slate-500">Maintenance, permits, IFTA taxes, tolls, parking</p>
                      </div>
                    </div>

                    <div className="bg-orange-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">Total Variable Costs:</span>
                        <span className="text-orange-400 font-bold text-xl">
                          ${calculateTotalVariableCosts().toFixed(2)}/week
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-8">
              {/* Detailed Cost Entry */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Detailed Fixed Costs */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Fixed Costs (Weekly)
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Break down your exact fixed costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Truck Payment</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={fixedCosts.truckPayment}
                        onChange={handleFixedCostChange("truckPayment")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Trailer Payment</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={fixedCosts.trailerPayment}
                        onChange={handleFixedCostChange("trailerPayment")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Insurance (Total)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={fixedCosts.liabilityInsurance}
                        onChange={handleFixedCostChange("liabilityInsurance")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">ELD Subscription</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={fixedCosts.elogSubscription}
                        onChange={handleFixedCostChange("elogSubscription")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="45"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Other Fixed Costs</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={fixedCosts.companyPhone}
                        onChange={handleFixedCostChange("companyPhone")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="50"
                      />
                    </div>
                    
                    <div className="bg-slate-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">Total Fixed:</span>
                        <span className="text-green-400 font-bold">
                          ${calculateTotalFixedCosts().toFixed(2)}/week
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Variable Costs */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Variable Costs
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Break down your exact variable costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Driver Pay (cents/mile)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={variableCosts.driverPayPerMile}
                        onChange={handleVariableCostChange("driverPayPerMile")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="65"
                      />
                      <p className="text-xs text-slate-500">
                        Weekly: ${(((parseFloat(variableCosts.driverPayPerMile) || 0) / 100) * 3000).toFixed(2)} @ 3,000 miles
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Maintenance (weekly)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variableCosts.maintenance}
                        onChange={handleVariableCostChange("maintenance")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="150"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">IFTA Taxes (weekly)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variableCosts.iftaTaxes}
                        onChange={handleVariableCostChange("iftaTaxes")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Permits (weekly)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variableCosts.tolls}
                        onChange={handleVariableCostChange("tolls")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Other Variable (weekly)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variableCosts.dwellTime}
                        onChange={handleVariableCostChange("dwellTime")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="50"
                      />
                    </div>
                    
                    <div className="bg-slate-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">Total Variable:</span>
                        <span className="text-orange-400 font-bold">
                          ${calculateTotalVariableCosts().toFixed(2)}/week
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Summary */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Detailed Summary</CardTitle>
                    <CardDescription className="text-slate-400">
                      Complete cost breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Fixed Costs/Week:</span>
                        <span className="text-green-400 font-medium">
                          ${calculateTotalFixedCosts().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Variable Costs/Week:</span>
                        <span className="text-orange-400 font-medium">
                          ${calculateTotalVariableCosts().toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-slate-600 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Total/Week:</span>
                          <span className="text-blue-400 font-bold text-lg">
                            ${calculateTotalWeeklyCosts().toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-blue-900/20 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Cost Per Mile:</span>
                          <span className="text-blue-300 font-bold text-xl">
                            ${calculateCostPerMile().toFixed(3)}
                          </span>
                        </div>
                        <p className="text-blue-200 text-xs mt-1">
                          Based on 3,000 miles/week standard
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Cost Summary Card - Always Visible */}
          <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-400" />
                Your Weekly Cost Summary
              </CardTitle>
              <CardDescription className="text-slate-300">
                This is what it costs to run your truck each week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-green-900/20 rounded-lg">
                  <div className="text-green-400 text-2xl font-bold">
                    ${calculateTotalFixedCosts().toFixed(2)}
                  </div>
                  <div className="text-green-300 text-sm">Fixed Costs/Week</div>
                  <div className="text-green-200 text-xs mt-1">Same every week</div>
                </div>
                <div className="text-center p-4 bg-orange-900/20 rounded-lg">
                  <div className="text-orange-400 text-2xl font-bold">
                    ${calculateTotalVariableCosts().toFixed(2)}
                  </div>
                  <div className="text-orange-300 text-sm">Variable Costs/Week</div>
                  <div className="text-orange-200 text-xs mt-1">Changes with miles</div>
                </div>
                <div className="text-center p-4 bg-blue-900/20 rounded-lg">
                  <div className="text-blue-400 text-3xl font-bold">
                    ${calculateCostPerMile().toFixed(3)}
                  </div>
                  <div className="text-blue-300 text-sm">Cost Per Mile</div>
                  <div className="text-blue-200 text-xs mt-1">Break-even point</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={updateCostsMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
                >
                  {updateCostsMutation.isPending ? (
                    "Saving Your Costs..."
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save My Weekly Costs
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  I'll Set This Up Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </NavigationLayout>
  );
}