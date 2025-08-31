import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, DollarSign, Truck, MapPin, Calendar, Plus, Search, AlertCircle, Fuel, Edit, Trash2, Route } from "lucide-react";
import ManualLoadEntry from "@/components/manual-load-entry";
import { MultiStopLoadEntry } from "@/components/multi-stop-load-entry";

import { TruckProfileDisplay } from "@/components/truck-profile-display";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDemoApi } from "@/hooks/useDemoApi";

const statusColors = {
  "pending": "bg-yellow-600",
  "in_transit": "bg-blue-600",
  "delivered": "bg-green-600",
  "cancelled": "bg-red-600"
};

const statusLabels = {
  "pending": "Pending",
  "in_transit": "In Transit",
  "delivered": "Delivered", 
  "cancelled": "Cancelled"
};

const equipmentIcons = {
  "Dry Van": "📦",
  "Reefer": "🧊",
  "Flatbed": "🏗️"
};

export default function LoadManagement() {
  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showMultiStopForm, setShowMultiStopForm] = useState(false);
  const [editingLoad, setEditingLoad] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { useDemoQuery } = useDemoApi();

  // Mutation for updating load status
  const updateLoadStatusMutation = useMutation({
    mutationFn: async ({ loadId, status }: { loadId: string; status: string }) => {
      return apiRequest(`/api/loads/${loadId}/status`, "PATCH", { status });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Status Updated",
        description: `Load status changed to ${statusLabels[variables.status as keyof typeof statusLabels]}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Could not update load status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting load
  const deleteLoadMutation = useMutation({
    mutationFn: async (loadId: string) => {
      return apiRequest(`/api/loads/${loadId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/load-categories"] });
      toast({
        title: "Load Deleted",
        description: "Load has been successfully deleted and all numbers updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Could not delete load. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (loadId: string, newStatus: string) => {
    if (newStatus === "delete") {
      // Handle delete action
      if (window.confirm("Are you sure you want to delete this load? This action cannot be undone.")) {
        deleteLoadMutation.mutate(loadId);
      }
    } else {
      updateLoadStatusMutation.mutate({ loadId, status: newStatus });
    }
  };

  const { data: trucks = [], isLoading: trucksLoading } = useDemoQuery(
    ["load-management-trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: loads = [], isLoading: loadsLoading } = useDemoQuery(
    ["load-management-loads"],
    "/api/loads",
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Ensure loads is always an array to prevent filter errors
  const safeLoads = Array.isArray(loads) ? loads : [];

  // Filter and sort loads based on selected criteria
  const filteredLoads = safeLoads.filter(load => {
    if (selectedTruck && selectedTruck !== "all") {
      if (selectedTruck === "unassigned" && load.truckId) return false;
      if (selectedTruck !== "unassigned" && load.truckId !== selectedTruck) return false;
    }
    if (selectedStatus && selectedStatus !== "all" && load.status !== selectedStatus) return false;
    if (selectedEquipment && selectedEquipment !== "all" && load.type !== selectedEquipment) return false;
    return true;
  }).sort((a, b) => {
    // Sort by pickup date in chronological order (earliest first)
    const dateA = new Date(a.pickupDate || a.createdAt || 0);
    const dateB = new Date(b.pickupDate || b.createdAt || 0);
    return dateA.getTime() - dateB.getTime();
  });

  // CRITICAL: Use truck's total miles (includes deadhead) for consistency across all interfaces
  const trucksTotal = trucks.reduce((sum: number, truck: any) => sum + truck.totalMiles, 0);
  
  const loadStats = {
    total: safeLoads.length,
    pending: safeLoads.filter(l => l.status === "pending").length,
    inTransit: safeLoads.filter(l => l.status === "in_transit").length,
    delivered: safeLoads.filter(l => l.status === "delivered").length,
    totalRevenue: safeLoads.reduce((sum, l) => sum + (l.pay || 0), 0),
    totalMiles: trucksTotal // Use truck total miles for consistency with dashboard
  };

  const avgRatePerMile = loadStats.totalMiles > 0 ? (loadStats.totalRevenue / loadStats.totalMiles).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Load Management</h1>
            <p className="text-slate-400">Track and manage freight loads across your fleet</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowEntryForm(!showEntryForm);
                setShowMultiStopForm(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showEntryForm ? "Hide Form" : "Single Load"}
            </Button>
            <Button
              onClick={() => {
                setShowMultiStopForm(!showMultiStopForm);
                setShowEntryForm(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Route className="h-4 w-4 mr-2" />
              {showMultiStopForm ? "Hide Form" : "Multi-Stop Load"}
            </Button>
          </div>
        </div>

        {showEntryForm && (
          <div className="mb-8">
            <ManualLoadEntry />
          </div>
        )}

        {showMultiStopForm && (
          <div className="mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <MultiStopLoadEntry 
                  onClose={() => setShowMultiStopForm(false)}
                />
              </CardContent>
            </Card>
          </div>
        )}



        {editingLoad && (
          <div className="mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Edit Load - {editingLoad.type} ({editingLoad.originCity}, {editingLoad.originState} → {editingLoad.destinationCity}, {editingLoad.destinationState})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingLoad(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ManualLoadEntry 
                  editMode={true}
                  loadData={editingLoad}
                  onClose={() => setEditingLoad(null)}
                />
              </CardContent>
            </Card>
          </div>
        )}



        {/* Load Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{loadStats.total}</div>
                  <div className="text-slate-400 text-sm">Total Loads</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">${loadStats.totalRevenue.toLocaleString()}</div>
                  <div className="text-slate-400 text-sm">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{loadStats.totalMiles.toLocaleString()}</div>
                  <div className="text-slate-400 text-sm">Total Miles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 p-3 rounded-lg">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">${avgRatePerMile}</div>
                  <div className="text-slate-400 text-sm">Avg Rate/Mile</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Summary */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Load Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-4">
                <div className="text-yellow-400 text-sm font-medium">Pending</div>
                <div className="text-white text-2xl font-bold">{loadStats.pending}</div>
              </div>
              
              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4">
                <div className="text-blue-400 text-sm font-medium">In Transit</div>
                <div className="text-white text-2xl font-bold">{loadStats.inTransit}</div>
              </div>
              
              <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
                <div className="text-green-400 text-sm font-medium">Delivered</div>
                <div className="text-white text-2xl font-bold">{loadStats.delivered}</div>
              </div>
              
              <div className="bg-slate-600/20 border border-slate-600 rounded-lg p-4">
                <div className="text-slate-400 text-sm font-medium">Available</div>
                <div className="text-white text-2xl font-bold">
                  {loads.filter(l => !l.truckId).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filter Loads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Truck Assignment</label>
                <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="All trucks" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">All trucks</SelectItem>
                    <SelectItem value="unassigned" className="text-white">Unassigned</SelectItem>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id} className="text-white">
                        {truck.name} - {truck.equipmentType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Load Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">All statuses</SelectItem>
                    <SelectItem value="pending" className="text-white">Pending</SelectItem>
                    <SelectItem value="in_transit" className="text-white">In Transit</SelectItem>
                    <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                    <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Equipment Type</label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="All equipment" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">All equipment</SelectItem>
                    <SelectItem value="Dry Van" className="text-white">Dry Van</SelectItem>
                    <SelectItem value="Reefer" className="text-white">Reefer</SelectItem>
                    <SelectItem value="Flatbed" className="text-white">Flatbed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Status - Show trucks and drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Fleet Status ({trucks.length} trucks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trucksLoading ? (
                <div className="text-center py-4">
                  <div className="text-slate-400">Loading trucks...</div>
                </div>
              ) : trucks.length > 0 ? (
                <div className="space-y-4">
                  {trucks.map((truck) => (
                    <TruckProfileDisplay key={truck.id} truck={truck} compact={true} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400 mb-2">No trucks in fleet</div>
                  <div className="text-slate-500 text-sm">Navigate to Add Truck to register your first vehicle</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Load Assignment Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Trucks with loads</span>
                  <span className="text-white font-medium">
                    {loads.filter(l => l.truckId).length}/{trucks.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Unassigned loads</span>
                  <span className="text-yellow-400 font-medium">
                    {loads.filter(l => !l.truckId).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active routes</span>
                  <span className="text-blue-400 font-medium">
                    {loads.filter(l => l.status === "in_transit").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Available capacity</span>
                  <span className="text-green-400 font-medium">
                    {trucks.length - loads.filter(l => l.truckId && l.status === "in_transit").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Load Inventory */}
        <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Load Inventory ({filteredLoads.length} of {loads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
            {loadsLoading ? (
              <div className="text-center py-8">
                <div className="text-slate-400">Loading loads...</div>
              </div>
            ) : filteredLoads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left text-slate-300 py-3 px-4">Load Info</th>
                      <th className="text-left text-slate-300 py-3 px-4">Route</th>
                      <th className="text-left text-slate-300 py-3 px-4">Truck Assignment</th>
                      <th className="text-left text-slate-300 py-3 px-4">Financial</th>
                      <th className="text-left text-slate-300 py-3 px-4">Schedule</th>
                      <th className="text-left text-slate-300 py-3 px-4">Status</th>
                      <th className="text-left text-slate-300 py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoads.map((load: any) => {
                      const truck = trucks.find(t => t.id === load.truckId);
                      const ratePerMile = load.miles > 0 ? (load.pay / load.miles).toFixed(2) : "0.00";

                      return (
                        <tr key={load.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {equipmentIcons[load.type as keyof typeof equipmentIcons] || "📦"}
                              </div>
                              <div>
                                <div className="text-white font-medium">{load.type}</div>
                                <div className="text-slate-400 text-sm">{load.commodity}</div>
                                <div className="text-slate-500 text-xs">
                                  {load.weight ? `${load.weight.toLocaleString()} lbs` : 'Weight N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="text-white text-sm">
                                <span className="text-slate-400">From:</span> {load.originCity}, {load.originState}
                              </div>
                              <div className="text-white text-sm">
                                <span className="text-slate-400">To:</span> {load.destinationCity}, {load.destinationState}
                              </div>
                              <div className="text-slate-400 text-xs">
                                {load.miles ? `${load.miles.toLocaleString()} miles` : 'Miles N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {load.truckId && truck ? (
                              <TruckProfileDisplay truck={truck} compact={true} />
                            ) : (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                <span className="text-yellow-400 text-sm">Unassigned</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="text-white font-medium">${load.pay?.toLocaleString() || 0}</div>
                              <div className="text-slate-400 text-sm">${ratePerMile}/mile</div>
                              
                              {/* Driver Pay Information */}
                              {load.calculatedDriverPay && load.calculatedDriverPay > 0 && (
                                <div className="text-green-400 text-xs">
                                  Driver: ${load.calculatedDriverPay.toFixed(2)}
                                  {load.driverPayType === 'percentage' && ` (${load.driverPayPercentage || 70}%)`}
                                  {load.driverPayType === 'per_mile' && ` (${(load.calculatedDriverPay / load.miles).toFixed(2)}/mi)`}
                                  {load.driverPayType === 'flat_rate' && ' (flat)'}
                                </div>
                              )}
                              
                              {/* Comprehensive Cost Breakdown */}
                              <div className="space-y-1">
                                {/* Fuel Costs */}
                                {load.actualFuelCost > 0 ? (
                                  <div className="text-green-400 text-xs">
                                    Fuel: ${load.actualFuelCost.toFixed(2)} (${load.actualFuelCostPerMile?.toFixed(3)}/mi)
                                  </div>
                                ) : load.estimatedFuelCost > 0 ? (
                                  <div className="text-yellow-400 text-xs">
                                    Est. Fuel: ${load.estimatedFuelCost.toFixed(2)} (${load.estimatedFuelCostPerMile?.toFixed(3)}/mi)
                                  </div>
                                ) : (
                                  <div className="text-slate-500 text-xs">
                                    No fuel data
                                  </div>
                                )}
                                
                                {/* Truck Costs - only show if assigned to truck */}
                                {load.truckId && load.truckCostPerMile > 0 && (
                                  <div className="text-blue-400 text-xs">
                                    Truck: ${load.truckCostPerMile?.toFixed(3)}/mi (Fixed: ${load.truckFixedCostPerMile?.toFixed(3)} + Var: ${load.truckVariableCostPerMile?.toFixed(3)})
                                  </div>
                                )}
                                
                                {/* Total Cost Per Mile */}
                                {load.totalCostPerMile > 0 && (
                                  <div className="text-purple-400 text-xs font-medium">
                                    Total CPM: ${load.totalCostPerMile?.toFixed(3)}/mi
                                  </div>
                                )}
                              </div>
                              
                              {/* Net Profit - Enhanced Display */}
                              {load.netProfit !== undefined && load.totalCostPerMile > 0 ? (
                                <div className="mt-2 pt-1 border-t border-slate-600">
                                  <div className={`text-sm font-medium ${load.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    Net Profit: ${load.netProfit.toFixed(2)}
                                  </div>
                                  <div className={`text-xs ${load.profitPerMile >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${load.profitPerMile?.toFixed(3)}/mi profit
                                  </div>
                                </div>
                              ) : load.profit !== undefined && (
                                <div className={`text-xs ${load.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  Est. Profit: ${load.profit.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {load.pickupDate && (
                                <div className="text-white text-sm">
                                  <span className="text-slate-400">Pickup:</span> {format(new Date(load.pickupDate), "MMM d")}
                                </div>
                              )}
                              {load.deliveryDate && (
                                <div className="text-white text-sm">
                                  <span className="text-slate-400">Delivery:</span> {format(new Date(load.deliveryDate), "MMM d")}
                                </div>
                              )}
                              {!load.pickupDate && !load.deliveryDate && (
                                <div className="text-slate-500 text-sm">No dates set</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Select 
                              value={load.status} 
                              onValueChange={(newStatus) => handleStatusChange(load.id, newStatus)}
                              disabled={updateLoadStatusMutation.isPending}
                            >
                              <SelectTrigger className={`w-32 ${statusColors[load.status as keyof typeof statusColors] || 'bg-slate-600'} text-white border-0 hover:opacity-80`}>
                                <SelectValue>
                                  {statusLabels[load.status as keyof typeof statusLabels] || load.status}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="pending" className="text-white hover:bg-yellow-600/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    Pending
                                  </div>
                                </SelectItem>
                                <SelectItem value="in_transit" className="text-white hover:bg-blue-600/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    In Transit
                                  </div>
                                </SelectItem>
                                <SelectItem value="delivered" className="text-white hover:bg-green-600/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Delivered
                                  </div>
                                </SelectItem>
                                <SelectItem value="cancelled" className="text-white hover:bg-red-600/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Cancelled
                                  </div>
                                </SelectItem>
                                <SelectItem value="delete" className="text-red-400 hover:bg-red-600/20 border-t border-slate-600 mt-1">
                                  <div className="flex items-center gap-2">
                                    <Trash2 className="w-3 h-3" />
                                    Delete Shipment
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-4 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingLoad(load);
                                setShowEntryForm(false);
                              }}
                              className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <div className="text-slate-400 mb-2">No loads found</div>
                <div className="text-slate-500 text-sm">
                  {selectedTruck || selectedStatus || selectedEquipment
                    ? "Try adjusting your filters or create a new load entry"
                    : "Create your first load entry to start tracking freight"
                  }
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
}