import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTrucks } from "@/hooks/useSupabase";
import { useQueryClient } from "@tanstack/react-query";
import { Truck, Info, ArrowRight, ArrowLeft, CheckCircle, Zap, Smartphone } from "lucide-react";
import { useLocation } from "wouter";
import { NavigationLayout } from "@/components/global-navigation";
import { TruckCostGuide } from "@/components/truck-cost-guide";

export default function GuidedTruckAddition() {
  const { addTruck } = useTrucks();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Updated to include cost input step
  const [showCostGuide, setShowCostGuide] = useState(true);
  
  // Basic truck information
  const [truckInfo, setTruckInfo] = useState({
    name: "",
    vin: "",
    licensePlate: "",
    eldDeviceId: "",
    equipmentType: "Dry Van",
    driverName: ""
  });

  // Integration preferences
  const [integrationOptions, setIntegrationOptions] = useState({
    loadBoardIntegration: "manual", // "integrated" or "manual"
    elogsIntegration: "manual", // "integrated" or "manual"
    preferredLoadBoard: "", // DAT, Truckstop, 123Loadboard
    elogsProvider: "" // Samsara, KeepTruckin, etc.
  });

  // Cost information
  const [costInfo, setCostInfo] = useState({
    truckPayment: "",
    trailerPayment: "",
    insurance: "",
    otherFixedCosts: "",
    driverPayPerMile: "",
    fuel: "",
    maintenance: "",
    otherVariableCosts: ""
  });

  const handleSubmit = async () => {
    if (!truckInfo.name.trim()) {
      toast({
        title: "Truck Name Required",
        description: "Please enter a name for the truck.",
        variant: "destructive",
      });
      return;
    }

    const totalFixedCosts = calculateCostTotals().totalFixedCosts;
    const totalVariableCosts = calculateCostTotals().totalVariableCosts;
    const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
    const costPerMile = calculateCostTotals().costPerMile;

    const truckData = {
      ...truckInfo,
      ...integrationOptions,
      fixedCosts: totalFixedCosts,
      variableCosts: totalVariableCosts,
      totalMiles: 0,
      isActive: 1,
      costBreakdown: {
        // Map simple inputs to detailed cost breakdown
        truckPayment: parseFloat(costInfo.truckPayment) || 0,
        trailerPayment: parseFloat(costInfo.trailerPayment) || 0,
        elogSubscription: 0,
        liabilityInsurance: parseFloat(costInfo.insurance) || 0,
        physicalInsurance: 0,
        cargoInsurance: 0,
        trailerInterchange: 0,
        bobtailInsurance: 0,
        nonTruckingLiability: 0,
        basePlateDeduction: 0,
        companyPhone: parseFloat(costInfo.otherFixedCosts) || 0,
        driverPay: ((parseFloat(costInfo.driverPayPerMile) || 0) / 100) * 3000,
        fuel: parseFloat(costInfo.fuel) || 0,
        maintenance: parseFloat(costInfo.maintenance) || 0,
        iftaTaxes: 0,
        tolls: 0,
        dwellTime: 0,
        reeferFuel: 0,
        truckParking: parseFloat(costInfo.otherVariableCosts) || 0,
        milesThisWeek: 3000,
        totalFixedCosts: totalFixedCosts,
        totalVariableCosts: totalVariableCosts,
        totalWeeklyCosts: totalWeeklyCosts,
        costPerMile: costPerMile,
        weekStarting: new Date().toISOString()
      }
    };

    try {
      await addTruck(truckData);
      toast({
        title: "Truck Added Successfully!",
        description: "Your truck has been added to the fleet with all cost details.",
      });
      setLocation("/truck-demo");
    } catch (error: any) {
      toast({
        title: "Failed to Add Truck",
        description: error.message || "There was an error adding the truck. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateCostTotals = () => {
    const truckPayment = parseFloat(costInfo.truckPayment) || 0;
    const trailerPayment = parseFloat(costInfo.trailerPayment) || 0;
    const insurance = parseFloat(costInfo.insurance) || 0;
    const otherFixedCosts = parseFloat(costInfo.otherFixedCosts) || 0;
    
    const driverPayPerMile = parseFloat(costInfo.driverPayPerMile) || 0;
    const driverPayWeekly = (driverPayPerMile / 100) * 3000; // Calculate weekly pay from cents per mile
    const fuel = parseFloat(costInfo.fuel) || 0;
    const maintenance = parseFloat(costInfo.maintenance) || 0;
    const otherVariableCosts = parseFloat(costInfo.otherVariableCosts) || 0;
    
    const totalFixedCosts = truckPayment + trailerPayment + insurance + otherFixedCosts;
    const totalVariableCosts = driverPayWeekly + fuel + maintenance + otherVariableCosts;
    const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
    const costPerMile = totalWeeklyCosts / 3000; // Based on 3000 miles per week standard
    
    return {
      totalFixedCosts,
      totalVariableCosts,
      totalWeeklyCosts,
      costPerMile
    };
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Truck className="h-6 w-6" />
                Step 1: Basic Truck Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                Let's start with the basic details of your truck
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="truckName" className="text-white text-sm font-medium">
                  What would you like to call this truck? *
                </Label>
                <Input
                  id="truckName"
                  value={truckInfo.name}
                  onChange={(e) => setTruckInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="e.g., Truck #001, Big Blue, etc."
                />
                <p className="text-xs text-slate-500">This is just a friendly name to identify your truck</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentType" className="text-white text-sm font-medium">
                  What type of trailer do you pull?
                </Label>
                <Select
                  value={truckInfo.equipmentType}
                  onValueChange={(value) => setTruckInfo(prev => ({ ...prev, equipmentType: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="Dry Van">Dry Van</SelectItem>
                    <SelectItem value="Reefer">Reefer (Refrigerated)</SelectItem>
                    <SelectItem value="Flatbed">Flatbed</SelectItem>
                    <SelectItem value="Step Deck">Step Deck</SelectItem>
                    <SelectItem value="Double Drop">Double Drop</SelectItem>
                    <SelectItem value="Tanker">Tanker</SelectItem>
                    <SelectItem value="Car Hauler">Car Hauler</SelectItem>
                    <SelectItem value="Lowboy">Lowboy</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">This helps match you with the right loads</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverName" className="text-white text-sm font-medium">
                  Driver Name (Optional)
                </Label>
                <Input
                  id="driverName"
                  value={truckInfo.driverName}
                  onChange={(e) => setTruckInfo(prev => ({ ...prev, driverName: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="e.g., John Smith"
                />
                <p className="text-xs text-slate-500">Name of the primary driver for this truck</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vin" className="text-white text-sm font-medium">VIN (Optional)</Label>
                  <Input
                    id="vin"
                    value={truckInfo.vin}
                    onChange={(e) => setTruckInfo(prev => ({ ...prev, vin: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="17-character VIN number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate" className="text-white text-sm font-medium">License Plate (Optional)</Label>
                  <Input
                    id="licensePlate"
                    value={truckInfo.licensePlate}
                    onChange={(e) => setTruckInfo(prev => ({ ...prev, licensePlate: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., ABC-123"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Zap className="h-6 w-6" />
                Step 2: Load Board Integration
              </CardTitle>
              <CardDescription className="text-slate-400">
                How would you like to manage finding loads for this truck?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>Load Board Integration</strong><br/>
                  Choose how you want to find loads - integrate with popular load boards for automatic matching, 
                  or input loads manually when you find them.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-white text-sm font-medium">Load Management Method</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        integrationOptions.loadBoardIntegration === 'integrated' 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                      onClick={() => setIntegrationOptions(prev => ({ ...prev, loadBoardIntegration: 'integrated' }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          integrationOptions.loadBoardIntegration === 'integrated' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-slate-400'
                        }`} />
                        <div>
                          <h3 className="text-white font-medium">Integrated Load Board</h3>
                          <p className="text-slate-400 text-sm">Automatically pull loads from major load boards</p>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        integrationOptions.loadBoardIntegration === 'manual' 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                      onClick={() => setIntegrationOptions(prev => ({ ...prev, loadBoardIntegration: 'manual' }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          integrationOptions.loadBoardIntegration === 'manual' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-slate-400'
                        }`} />
                        <div>
                          <h3 className="text-white font-medium">Manual Load Entry</h3>
                          <p className="text-slate-400 text-sm">I'll input loads manually as I find them</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {integrationOptions.loadBoardIntegration === 'integrated' && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Preferred Load Board</Label>
                    <Select
                      value={integrationOptions.preferredLoadBoard}
                      onValueChange={(value) => setIntegrationOptions(prev => ({ ...prev, preferredLoadBoard: value }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select your preferred load board" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="DAT">DAT Load Board</SelectItem>
                        <SelectItem value="Truckstop">Truckstop.com</SelectItem>
                        <SelectItem value="123Loadboard">123Loadboard</SelectItem>
                        <SelectItem value="SuperDispatch">Super Dispatch</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">You'll need API credentials for integration</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Truck className="h-6 w-6" />
                Step 3: Weekly Cost Breakdown
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter your weekly operating costs for accurate profitability tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>Cost Per Mile Calculation</strong><br/>
                  These costs will be used to calculate your cost per mile and help determine 
                  load profitability. Based on industry standard of 3,000 miles per week.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-medium text-lg mb-3">Fixed Costs (Weekly)</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Truck Payment</Label>
                    <Input
                      value={costInfo.truckPayment}
                      onChange={(e) => setCostInfo(prev => ({ ...prev, truckPayment: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="800"
                      type="number"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">Weekly truck payment or lease</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Trailer Payment</Label>
                    <Input
                      value={costInfo.trailerPayment}
                      onChange={(e) => setCostInfo(prev => ({ ...prev, trailerPayment: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="200"
                      type="number"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">Weekly trailer payment or lease</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Insurance (Total Weekly)</Label>
                    <Input
                      value={costInfo.insurance}
                      onChange={(e) => setCostInfo(prev => ({ ...prev, insurance: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="300"
                      type="number"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">All insurance costs per week</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Other Fixed Costs</Label>
                    <Input
                      value={costInfo.otherFixedCosts}
                      onChange={(e) => setCostInfo(prev => ({ ...prev, otherFixedCosts: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="150"
                      type="number"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">ELD subscription, phone, etc.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-medium text-lg mb-3">Variable Costs (Weekly)</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Driver Pay (cents per mile)</Label>
                    <Input
                      value={costInfo.driverPayPerMile}
                      onChange={(e) => setCostInfo(prev => ({ ...prev, driverPayPerMile: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="65"
                      type="number"
                      step="0.1"
                    />
                    <p className="text-xs text-slate-500">
                      Weekly: ${(((parseFloat(costInfo.driverPayPerMile) || 0) / 100) * 3000).toFixed(2)} @ 3,000 miles
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Fuel (Weekly)</Label>
                    <Input
                      value={costInfo.fuel}
                      onChange={(e) => setCostInfo(prev => ({ ...prev, fuel: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="1200"
                      type="number"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">Typical: $1,000-$1,500/week</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Maintenance (Weekly)</Label>
                    <Input
                      value={costInfo.maintenance}
                      onChange={(e) => setCostInfo(prev => ({ ...prev, maintenance: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="200"
                      type="number"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">Repairs, parts, scheduled maintenance</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Other Variable Costs</Label>
                    <Input
                      value={costInfo.otherVariableCosts}
                      onChange={(e) => setCostInfo(prev => ({ ...prev, otherVariableCosts: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="150"
                      type="number"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">Permits, tolls, parking, etc.</p>
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-slate-400 text-sm">Total Fixed Costs</p>
                    <p className="text-white font-bold text-xl">
                      ${calculateCostTotals().totalFixedCosts.toFixed(2)}/week
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Variable Costs</p>
                    <p className="text-white font-bold text-xl">
                      ${calculateCostTotals().totalVariableCosts.toFixed(2)}/week
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Cost Per Mile</p>
                    <p className="text-green-400 font-bold text-xl">
                      ${calculateCostTotals().costPerMile.toFixed(3)}/mile
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                Step 4: ELogs Integration
              </CardTitle>
              <CardDescription className="text-slate-400">
                How would you like to track Hours of Service (HOS) for this truck?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-200 text-sm">
                  <strong>Electronic Logs Integration</strong><br/>
                  Electronic Logging Devices (ELDs) are required for DOT compliance. Choose to integrate 
                  automatically or enter HOS data manually.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-white text-sm font-medium">HOS Management Method</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        integrationOptions.elogsIntegration === 'integrated' 
                          ? 'border-green-500 bg-green-900/20' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                      onClick={() => setIntegrationOptions(prev => ({ ...prev, elogsIntegration: 'integrated' }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          integrationOptions.elogsIntegration === 'integrated' 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-slate-400'
                        }`} />
                        <div>
                          <h3 className="text-white font-medium">Integrated ELD System</h3>
                          <p className="text-slate-400 text-sm">Automatically sync with your ELD provider</p>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        integrationOptions.elogsIntegration === 'manual' 
                          ? 'border-green-500 bg-green-900/20' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                      onClick={() => setIntegrationOptions(prev => ({ ...prev, elogsIntegration: 'manual' }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          integrationOptions.elogsIntegration === 'manual' 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-slate-400'
                        }`} />
                        <div>
                          <h3 className="text-white font-medium">Manual HOS Entry</h3>
                          <p className="text-slate-400 text-sm">I'll input HOS data manually</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {integrationOptions.elogsIntegration === 'integrated' && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">ELD Provider</Label>
                    <Select
                      value={integrationOptions.elogsProvider}
                      onValueChange={(value) => setIntegrationOptions(prev => ({ ...prev, elogsProvider: value }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select your ELD provider" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="Samsara">Samsara</SelectItem>
                        <SelectItem value="KeepTruckin">KeepTruckin (Motive)</SelectItem>
                        <SelectItem value="Garmin">Garmin eLog</SelectItem>
                        <SelectItem value="BigRoad">BigRoad</SelectItem>
                        <SelectItem value="FleetUp">FleetUp</SelectItem>
                        <SelectItem value="VDO">VDO RoadLog</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">You'll need API credentials for integration</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Setup Complete</p>
                    <p className="text-slate-400 text-sm">
                      Your truck will be added to the fleet with complete cost breakdown and integration preferences. 
                      You'll be directed to the truck profile to view all details.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <NavigationLayout currentPath="/add-truck">
      {/* Cost Guide Modal */}
      <TruckCostGuide
        isOpen={showCostGuide}
        onClose={() => setShowCostGuide(false)}
        onProceed={() => {
          setShowCostGuide(false);
          toast({
            title: "Cost Guide Complete",
            description: "Now proceeding with truck setup. Remember to enter accurate cost data!",
          });
        }}
      />
      
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-slate-300 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Add New Truck</h1>
                <p className="text-slate-400">
                  Let's add your truck to the fleet and set up integration preferences
                </p>
              </div>
              <Button
                onClick={() => setShowCostGuide(true)}
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
              >
                <Info className="h-4 w-4 mr-2" />
                Cost Setup Guide
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-slate-400">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>

          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={addTruck.isLoading}
                className="bg-green-600 hover:bg-green-700 text-white relative z-[10001] pointer-events-auto"
                style={{ position: 'relative', zIndex: 10001 }}
              >
                {addTruck.isLoading ? (
                  "Adding Truck..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add Truck to Fleet
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </NavigationLayout>
  );
}