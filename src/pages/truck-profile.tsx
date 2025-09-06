import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Truck, DollarSign, Fuel, Wrench, Edit, Save, X, Trash2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TruckService } from "@/lib/supabase-client";
import { DriverAssignmentSelect } from "@/components/driver-assignment-select";

export default function TruckProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCosts, setEditedCosts] = useState<any>({});
  const [isEditingTruckInfo, setIsEditingTruckInfo] = useState(false);
  const [editedTruckInfo, setEditedTruckInfo] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch truck data using TruckService
  const { data: truck, isLoading } = useQuery({
    queryKey: ['truck', id],
    queryFn: async () => {
      console.log('Fetching truck with ID:', id);
      const result = await TruckService.getTruck(id!);
      console.log('Truck data received:', result);
      return result;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Fetch cost breakdown data
  const { data: costBreakdown, isLoading: costBreakdownLoading } = useQuery({
    queryKey: ['truck-cost-breakdown', id],
    queryFn: () => TruckService.getLatestCostBreakdown(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const updateTruckMutation = useMutation({
    mutationFn: async (updatedTruckInfo: any) => {
      console.log('Updating truck with data:', updatedTruckInfo);
      // If we're updating the driver assignment, use the special method
      if ('currentDriverId' in updatedTruckInfo) {
        console.log('Using assignDriverToTruck method');
        const result = await TruckService.assignDriverToTruck(id!, updatedTruckInfo.currentDriverId);
        console.log('Driver assignment result:', result);
        return result;
      }
      // Otherwise use the regular update method
      console.log('Using regular updateTruck method');
      return await TruckService.updateTruck(id!, updatedTruckInfo);
    },
    onSuccess: (data) => {
      console.log('Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['truck', id] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: "Success",
        description: "Truck information updated successfully",
      });
      setIsEditingTruckInfo(false);
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update truck information",
        variant: "destructive",
      });
    },
  });

  const createCostBreakdownMutation = useMutation({
    mutationFn: async (costData: any) => {
      // Calculate new totals
      const standardWeeklyMiles = 3000;
      // Convert driver pay per mile (cents) to weekly dollars at 3000 miles
      const driverPayWeekly = costData.driverPayPerMile ? (costData.driverPayPerMile / 100) * 3000 : 0;
      
      const totalFixedCosts = Object.entries(costData)
        .filter(([key]) => ['truckPayment', 'trailerPayment', 'elogSubscription', 'liabilityInsurance', 
                           'physicalInsurance', 'cargoInsurance', 'trailerInterchange', 'bobtailInsurance',
                           'nonTruckingLiability', 'basePlateDeduction', 'companyPhone'].includes(key))
        .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
      
      const totalVariableCosts = driverPayWeekly + Object.entries(costData)
        .filter(([key]) => ['fuel', 'maintenance', 'tolls', 'dwellTime', 'reeferFuel', 'truckParking'].includes(key))
        .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
      
      const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
      const costPerMile = totalWeeklyCosts / standardWeeklyMiles;

      // Remove driverPayPerMile and add driverPay (weekly amount)
      const { driverPayPerMile, ...costsWithoutDriverPay } = costData;
      
      const breakdownData = {
        ...costsWithoutDriverPay,
        driverPay: driverPayWeekly, // Convert to weekly amount
        totalFixedCosts,
        totalVariableCosts,
        totalWeeklyCosts,
        costPerMile,
        weekStarting: new Date().toISOString().slice(0, 10),
        weekEnding: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        milesThisWeek: 3000
      };

      // Create cost breakdown
      const newBreakdown = await TruckService.createCostBreakdown(id!, breakdownData);

      // Also update the truck's summary costs and cost per mile
      await TruckService.updateTruck(id!, {
        fixedCosts: totalFixedCosts,
        variableCosts: totalVariableCosts,
        costPerMile: costPerMile
      });

      return newBreakdown;
    },
    onSuccess: () => {
      toast({
        title: "Cost breakdown created",
        description: "Your truck costs have been saved successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['truck-cost-breakdown', id] });
      queryClient.invalidateQueries({ queryKey: ['truck', id] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: "Could not create cost breakdown. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCostsMutation = useMutation({
    mutationFn: async (updatedCosts: any) => {
      if (!costBreakdown?.id) throw new Error('No cost breakdown to update');
      
      // Calculate new totals
      const standardWeeklyMiles = 3000;
      // Convert driver pay per mile (cents) to weekly dollars at 3000 miles
      const driverPayWeekly = updatedCosts.driverPayPerMile ? (updatedCosts.driverPayPerMile / 100) * 3000 : 0;
      
      const totalFixedCosts = Object.entries(updatedCosts)
        .filter(([key]) => ['truckPayment', 'trailerPayment', 'elogSubscription', 'liabilityInsurance', 
                           'physicalInsurance', 'cargoInsurance', 'trailerInterchange', 'bobtailInsurance',
                           'nonTruckingLiability', 'basePlateDeduction', 'companyPhone'].includes(key))
        .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
      
      const totalVariableCosts = driverPayWeekly + Object.entries(updatedCosts)
        .filter(([key]) => ['fuel', 'maintenance', 'tolls', 'dwellTime', 'reeferFuel', 'truckParking'].includes(key))
        .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
      
      const totalWeeklyCosts = totalFixedCosts + totalVariableCosts;
      const costPerMile = totalWeeklyCosts / standardWeeklyMiles;

      // Remove driverPayPerMile and add driverPay (weekly amount)
      const { driverPayPerMile, ...costsWithoutDriverPay } = updatedCosts;
      
      const updateData = {
        ...costsWithoutDriverPay,
        driverPay: driverPayWeekly, // Convert to weekly amount
        totalFixedCosts,
        totalVariableCosts,
        totalWeeklyCosts,
        costPerMile
      };

      // Update cost breakdown
      await TruckService.updateCostBreakdown(costBreakdown.id, updateData);

      // Also update the truck's summary costs and cost per mile
      await TruckService.updateTruck(id!, {
        fixedCosts: totalFixedCosts,
        variableCosts: totalVariableCosts,
        costPerMile: costPerMile
      });

      return updateData;
    },
    onSuccess: () => {
      toast({
        title: "Cost breakdown updated",
        description: "Your truck costs have been saved successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['truck-cost-breakdown', id] });
      queryClient.invalidateQueries({ queryKey: ['truck', id] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Could not save cost changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTruckMutation = useMutation({
    mutationFn: async () => {
      return await TruckService.deleteTruck(id!);
    },
    onSuccess: () => {
      toast({
        title: "Truck deleted",
        description: `${truck?.name || 'Truck'} has been removed from your fleet`,
      });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      // Force immediate navigation after successful deletion
      setTimeout(() => setLocation("/"), 100);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "Could not delete truck. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = () => {
    if (costBreakdown) {
      setEditedCosts({ 
        ...costBreakdown,
        // Convert weekly driverPay back to cents per mile for editing
        driverPayPerMile: costBreakdown?.driverPay ? ((costBreakdown.driverPay / 3000) * 100).toFixed(1) : '0'
      });
    } else {
      // Initialize with default values for new cost breakdown
      setEditedCosts({
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
        driverPayPerMile: '0',
        fuel: 0,
        maintenance: 0,
        tolls: 0,
        dwellTime: 0,
        reeferFuel: 0,
        truckParking: 0
      });
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedCosts({});
  };

  const saveChanges = () => {
    if (costBreakdown) {
      updateCostsMutation.mutate(editedCosts);
    } else {
      createCostBreakdownMutation.mutate(editedCosts);
    }
  };

  const handleCostChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedCosts((prev: any) => ({ ...prev, [field]: numValue }));
  };

  const startEditingTruckInfo = () => {
    if (truck) {
      setEditedTruckInfo({
        name: truck.name,
        vin: truck.vin || '',
        licensePlate: truck.licensePlate || '',
        eldDeviceId: truck.eldDeviceId || '',
        equipmentType: truck.equipmentType,
        currentDriverId: truck.currentDriverId || null,
      });
      setIsEditingTruckInfo(true);
    }
  };

  const cancelEditingTruckInfo = () => {
    setIsEditingTruckInfo(false);
    setEditedTruckInfo({});
  };

  const saveTruckInfoChanges = () => {
    updateTruckMutation.mutate(editedTruckInfo);
  };

  const handleTruckInfoChange = (field: string, value: string | null) => {
    // Handle currentDriverId specially - convert empty string to null for UUID field
    if (field === 'currentDriverId') {
      setEditedTruckInfo((prev: any) => ({ ...prev, [field]: value === '' || value === null ? null : value }));
    } else {
      setEditedTruckInfo((prev: any) => ({ ...prev, [field]: value || '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Truck Not Found</h1>
          <Button onClick={() => setLocation("/")} variant="outline" className="text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case "Reefer": return "🚛";
      case "Flatbed": return "🚚";
      default: return "📦";
    }
  };

  // Fixed and variable costs are weekly costs, divide by standard weekly miles
  const standardWeeklyMiles = 3000;
  const costPerMile = ((truck.fixedCosts || 0) + (truck.variableCosts || 0)) / standardWeeklyMiles;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fleet
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-2xl">{getEquipmentIcon(truck.equipmentType || 'Dry Van')}</span>
                {truck.name || 'Unnamed Truck'}
              </h1>
              <p className="text-slate-400 mt-1">{(truck.equipmentType || 'Unknown')} • {truck.licensePlate || 'No License Plate'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Cost Per Mile</div>
              <div className="text-2xl font-bold text-red-400">${(costPerMile || 0).toFixed(2)}</div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="ml-4">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Truck
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Delete {truck.name || 'this truck'}?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-300">
                    This action cannot be undone. This will permanently delete {truck.name || 'this truck'} and remove all associated cost data, loads, and planning information from your fleet.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteTruckMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={deleteTruckMutation.isPending}
                  >
                    {deleteTruckMutation.isPending ? "Deleting..." : "Delete Truck"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Fixed Costs</div>
                  <div className="text-xl font-semibold text-white">${(truck.fixedCosts || 0).toFixed(2)}</div>
                  <div className="text-xs text-slate-500">per week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <Fuel className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Variable Costs</div>
                  <div className="text-xl font-semibold text-white">${(truck.variableCosts || 0).toFixed(2)}</div>
                  <div className="text-xs text-slate-500">per week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Truck className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Total Miles</div>
                  <div className="text-xl font-semibold text-white">{(truck.totalMiles || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">lifetime</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Wrench className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Status</div>
                  <div className="text-xl font-semibold text-white">
                    {truck.isActive ? "Active" : "Inactive"}
                  </div>
                  <div className="text-xs text-slate-500">current</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Truck Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Truck Information</CardTitle>
                <div className="flex gap-2">
                  {!isEditingTruckInfo ? (
                    <Button 
                      onClick={startEditingTruckInfo}
                      size="sm" 
                      variant="outline" 
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={saveTruckInfoChanges}
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={updateTruckMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        onClick={cancelEditingTruckInfo}
                        size="sm" 
                        variant="outline" 
                        className="border-slate-600 text-slate-400 hover:bg-slate-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-400">Truck Name</Label>
                  {isEditingTruckInfo ? (
                    <Input
                      value={editedTruckInfo.name || ""}
                      onChange={(e) => handleTruckInfoChange('name', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="Enter truck name"
                    />
                  ) : (
                    <div className="text-white font-medium mt-1">{truck.name}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-slate-400">Equipment Type</Label>
                  {isEditingTruckInfo ? (
                    <Select 
                      value={editedTruckInfo.equipmentType || truck.equipmentType}
                      onValueChange={(value) => handleTruckInfoChange('equipmentType', value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="Dry Van">Dry Van</SelectItem>
                        <SelectItem value="Reefer">Reefer</SelectItem>
                        <SelectItem value="Flatbed">Flatbed</SelectItem>
                        <SelectItem value="Step Deck">Step Deck</SelectItem>
                        <SelectItem value="Lowboy">Lowboy</SelectItem>
                        <SelectItem value="Tanker">Tanker</SelectItem>
                        <SelectItem value="Car Hauler">Car Hauler</SelectItem>
                        <SelectItem value="Dump Truck">Dump Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-white mt-1">{truck.equipmentType}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-slate-400">VIN</Label>
                  {isEditingTruckInfo ? (
                    <Input
                      value={editedTruckInfo.vin || ""}
                      onChange={(e) => handleTruckInfoChange('vin', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="Enter VIN"
                    />
                  ) : (
                    <div className="text-white font-mono mt-1">{truck.vin || 'Not provided'}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-slate-400">License Plate</Label>
                  {isEditingTruckInfo ? (
                    <Input
                      value={editedTruckInfo.licensePlate || ""}
                      onChange={(e) => handleTruckInfoChange('licensePlate', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="Enter license plate"
                    />
                  ) : (
                    <div className="text-white font-mono mt-1">{truck.licensePlate || 'Not provided'}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-slate-400">ELD Device ID</Label>
                  {isEditingTruckInfo ? (
                    <Input
                      value={editedTruckInfo.eldDeviceId || ""}
                      onChange={(e) => handleTruckInfoChange('eldDeviceId', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="Enter ELD device ID"
                    />
                  ) : (
                    <div className="text-white font-mono mt-1">{truck.eldDeviceId || 'Not provided'}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-slate-400">Assigned Driver</Label>
                  {isEditingTruckInfo ? (
                    <div className="mt-1">
                      <DriverAssignmentSelect
                        selectedDriverId={editedTruckInfo.currentDriverId}
                        onDriverChange={(driverId) => handleTruckInfoChange('currentDriverId', driverId)}
                      />
                    </div>
                  ) : (
                    <div className="text-white mt-1">{truck.driver ? truck.driver.name : 'No driver assigned'}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Cost Breakdown</CardTitle>
                  <p className="text-slate-400 text-sm">
                    {costBreakdown 
                      ? `Week starting ${new Date(costBreakdown.weekStarting).toLocaleDateString()}`
                      : "No cost data available - Click Edit to add costs"
                    }
                  </p>
                </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button 
                        onClick={startEditing}
                        size="sm" 
                        variant="outline" 
                        className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                        disabled={costBreakdownLoading}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {costBreakdown ? 'Edit' : 'Add Costs'}
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={saveChanges}
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={updateCostsMutation.isPending || createCostBreakdownMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateCostsMutation.isPending || createCostBreakdownMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                          onClick={cancelEditing}
                          size="sm" 
                          variant="outline" 
                          className="border-slate-600 text-slate-400 hover:bg-slate-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fixed Costs */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-300">Fixed Costs (Weekly)</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'truckPayment', label: 'Truck Payment' },
                      { key: 'trailerPayment', label: 'Trailer Payment' },
                      { key: 'liabilityInsurance', label: 'Liability Insurance' },
                      { key: 'physicalInsurance', label: 'Physical Insurance' },
                      { key: 'cargoInsurance', label: 'Cargo Insurance' },
                      { key: 'elogSubscription', label: 'ELD Subscription' }
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs text-slate-400">{label}</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editedCosts[key] || ""}
                            onChange={(e) => handleCostChange(key, e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="text-white text-sm font-medium">
                            ${(costBreakdown?.[key] || 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Variable Costs */}
                <div className="space-y-3 pt-2 border-t border-slate-700">
                  <div className="text-sm font-medium text-slate-300">Variable Costs</div>
                  
                  {/* Driver Pay per Mile */}
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Driver Pay (cents per mile)</Label>
                    {isEditing ? (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={editedCosts.driverPayPerMile || ""}
                          onChange={(e) => handleCostChange('driverPayPerMile', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                          placeholder="0.0"
                        />
                        <div className="text-xs text-slate-500">
                          = ${((parseFloat(editedCosts.driverPayPerMile) || 0) / 100 * 3000).toFixed(2)}/week at 3,000 miles
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-white text-sm font-medium">
                          {costBreakdown?.driverPay ? ((costBreakdown.driverPay / 3000) * 100).toFixed(1) : '0.0'}¢/mile
                        </div>
                        <div className="text-xs text-slate-500">
                          = ${(costBreakdown?.driverPay || 0).toFixed(2)}/week at 3,000 miles
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Variable Costs */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'fuel', label: 'Fuel (weekly)' },
                      { key: 'maintenance', label: 'Maintenance (weekly)' },
                      { key: 'tolls', label: 'Tolls (weekly)' }
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs text-slate-400">{label}</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editedCosts[key] || ""}
                            onChange={(e) => handleCostChange(key, e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="text-white text-sm font-medium">
                            ${(costBreakdown?.[key] || 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="pt-3 border-t border-slate-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Fixed Costs:</span>
                    <span className="text-white font-medium">
                      ${(isEditing 
                        ? Object.entries(editedCosts)
                            .filter(([key]) => ['truckPayment', 'trailerPayment', 'elogSubscription', 'liabilityInsurance', 
                                               'physicalInsurance', 'cargoInsurance', 'trailerInterchange', 'bobtailInsurance',
                                               'nonTruckingLiability', 'basePlateDeduction', 'companyPhone'].includes(key))
                            .reduce((sum, [, value]) => sum + (parseFloat(String(value)) || 0), 0)
                        : costBreakdown?.totalFixedCosts || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Variable Costs:</span>
                    <span className="text-white font-medium">
                      ${(isEditing
                        ? ((parseFloat(editedCosts.driverPayPerMile) || 0) / 100 * 3000) + 
                          Object.entries(editedCosts)
                            .filter(([key]) => ['fuel', 'maintenance', 'tolls', 'dwellTime', 'reeferFuel', 'truckParking'].includes(key))
                            .reduce((sum, [, value]) => sum + (parseFloat(String(value)) || 0), 0)
                        : costBreakdown?.totalVariableCosts || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-slate-600">
                    <span className="text-slate-300">Cost Per Mile:</span>
                    <span className="text-red-400">
                      ${(isEditing
                        ? (((parseFloat(editedCosts.driverPayPerMile) || 0) / 100 * 3000) + 
                           Object.entries(editedCosts)
                             .filter(([key]) => ['truckPayment', 'trailerPayment', 'elogSubscription', 'liabilityInsurance', 
                                                'physicalInsurance', 'cargoInsurance', 'trailerInterchange', 'bobtailInsurance',
                                                'nonTruckingLiability', 'basePlateDeduction', 'companyPhone', 'fuel', 'maintenance', 
                                                'tolls', 'dwellTime', 'reeferFuel', 'truckParking'].includes(key))
                             .reduce((sum, [, value]) => sum + (parseFloat(String(value)) || 0), 0)
                          ) / 3000
                        : costBreakdown?.costPerMile || 0
                      ).toFixed(3)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Load history and activity tracking coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}