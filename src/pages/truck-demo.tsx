import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, DollarSign, Calculator, Info, Plus, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useTrucks } from "@/hooks/useSupabase";

export default function TruckDemo() {
  const { addTruck } = useTrucks();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Basic truck information
  const [truckInfo, setTruckInfo] = useState({
    name: "Truck #001",
    vin: "1HGBH41JXMN109186",
    licensePlate: "ABC-123",
    eldDeviceId: "ELD-001",
    equipmentType: "Dry Van"
  });

  // Fixed costs (weekly basis) - Pre-filled with typical values
  const [fixedCosts, setFixedCosts] = useState({
    truckPayment: 800,
    trailerPayment: 300,
    elogSubscription: 45,
    liabilityInsurance: 150,
    physicalInsurance: 200,
    cargoInsurance: 75,
    trailerInterchange: 50,
    bobtailInsurance: 25,
    nonTruckingLiability: 35,
    basePlateDeduction: 40,
    companyPhone: 30
  });

  // Variable costs (weekly basis) - Pre-filled with typical values
  const [variableCosts, setVariableCosts] = useState({
    driverPay: 2000,
    fuel: 1200,
    maintenance: 300,
    iftaTaxes: 150,
    tolls: 100,
    dwellTime: 75,
    reeferFuel: 0,
    truckParking: 50
  });

  const calculateTotalFixedCosts = () => {
    return Object.values(fixedCosts).reduce((sum, cost) => sum + cost, 0);
  };

  const calculateTotalVariableCosts = () => {
    return Object.values(variableCosts).reduce((sum, cost) => sum + cost, 0);
  };

  const calculateTotalWeeklyCosts = () => {
    return calculateTotalFixedCosts() + calculateTotalVariableCosts();
  };

  const calculateCostPerMile = () => {
    const totalCosts = calculateTotalWeeklyCosts();
    const standardWeeklyMiles = 3000; // Industry standard
    return totalCosts / standardWeeklyMiles;
  };

  const addTruckMutation = useMutation({
    mutationFn: async (truckData: any) => {
      console.log('[TruckDemo] Attempting to add truck:', truckData);
      
      const result = await addTruck(truckData);
      console.log('[TruckDemo] Successfully added truck:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[TruckDemo] ====== SUCCESS HANDLER CALLED ======');
      console.log('[TruckDemo] Mutation succeeded with data:', data);
      
      toast({
        title: "Truck Added Successfully!",
        description: "Your truck has been added to the fleet with all cost details.",
      });
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      console.log('[TruckDemo] =====================================');
    },
    onError: (error) => {
      console.error('[TruckDemo] ====== MUTATION ERROR DETECTED ======');
      console.error('[TruckDemo] Mutation error:', error);
      console.error('[TruckDemo] Error type:', typeof error);
      console.error('[TruckDemo] Error message:', error?.message);
      console.error('[TruckDemo] Error stack:', (error as Error)?.stack);
      console.error('[TruckDemo] Full error object:', JSON.stringify(error, null, 2));
      console.error('[TruckDemo] ========================================');
      
      // Temporarily disable error toast for debugging
      // toast({
      //   title: "Failed to Add Truck",
      //   description: "There was an error adding the truck. Please try again.",
      //   variant: "destructive",
      // });
    },
  });

  const handleSubmit = () => {
    if (!truckInfo.name.trim()) {
      toast({
        title: "Truck Name Required",
        description: "Please enter a name for the truck.",
        variant: "destructive",
      });
      return;
    }

    const totalFixedCosts = calculateTotalFixedCosts();
    const totalVariableCosts = calculateTotalVariableCosts();
    const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
    const costPerMile = calculateCostPerMile();

    const truckData = {
      ...truckInfo,
      fixedCosts: totalFixedCosts,
      variableCosts: totalVariableCosts,
      totalMiles: 0,
      isActive: 1,
      costBreakdown: {
        ...fixedCosts,
        ...variableCosts,
        totalFixedCosts,
        totalVariableCosts,
        totalWeeklyCosts,
        costPerMile,
        weekStarting: new Date().toISOString()
      }
    };

    addTruckMutation.mutate(truckData);
  };

  const handleFixedCostChange = (field: keyof typeof fixedCosts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFixedCosts(prev => ({ ...prev, [field]: value }));
  };

  const handleVariableCostChange = (field: keyof typeof variableCosts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setVariableCosts(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-slate-300 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">Add Truck Demo</h1>
          <p className="text-slate-400">Learn how to add trucks with their fixed and variable costs</p>
        </div>

        <div className="space-y-6">
          {/* Basic Truck Information */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Step 1: Basic Information</CardTitle>
              <CardDescription className="text-slate-400">
                Enter the basic details for your truck
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truckName" className="text-white">Truck Name *</Label>
                  <Input
                    id="truckName"
                    value={truckInfo.name}
                    onChange={(e) => setTruckInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., Truck #001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipmentType" className="text-white">Equipment Type</Label>
                  <Select
                    value={truckInfo.equipmentType}
                    onValueChange={(value) => setTruckInfo(prev => ({ ...prev, equipmentType: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="Dry Van">Dry Van</SelectItem>
                      <SelectItem value="Reefer">Reefer</SelectItem>
                      <SelectItem value="Flatbed">Flatbed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vin" className="text-white">VIN</Label>
                  <Input
                    id="vin"
                    value={truckInfo.vin}
                    onChange={(e) => setTruckInfo(prev => ({ ...prev, vin: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Vehicle Identification Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate" className="text-white">License Plate</Label>
                  <Input
                    id="licensePlate"
                    value={truckInfo.licensePlate}
                    onChange={(e) => setTruckInfo(prev => ({ ...prev, licensePlate: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="License plate number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eldDeviceId" className="text-white">ELD Device ID</Label>
                  <Input
                    id="eldDeviceId"
                    value={truckInfo.eldDeviceId}
                    onChange={(e) => setTruckInfo(prev => ({ ...prev, eldDeviceId: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Electronic logging device ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fixed Costs */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Step 2: Fixed Costs (Weekly)
              </CardTitle>
              <CardDescription className="text-slate-400">
                These costs remain the same regardless of miles driven. Values are pre-filled with industry averages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Truck Payment</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.truckPayment}
                    onChange={handleFixedCostChange("truckPayment")}
                    className="bg-slate-700 border-slate-600 text-white"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">ELog Subscription</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.elogSubscription}
                    onChange={handleFixedCostChange("elogSubscription")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Liability Insurance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.liabilityInsurance}
                    onChange={handleFixedCostChange("liabilityInsurance")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Physical Insurance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.physicalInsurance}
                    onChange={handleFixedCostChange("physicalInsurance")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Cargo Insurance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.cargoInsurance}
                    onChange={handleFixedCostChange("cargoInsurance")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="bg-slate-700/30 p-3 rounded">
                <div className="flex justify-between text-white">
                  <span className="font-medium">Total Fixed Costs (Weekly):</span>
                  <span className="font-bold">${calculateTotalFixedCosts().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variable Costs */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Step 3: Variable Costs (Weekly)
              </CardTitle>
              <CardDescription className="text-slate-400">
                These costs change based on miles driven and operational activities. Pre-filled with typical values.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Driver Pay</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variableCosts.driverPay}
                    onChange={handleVariableCostChange("driverPay")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Fuel</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variableCosts.fuel}
                    onChange={handleVariableCostChange("fuel")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Maintenance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variableCosts.maintenance}
                    onChange={handleVariableCostChange("maintenance")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">IFTA Taxes</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variableCosts.iftaTaxes}
                    onChange={handleVariableCostChange("iftaTaxes")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Tolls</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variableCosts.tolls}
                    onChange={handleVariableCostChange("tolls")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Truck Parking</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variableCosts.truckParking}
                    onChange={handleVariableCostChange("truckParking")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="bg-slate-700/30 p-3 rounded">
                <div className="flex justify-between text-white">
                  <span className="font-medium">Total Variable Costs (Weekly):</span>
                  <span className="font-bold">${calculateTotalVariableCosts().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card className="bg-blue-900/30 border-blue-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Step 4: Cost Summary
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review your total costs and cost-per-mile calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-white">
                <span>Total Fixed Costs (Weekly):</span>
                <span className="font-bold">${calculateTotalFixedCosts().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Total Variable Costs (Weekly):</span>
                <span className="font-bold">${calculateTotalVariableCosts().toFixed(2)}</span>
              </div>
              <Separator className="bg-slate-600" />
              <div className="flex justify-between text-white text-lg">
                <span className="font-bold">Total Weekly Costs:</span>
                <span className="font-bold text-yellow-400">${calculateTotalWeeklyCosts().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white text-lg">
                <span className="font-bold">Cost Per Mile (3,000 mi/week):</span>
                <span className="font-bold text-green-400">${calculateCostPerMile().toFixed(3)}</span>
              </div>
              <div className="mt-4 p-3 bg-slate-700/50 rounded">
                <p className="text-slate-300 text-sm">
                  <strong>How it works:</strong> The system calculates your cost-per-mile by dividing total weekly costs 
                  by 3,000 miles (industry standard). This helps you price loads profitably and track true operating costs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={addTruckMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {addTruckMutation.isPending ? (
                "Adding Truck..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add This Truck to Fleet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}