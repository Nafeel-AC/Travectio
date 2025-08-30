import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Truck, DollarSign, Calculator, Info } from "lucide-react";

interface AddTruckDialogProps {
  trigger?: React.ReactNode;
}

export default function AddTruckDialog({ trigger }: AddTruckDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  
  // Basic truck information
  const [truckInfo, setTruckInfo] = useState({
    name: "",
    vin: "",
    licensePlate: "",
    eldDeviceId: "",
    equipmentType: "Dry Van"
  });

  // Fixed costs (weekly basis)
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

  // Variable costs (weekly basis)
  const [variableCosts, setVariableCosts] = useState({
    driverPay: 0,
    fuel: 0,
    maintenance: 0,
    iftaTaxes: 0,
    tolls: 0,
    dwellTime: 0,
    reeferFuel: 0,
    truckParking: 0
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
      console.log('[AddTruckDialog] ====== MUTATION FUNCTION STARTED ======');
      console.log('[AddTruckDialog] Attempting to add truck:', truckData);
      
      try {
        // Direct fetch to bypass any authentication issues
        const response = await fetch('/api/trucks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(truckData),
          credentials: 'include',
        });
        
        console.log('[AddTruckDialog] Response received, status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AddTruckDialog] Error response:', errorText);
          const error = new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
          console.error('[AddTruckDialog] Throwing error:', error);
          throw error;
        }
        
        console.log('[AddTruckDialog] Response OK, parsing JSON...');
        const result = await response.json();
        console.log('[AddTruckDialog] JSON parsed successfully:', result);
        console.log('[AddTruckDialog] ====== MUTATION FUNCTION RETURNING ======');
        return result;
      } catch (error) {
        console.error('[AddTruckDialog] ====== MUTATION FUNCTION ERROR ======');
        console.error('[AddTruckDialog] Caught error in mutationFn:', error);
        console.error('[AddTruckDialog] Error type:', typeof error);
        console.error('[AddTruckDialog] Error message:', (error as Error)?.message);
        console.error('[AddTruckDialog] ==========================================');
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[AddTruckDialog] ====== SUCCESS HANDLER CALLED ======');
      console.log('[AddTruckDialog] Mutation succeeded with data:', data);
      try {
        console.log('[AddTruckDialog] Showing success toast...');
        toast({
          title: "Truck Added Successfully",
          description: "The new truck has been added to your fleet with all cost details.",
        });
        
        console.log('[AddTruckDialog] Invalidating queries...');
        queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
        
        console.log('[AddTruckDialog] Closing dialog and resetting form...');
        setOpen(false);
        resetForm();
        console.log('[AddTruckDialog] Success handler completed successfully');
        console.log('[AddTruckDialog] =====================================');
      } catch (error) {
        console.error('[AddTruckDialog] Error in success handler:', error);
        console.error('[AddTruckDialog] =====================================');
      }
    },
    onError: (error) => {
      console.error('[AddTruckDialog] ====== MUTATION ERROR DETECTED ======');
      console.error('[AddTruckDialog] Mutation error:', error);
      console.error('[AddTruckDialog] Error type:', typeof error);
      console.error('[AddTruckDialog] Error message:', error?.message);
      console.error('[AddTruckDialog] Error stack:', (error as Error)?.stack);
      console.error('[AddTruckDialog] Full error object:', JSON.stringify(error, null, 2));
      console.error('[AddTruckDialog] ========================================');
      
      // Don't show error toast for now - let's see what the actual error is
      // if (isUnauthorizedError(error as Error)) {
      //   console.log('[AddTruckDialog] Detected unauthorized error, redirecting to login...');
      //   toast({
      //     title: "Unauthorized",
      //     description: "You are logged out. Logging in again...",
      //     variant: "destructive",
      //   });
      //   setTimeout(() => {
      //     window.location.href = "/api/login";
      //   }, 500);
      //   return;
      // }
      
      // console.log('[AddTruckDialog] Showing general error toast...');
      // toast({
      //   title: "Failed to Add Truck",
      //   description: (error as Error)?.message || "There was an error adding the truck. Please try again.",
      //   variant: "destructive",
      // });
    },
  });

  const resetForm = () => {
    setTruckInfo({
      name: "",
      vin: "",
      licensePlate: "",
      eldDeviceId: "",
      equipmentType: "Dry Van"
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
      driverPay: 0,
      fuel: 0,
      maintenance: 0,
      iftaTaxes: 0,
      tolls: 0,
      dwellTime: 0,
      reeferFuel: 0,
      truckParking: 0
    });
  };

  const handleSubmit = () => {
    console.log('[AddTruckDialog] ====== HANDLE SUBMIT CALLED ======');
    
    if (!truckInfo.name.trim()) {
      console.log('[AddTruckDialog] Truck name validation failed');
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

    console.log('[AddTruckDialog] Truck data prepared:', truckData);
    console.log('[AddTruckDialog] Calling mutation.mutate...');
    console.log('[AddTruckDialog] Mutation status before call:', {
      isIdle: addTruckMutation.isIdle,
      isPending: addTruckMutation.isPending,
      isError: addTruckMutation.isError,
      isSuccess: addTruckMutation.isSuccess
    });
    
    addTruckMutation.mutate(truckData);
    
    console.log('[AddTruckDialog] Mutation.mutate called');
    console.log('[AddTruckDialog] Mutation status after call:', {
      isIdle: addTruckMutation.isIdle,
      isPending: addTruckMutation.isPending,
      isError: addTruckMutation.isError,
      isSuccess: addTruckMutation.isSuccess
    });
    console.log('[AddTruckDialog] =====================================');
  };

  const handleFixedCostChange = (field: keyof typeof fixedCosts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFixedCosts(prev => ({ ...prev, [field]: value }));
  };

  const handleVariableCostChange = (field: keyof typeof variableCosts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setVariableCosts(prev => ({ ...prev, [field]: value }));
  };

  console.log('[AddTruckDialog] Component rendering, mutation state:', {
    isIdle: addTruckMutation.isIdle,
    isPending: addTruckMutation.isPending,
    isError: addTruckMutation.isError,
    isSuccess: addTruckMutation.isSuccess,
    dialogOpen: open
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 relative z-[10000]">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                console.log('[AddTruckDialog] ====== BUTTON CLICK DETECTED ======');
                console.log('[AddTruckDialog] Click event:', e);
                console.log('[AddTruckDialog] Event type:', e.type);
                console.log('[AddTruckDialog] Button disabled state:', addTruckMutation.isPending);
                console.log('[AddTruckDialog] About to call handleSubmit...');
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
                console.log('[AddTruckDialog] handleSubmit called from button click');
                console.log('[AddTruckDialog] ==============================================');
              }}
              disabled={addTruckMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white relative z-[10001] pointer-events-auto"
              style={{ position: 'relative', zIndex: 10001 }}
            >
              {addTruckMutation.isPending ? "Adding Truck..." : "Add Truck to Fleet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}