import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTrucks } from "@/hooks/useSupabase";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Plus, Truck, DollarSign, Calculator, Info, AlertCircle, Lock } from "lucide-react";

interface AddTruckDialogProps {
  trigger?: React.ReactNode;
}

export default function AddTruckDialog({ trigger }: AddTruckDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { canAddTrucks, isSubscribed, truckLimit, currentTruckCount, remainingTrucks } = useSubscriptionLimits();
  const [truckInfo, setTruckInfo] = useState({
    name: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    licensePlate: "",
    capacity: "",
    fuelType: "diesel",
    equipmentType: "Dry Van",
    eldDeviceId: "",
    mpg: 6.5
  });

  const [fixedCosts, setFixedCosts] = useState({
    truckPayment: 0,
    trailerPayment: 0,
    elogSubscription: 0,
    liabilityInsurance: 0,
    physicalInsurance: 0,
    cargoInsurance: 0,
    trailerInterchange: 0,
    bobtailInsurance: 0,
    nonTruckingLiability: 0,
    basePlateDeduction: 0,
    companyPhone: 0
  });

  const [variableCosts, setVariableCosts] = useState({
    fuel: 0,
    maintenance: 0,
    tires: 0,
    permits: 0,
    tolls: 0,
    dwellTime: 0,
    reeferFuel: 0,
    truckParking: 0,
    driverPay: 0,
    iftaTaxes: 0
  });
  
  const { createTruck } = useTrucks();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check subscription limits
    if (!isSubscribed) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to add trucks. Please subscribe to a plan first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!canAddTrucks) {
      toast({
        title: "Truck Limit Reached",
        description: `You have reached your truck limit of ${truckLimit}. Please upgrade your subscription to add more trucks.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Calculate total costs for database
      const totalFixedCosts = calculateTotalFixedCosts();
      const totalVariableCosts = calculateTotalVariableCosts();
      
      // Prepare truck data with all fields
      const truckData = {
        ...truckInfo,
        name: (truckInfo.name || '').trim(),
        fixedCosts: totalFixedCosts,
        variableCosts: totalVariableCosts,
        totalMiles: 0, // New trucks start with 0 miles
        status: 'active',
        mpg: truckInfo.mpg
      };
      
      await createTruck(truckData);
      toast({
        title: "Success",
        description: "Truck added successfully!",
      });
      setIsOpen(false);
      
      // Reset all form data
      setTruckInfo({
        name: "",
        make: "",
        model: "",
        year: "",
        vin: "",
        licensePlate: "",
        capacity: "",
        fuelType: "diesel",
        equipmentType: "Dry Van",
        eldDeviceId: "",
        mpg: 6.5
      });
      setFixedCosts({
        truckPayment: 0,
        trailerPayment: 0,
        elogSubscription: 0,
        liabilityInsurance: 0,
        physicalInsurance: 0,
        cargoInsurance: 0,
        trailerInterchange: 0,
        bobtailInsurance: 0,
        nonTruckingLiability: 0,
        basePlateDeduction: 0,
        companyPhone: 0
      });
      setVariableCosts({
        fuel: 0,
        maintenance: 0,
        tires: 0,
        permits: 0,
        tolls: 0,
        dwellTime: 0,
        reeferFuel: 0,
        truckParking: 0,
        driverPay: 0,
        iftaTaxes: 0
      });
    } catch (error: any) {
      toast({
        title: "Failed to Add Truck",
        description: error.message || "Failed to add truck",
        variant: "destructive",
      });
    }
  };

  const handleFixedCostChange = (field: keyof typeof fixedCosts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFixedCosts(prev => ({ ...prev, [field]: value }));
  };

  const handleVariableCostChange = (field: keyof typeof variableCosts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setVariableCosts(prev => ({ ...prev, [field]: value }));
  };

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
    const weeklyMiles = 3000; // Default assumption
    return weeklyMiles > 0 ? calculateTotalWeeklyCosts() / weeklyMiles : 0;
  };

  console.log('[AddTruckDialog] Component rendering, dialog open:', isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add New Truck
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Add New Truck to Fleet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Truck Information */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Basic Information</CardTitle>
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
                <div className="space-y-2">
                  <Label htmlFor="mpg" className="text-white">MPG (Miles Per Gallon)</Label>
                  <Input
                    id="mpg"
                    type="number"
                    step="0.1"
                    value={truckInfo.mpg}
                    onChange={(e) => setTruckInfo(prev => ({ ...prev, mpg: parseFloat(e.target.value) || 6.5 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="6.5"
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
                Fixed Costs (Weekly)
              </CardTitle>
              <CardDescription className="text-slate-400">
                These costs remain the same regardless of miles driven
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Trailer Interchange</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.trailerInterchange}
                    onChange={handleFixedCostChange("trailerInterchange")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Bobtail Insurance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.bobtailInsurance}
                    onChange={handleFixedCostChange("bobtailInsurance")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Non-Trucking Liability</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.nonTruckingLiability}
                    onChange={handleFixedCostChange("nonTruckingLiability")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Base Plate Deduction</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.basePlateDeduction}
                    onChange={handleFixedCostChange("basePlateDeduction")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Company Phone</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCosts.companyPhone}
                    onChange={handleFixedCostChange("companyPhone")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="0.00"
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
                Variable Costs (Weekly)
              </CardTitle>
              <CardDescription className="text-slate-400">
                These costs change based on miles driven and operational activities
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Dwell Time Charges</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variableCosts.dwellTime}
                    onChange={handleVariableCostChange("dwellTime")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Reefer Fuel</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variableCosts.reeferFuel}
                    onChange={handleVariableCostChange("reeferFuel")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                Cost Summary
              </CardTitle>
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
            </CardContent>
          </Card>

          {/* Subscription Status */}
          {!isSubscribed ? (
            <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-orange-400" />
                <span className="font-medium text-orange-400">Subscription Required</span>
              </div>
              <p className="text-sm text-slate-300 mb-3">
                You need an active subscription to add trucks to your fleet.
              </p>
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                View Subscription Plans
              </Button>
            </div>
          ) : !canAddTrucks ? (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="font-medium text-red-400">Truck Limit Reached</span>
              </div>
              <p className="text-sm text-slate-300 mb-3">
                You have reached your truck limit of {truckLimit} trucks. Upgrade your subscription to add more trucks.
              </p>
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Upgrade Subscription
              </Button>
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="font-medium text-green-400">Ready to Add Truck</span>
              </div>
              <p className="text-sm text-slate-300">
                You can add {remainingTrucks} more truck{remainingTrucks !== 1 ? 's' : ''} to your fleet.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 relative z-[10000]">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isSubscribed || !canAddTrucks}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isSubscribed ? 'Subscription Required' : !canAddTrucks ? 'Truck Limit Reached' : 'Add Truck to Fleet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}