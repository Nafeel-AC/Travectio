import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Users, 
  Truck, 
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Route,
  Phone,
  FileText
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LoadService, TruckService, DriverService } from "@/lib/supabase-client";
import { useAuth } from "@/hooks/useSupabase";
import BottomNavigation from "@/components/bottom-navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

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

export default function OperationsTabs() {
  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [activeTab, setActiveTab] = useState("loads");
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data
  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data: loads = [], isLoading: loadsLoading } = useQuery({
    queryKey: ['loads'],
    queryFn: () => LoadService.getLoads(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => DriverService.getDrivers(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // Update load status mutation
  const updateLoadStatusMutation = useMutation({
    mutationFn: async ({ loadId, status }: { loadId: string; status: string }) => {
      return LoadService.updateLoad(loadId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast({
        title: "Status Updated",
        description: `Load status changed to ${statusLabels[status as keyof typeof statusLabels]}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update load status.",
        variant: "destructive",
      });
    }
  });

  // Filter loads
  const safeLoads = Array.isArray(loads) ? loads : [];
  const filteredLoads = safeLoads.filter(load => {
    if (selectedTruck && selectedTruck !== "all") {
      if (selectedTruck === "unassigned" && load.truckId) return false;
      if (selectedTruck !== "unassigned" && load.truckId !== selectedTruck) return false;
    }
    if (selectedStatus && selectedStatus !== "all" && load.status !== selectedStatus) return false;
    if (selectedEquipment && selectedEquipment !== "all" && load.type !== selectedEquipment) return false;
    return true;
  });

  const handleStatusChange = (loadId: string, newStatus: string) => {
    if (newStatus === "delete") {
      if (window.confirm("Are you sure you want to delete this load?")) {
        // Implement delete logic
        toast({
          title: "Delete Load",
          description: "Load deletion functionality will be implemented.",
        });
      }
    } else {
      updateLoadStatusMutation.mutate({ loadId, status: newStatus });
    }
  };

  // Load status buckets
  const loadBuckets = {
    pending: filteredLoads.filter(l => l.status === "pending").length,
    in_transit: filteredLoads.filter(l => l.status === "in_transit").length,
    delivered: filteredLoads.filter(l => l.status === "delivered").length,
    cancelled: filteredLoads.filter(l => l.status === "cancelled").length
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="pb-20 md:pb-0"> {/* Add bottom padding for mobile navigation only */}
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Operations</h1>
            <p className="text-slate-400">Manage your fleet, loads, and drivers</p>
          </div>

          {/* Main Operations Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-800 border-slate-700">
              <TabsTrigger value="loads" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Package className="h-4 w-4 mr-2" />
                Loads
              </TabsTrigger>
              <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Drivers
              </TabsTrigger>
              <TabsTrigger value="fleet" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Truck className="h-4 w-4 mr-2" />
                Fleet
              </TabsTrigger>
            </TabsList>

            {/* Loads Tab */}
            <TabsContent value="loads" className="space-y-6">
              {/* Load Status Buckets */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-yellow-600/20 border-yellow-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-400 text-sm font-medium">Pending</p>
                        <p className="text-white text-2xl font-bold">{loadBuckets.pending}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-600/20 border-blue-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-400 text-sm font-medium">In Transit</p>
                        <p className="text-white text-2xl font-bold">{loadBuckets.in_transit}</p>
                      </div>
                      <Route className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-600/20 border-green-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 text-sm font-medium">Delivered</p>
                        <p className="text-white text-2xl font-bold">{loadBuckets.delivered}</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-600/20 border-red-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-400 text-sm font-medium">Cancelled</p>
                        <p className="text-white text-2xl font-bold">{loadBuckets.cancelled}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="bg-slate-800 border-slate-700">
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
                          {trucks.map((truck: any) => (
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

              {/* Loads List */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Load Inventory ({filteredLoads.length})</span>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => window.location.href = '/load-management'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Load
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredLoads.length > 0 ? (
                    <div className="space-y-3">
                      {filteredLoads.map((load: any) => {
                        const truck = trucks.find(t => t.id === load.truckId);
                        const ratePerMile = load.miles > 0 ? (load.pay / load.miles).toFixed(2) : "0.00";

                        return (
                          <div key={load.id} className="bg-slate-700 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="text-2xl flex-shrink-0">
                                  {equipmentIcons[load.type as keyof typeof equipmentIcons] || "📦"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-white font-medium">{load.type}</div>
                                  <div className="text-slate-400 text-sm">
                                    {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                                  </div>
                                  <div className="text-slate-500 text-xs">
                                    {load.miles} miles • {load.commodity}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-green-300 font-semibold text-lg">
                                  ${load.pay?.toLocaleString() || '0'}
                                </div>
                                <div className="text-slate-400 text-sm">
                                  ${ratePerMile}/mile
                                </div>
                                {load.profit !== undefined && (
                                  <div className={`text-sm font-medium ${load.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    Profit: {load.profit >= 0 ? '+' : ''}${load.profit.toFixed(0)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-slate-300">
                                  Truck: {truck ? truck.name : 'Unassigned'}
                                </span>
                                {load.pickupDate && (
                                  <span className="text-slate-300">
                                    Pickup: {format(new Date(load.pickupDate), "MMM d")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={load.status} 
                                  onValueChange={(newStatus) => handleStatusChange(load.id, newStatus)}
                                  disabled={updateLoadStatusMutation.isPending}
                                >
                                  <SelectTrigger className={`w-32 ${statusColors[load.status as keyof typeof statusColors] || 'bg-slate-600'} text-white border-0`}>
                                    <SelectValue>
                                      {statusLabels[load.status as keyof typeof statusLabels] || load.status}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-700 border-slate-600">
                                    <SelectItem value="pending" className="text-white">Pending</SelectItem>
                                    <SelectItem value="in_transit" className="text-white">In Transit</SelectItem>
                                    <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                                    <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.location.href = `/load-management`}
                                  className="text-slate-300 border-slate-600 hover:bg-slate-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-lg mb-2">No loads found</p>
                      <p className="text-sm">Create your first load to start tracking operations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Drivers Tab */}
            <TabsContent value="drivers" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Driver Management ({drivers.length})</span>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => window.location.href = '/drivers'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Driver
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {drivers.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {drivers.map((driver: any) => (
                        <Card key={driver.id} className="bg-slate-700 border-slate-600">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="text-white font-medium">
                                  {driver.firstName} {driver.lastName}
                                </div>
                                <div className="text-slate-400 text-sm">
                                  {driver.cdlNumber ? `CDL: ${driver.cdlNumber}` : 'No CDL'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {driver.phone && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <Phone className="h-4 w-4" />
                                  {driver.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-slate-300">
                                <Truck className="h-4 w-4" />
                                {driver.assignedTruckId ? 'Assigned' : 'Unassigned'}
                              </div>
                              <div className="flex items-center gap-2 text-slate-300">
                                <CheckCircle2 className="h-4 w-4" />
                                {driver.isActive ? 'Active' : 'Inactive'}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-600">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-slate-300 border-slate-600 hover:bg-slate-700"
                                onClick={() => window.location.href = `/drivers`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Manage
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-lg mb-2">No drivers found</p>
                      <p className="text-sm">Add your first driver to start managing your team</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fleet Tab */}
            <TabsContent value="fleet" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Fleet Management ({trucks.length})</span>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.location.href = '/add-truck'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Truck
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trucks.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {trucks.map((truck: any) => (
                        <Card key={truck.id} className="bg-slate-700 border-slate-600">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                  <Truck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="text-white font-medium">{truck.name}</div>
                                  <div className="text-slate-400 text-sm">{truck.equipmentType}</div>
                                </div>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${truck.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between text-slate-300">
                                <span>VIN:</span>
                                <span className="font-mono text-xs">{truck.vin || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>License:</span>
                                <span>{truck.licensePlate || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Cost/Mile:</span>
                                <span className="text-green-400">${(truck.costPerMile || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Total Miles:</span>
                                <span>{(truck.totalMiles || 0).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-600 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-700"
                                onClick={() => window.location.href = `/truck/${truck.id}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Profile
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-700"
                                onClick={() => window.location.href = `/trucks/${truck.id}/cost-breakdown`}
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Costs
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Truck className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-lg mb-2">No trucks in fleet</p>
                      <p className="text-sm">Add your first truck to start managing your fleet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      {isMobile && <BottomNavigation />}
    </div>
  );
}
