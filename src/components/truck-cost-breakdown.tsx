import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Truck, Calculator, DollarSign, TrendingUp, TrendingDown, Edit3, Save, X, Plus, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import type { Truck as TruckType, TruckCostBreakdown } from "@shared/schema";

interface TruckCostBreakdownProps {
  selectedTruckId?: string;
}

export function TruckCostBreakdown({ selectedTruckId }: TruckCostBreakdownProps) {
  const [selectedTruck, setSelectedTruck] = useState<string>(selectedTruckId || "");
  const [editValues, setEditValues] = useState<Partial<TruckCostBreakdown>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { useDemoQuery } = useDemoApi();

  const { data: trucks = [] } = useDemoQuery(
    ["/api/trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: costBreakdowns = [], isLoading } = useDemoQuery(
    [`/api/trucks/${selectedTruck}/cost-breakdowns`],
    `/api/trucks/${selectedTruck}/cost-breakdowns`,
    {
      enabled: !!selectedTruck,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const latestBreakdown = costBreakdowns[0]; // Already sorted by week starting desc

  const updateCostMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TruckCostBreakdown> }) =>
      apiRequest(`/api/cost-breakdowns/${id}`, "PUT", data),
    ...createSynchronizedMutation(queryClient, 'cost', selectedTruck),
    onSuccess: () => {
      toast({
        title: "Cost Data Updated",
        description: "Changes synchronized across all tabs and calculations.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not save cost breakdown changes.",
        variant: "destructive",
      });
    },
  });

  const createCostMutation = useMutation({
    mutationFn: (data: Partial<TruckCostBreakdown>) => {
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

      return apiRequest(`/api/trucks/${selectedTruck}/cost-breakdown`, "POST", {
        ...data,
        truckId: selectedTruck,
        weekStarting: currentWeekStart,
        weekEnding: currentWeekEnd,
      });
    },
    ...createSynchronizedMutation(queryClient, 'cost', selectedTruck),
    onSuccess: () => {
      // Invalidate all related queries for cross-tab synchronization
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${selectedTruck}/cost-breakdowns`] });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] }); // Fleet overview & Load Calculator
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] }); // Dashboard metrics
      queryClient.invalidateQueries({ queryKey: ["/api/fleet-summary"] }); // Fleet summary tab
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-overview"] }); // HOS dashboard
      toast({
        title: "Cost Breakdown Created",
        description: "New cost data available across all tabs and calculations.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Could not create cost breakdown.",
        variant: "destructive",
      });
    },
  });

  // Initialize with existing data or default values
  useEffect(() => {
    if (latestBreakdown) {
      setEditValues(latestBreakdown);
    } else {
      // Reset to default values for new entry
      setEditValues({
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
        companyPhone: 0,
        driverPay: 0,
        fuel: 0,
        defFluid: 0,
        maintenance: 0,
        iftaTaxes: 0,
        tolls: 0,
        dwellTime: 0,
        reeferFuel: 0,
        truckParking: 0,
        milesThisWeek: 3000,
      });
    }
  }, [latestBreakdown]);



  const handleSave = () => {
    if (latestBreakdown) {
      updateCostMutation.mutate({ id: latestBreakdown.id, data: editValues });
    } else {
      createCostMutation.mutate(editValues);
    }
  };



  const updateValue = (field: keyof TruckCostBreakdown, value: string) => {
    // Allow empty string or any valid number input, don't force conversion to 0
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setEditValues(prev => ({ ...prev, [field]: numValue }));
  };

  const calculateTotalFixed = () => {
    const values = editValues;
    return (values.truckPayment || 0) + 
           (values.trailerPayment || 0) + 
           (values.elogSubscription || 0) + 
           (values.liabilityInsurance || 0) + 
           (values.physicalInsurance || 0) + 
           (values.cargoInsurance || 0) + 
           (values.trailerInterchange || 0) + 
           (values.bobtailInsurance || 0) + 
           (values.nonTruckingLiability || 0) +
           (values.basePlateDeduction || 0) +
           (values.companyPhone || 0);
  };

  const calculateTotalVariable = () => {
    const values = editValues;
    return (values.driverPay || 0) + 
           (values.fuel || 0) + 
           (values.defFluid || 0) + 
           (values.maintenance || 0) + 
           (values.tolls || 0) + 
           (values.dwellTime || 0) +
           (values.reeferFuel || 0) +
           (values.truckParking || 0);
  };

  const calculateCostPerMile = () => {
    const totalCosts = calculateTotalFixed() + calculateTotalVariable();
    // Use actual total miles driven (including deadhead) for accurate cost per mile
    const totalMiles = editValues.totalMilesWithDeadhead || editValues.milesThisWeek || 3000;
    return (totalCosts / totalMiles).toFixed(3);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const EditableField = ({ 
    label, 
    field, 
    value, 
    isEditing 
  }: { 
    label: string; 
    field: keyof TruckCostBreakdown; 
    value: number; 
    isEditing: boolean; 
  }) => (
    <div className="flex justify-between items-center py-2">
      <Label className="text-gray-300">{label}</Label>
      {isEditing ? (
        <Input
          type="number"
          value={value || 0}
          onChange={(e) => updateValue(field, e.target.value)}
          className="w-24 text-right bg-[var(--dark-elevated)] border-gray-600 text-white"
          step="0.01"
        />
      ) : (
        <span className="font-medium text-white">{formatCurrency(value || 0)}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Truck Selection */}
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[var(--primary-blue)]" />
            Weekly Cost Breakdown
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter total dollar amounts for all weekly costs. Cost-per-mile calculated using actual miles driven including deadhead miles for accurate profitability analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <Label className="text-gray-300">Select Truck</Label>
              <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                <SelectTrigger className="bg-[var(--dark-elevated)] border-gray-600 text-white">
                  <SelectValue placeholder="Choose a truck" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--dark-elevated)] border-gray-600">
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id} className="text-white">
                      {truck.name} ({truck.equipmentType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTruck && !isLoading && (
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={updateCostMutation.isPending || createCostMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTruck && isLoading && (
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-6">
            <div className="text-center text-gray-400">Loading cost breakdown...</div>
          </CardContent>
        </Card>
      )}

      {selectedTruck && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fixed Costs */}
          <Card className="bg-[var(--dark-card)] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                Fixed Costs (Weekly)
              </CardTitle>
              <CardDescription className="text-gray-400">
                Consistent weekly expenses regardless of miles driven
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <p className="text-sm text-blue-300 font-medium">
                  Manual Entry Required: Please enter all cost amounts manually. No automatic calculations will be applied.
                </p>
              </div>
              <EditableField
                label="Truck Payment"
                field="truckPayment"
                value={editValues.truckPayment || 0}
                isEditing={true}
              />
              <EditableField
                label="Trailer Payment"
                field="trailerPayment"
                value={editValues.trailerPayment || 0}
                isEditing={true}
              />
              <EditableField
                label="E-log Subscription"
                field="elogSubscription"
                value={editValues.elogSubscription || 0}
                isEditing={true}
              />
              <EditableField
                label="Liability Insurance"
                field="liabilityInsurance"
                value={editValues.liabilityInsurance || 0}
                isEditing={true}
              />
              <EditableField
                label="Physical Insurance"
                field="physicalInsurance"
                value={editValues.physicalInsurance || 0}
                isEditing={true}
              />
              <EditableField
                label="Cargo Insurance"
                field="cargoInsurance"
                value={editValues.cargoInsurance || 0}
                isEditing={true}
              />
              <EditableField
                label="Trailer Interchange"
                field="trailerInterchange"
                value={editValues.trailerInterchange || 0}
                isEditing={true}
              />
              <EditableField
                label="Bobtail Insurance"
                field="bobtailInsurance"
                value={editValues.bobtailInsurance || 0}
                isEditing={true}
              />
              <EditableField
                label="Non-Trucking Liability"
                field="nonTruckingLiability"
                value={editValues.nonTruckingLiability || 0}
                isEditing={true}
              />
              <EditableField
                label="Base Plate Deduction"
                field="basePlateDeduction"
                value={editValues.basePlateDeduction || 0}
                isEditing={true}
              />
              <EditableField
                label="Company Phone"
                field="companyPhone"
                value={editValues.companyPhone || 0}
                isEditing={true}
              />
              
              <Separator className="my-4 bg-gray-600" />
              <div className="flex justify-between items-center py-2 font-semibold text-lg">
                <span className="text-blue-400">Total Fixed Costs</span>
                <span className="text-white">{formatCurrency(calculateTotalFixed())}</span>
              </div>
            </CardContent>
          </Card>

          {/* Variable Costs */}
          <Card className="bg-[var(--dark-card)] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Variable Costs (Weekly)
              </CardTitle>
              <CardDescription className="text-gray-400">
                Costs that vary based on miles driven and operational activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <EditableField
                label="Driver Pay"
                field="driverPay"
                value={editValues.driverPay || 0}
                isEditing={true}
              />
              <EditableField
                label="Diesel Fuel"
                field="fuel"
                value={editValues.fuel || 0}
                isEditing={true}
              />
              <EditableField
                label="DEF Fluid"
                field="defFluid"
                value={editValues.defFluid || 0}
                isEditing={true}
              />
              <EditableField
                label="Maintenance"
                field="maintenance"
                value={editValues.maintenance || 0}
                isEditing={true}
              />

              <EditableField
                label="Tolls"
                field="tolls"
                value={editValues.tolls || 0}
                isEditing={true}
              />
              <EditableField
                label="Dwell Time (>2 hrs)"
                field="dwellTime"
                value={editValues.dwellTime || 0}
                isEditing={true}
              />
              <EditableField
                label="Reefer Fuel (for reefer trucks)"
                field="reeferFuel"
                value={editValues.reeferFuel || 0}
                isEditing={true}
              />
              <EditableField
                label="Truck Parking"
                field="truckParking"
                value={editValues.truckParking || 0}
                isEditing={true}
              />
              
              {/* Miles Input - Show Total Miles with Deadhead */}
              <div className="flex justify-between items-center py-2 border-t border-gray-600 mt-4 pt-4">
                <Label className="text-gray-300">Total Miles Driven (incl. deadhead)</Label>
                <div className="flex flex-col items-end">
                  <div className="text-white font-semibold">
                    {editValues.totalMilesWithDeadhead || editValues.milesThisWeek || 0} miles
                  </div>
                  <div className="text-xs text-gray-400">
                    {editValues.milesThisWeek || 0} revenue + {(editValues.totalMilesWithDeadhead || 0) - (editValues.milesThisWeek || 0)} deadhead
                  </div>
                </div>
              </div>
              
              <Separator className="my-4 bg-gray-600" />
              <div className="flex justify-between items-center py-2 font-semibold text-lg">
                <span className="text-green-400">Total Variable Costs</span>
                <span className="text-white">{formatCurrency(calculateTotalVariable())}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Card */}
      {selectedTruck && !isLoading && (
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--primary-blue)]" />
              Cost Summary

            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(calculateTotalFixed())}
                </div>
                <div className="text-sm text-gray-400">Fixed Costs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(calculateTotalVariable())}
                </div>
                <div className="text-sm text-gray-400">Variable Costs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(calculateTotalFixed() + calculateTotalVariable())}
                </div>
                <div className="text-sm text-gray-400">Total Weekly Costs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--primary-blue)]">
                  ${calculateCostPerMile()}
                </div>
                <div className="text-sm text-gray-400">
                  Cost Per Mile ({editValues.totalMilesWithDeadhead || editValues.milesThisWeek || 3000}mi total)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTruck && !isLoading && !latestBreakdown && (
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              No cost breakdown found for {trucks.find(t => t.id === selectedTruck)?.name}
            </div>
            <div className="text-sm text-gray-300">
              Select a truck above to start entering weekly cost data.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Breakdowns */}
      {selectedTruck && !isLoading && costBreakdowns.length > 1 && (
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Cost History</CardTitle>
            <CardDescription className="text-gray-400">
              Previous weekly cost breakdowns for tracking trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costBreakdowns.slice(1).map((breakdown) => (
                <div
                  key={breakdown.id}
                  className="flex items-center justify-between p-4 bg-[var(--dark-elevated)] rounded-lg"
                >
                  <div>
                    <div className="text-white font-medium">
                      Week of {formatDate(breakdown.weekStarting)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {breakdown.totalMilesWithDeadhead || breakdown.milesThisWeek} miles driven • {formatCurrency(breakdown.totalWeeklyCosts || 0)} total costs
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      ${breakdown.costPerMile?.toFixed(2) || "0.00"}/mi
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                      {formatDate(breakdown.weekStarting)} - {formatDate(breakdown.weekEnding)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}