import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TruckService } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, 
  Users,
  Clock,
  Package,
  Fuel,
  Plus,
  RefreshCw,
  MapPin,
  DollarSign,
  User,
  Settings
} from "lucide-react";
import { Link } from "wouter";
import LoadManagement from "./load-management";
import HOSManagement from "./hos-management";
import FuelManagement from "./fuel-management";
import DriversPage from "./drivers";

export default function FleetManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("fleet");

  // Fetch all trucks
  const { data: trucks = [], isLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Mutation to update cost per mile for all trucks
  const updateCostPerMileMutation = useMutation({
    mutationFn: () => TruckService.updateAllTrucksCostPerMile(),
    onSuccess: () => {
      toast({
        title: "Cost per mile updated",
        description: "All trucks have been updated with their latest cost per mile values.",
      });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update cost per mile values.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-gray-500";
  };

  const getEquipmentTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'dry van':
        return 'bg-blue-500';
      case 'reefer':
        return 'bg-green-500';
      case 'flatbed':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading fleet management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Fleet Management</h1>
            <p className="text-gray-400 text-sm md:text-base">Manage your fleet, drivers, loads, and fuel operations</p>
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:space-x-3 md:space-y-0">
            <Button 
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)] touch-target"
              onClick={() => updateCostPerMileMutation.mutate()}
              disabled={updateCostPerMileMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${updateCostPerMileMutation.isPending ? 'animate-spin' : ''}`} />
              <span className="mobile-hide">Update Cost/Mile</span>
              <span className="mobile-show">Update</span>
            </Button>
            <Button 
              className="bg-[var(--primary-blue)] hover:bg-[var(--blue-accent)] text-white touch-target"
              onClick={() => window.location.href = '/add-truck'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Truck
            </Button>
          </div>
        </div>
      </div>

      {/* Fleet Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700 mb-6">
          <TabsTrigger value="fleet" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Truck className="h-4 w-4 mr-2" />
            Fleet
          </TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="hos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Clock className="h-4 w-4 mr-2" />
            HOS
          </TabsTrigger>
          <TabsTrigger value="loads" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="h-4 w-4 mr-2" />
            Loads
          </TabsTrigger>
          <TabsTrigger value="fuel" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Fuel className="h-4 w-4 mr-2" />
            Fuel
          </TabsTrigger>
        </TabsList>

        {/* Fleet Tab */}
        <TabsContent value="fleet" className="space-y-6">
          {/* Stats Overview */}
          <div className="mobile-grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Trucks</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">{trucks.length}</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active Trucks</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">
                      {trucks.filter((truck: any) => truck.isActive).length}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Avg Cost/Mile</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">
                      ${trucks.length > 0 ? (trucks.reduce((sum: number, truck: any) => sum + (truck.costPerMile || 0), 0) / trucks.length).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Equipment Types</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">
                      {new Set(trucks.map((truck: any) => truck.equipmentType)).size}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fleet Grid */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Fleet Overview</span>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  {trucks.length} trucks
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trucks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {trucks.map((truck: any) => (
                    <Card key={truck.id} className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(truck.isActive)}`}></div>
                            <div>
                              <h3 className="font-semibold text-white">{truck.name}</h3>
                              <p className="text-sm text-gray-400">{truck.licensePlate}</p>
                            </div>
                          </div>
                          <Badge 
                            className={`${getEquipmentTypeColor(truck.equipmentType)} text-white`}
                          >
                            {truck.equipmentType}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">VIN:</span>
                            <span className="text-white font-mono text-xs">{truck.vin}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Cost/Mile:</span>
                            <span className="text-white font-semibold">${truck.costPerMile?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">MPG:</span>
                            <span className="text-white">{truck.mpg || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-600"
                            onClick={() => window.location.href = `/truck/${truck.id}`}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-600"
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
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No trucks in fleet</h3>
                  <p className="text-gray-400 mb-6">Add your first truck to start managing your fleet</p>
                  <Button 
                    className="bg-[var(--primary-blue)] hover:bg-[var(--blue-accent)] text-white"
                    onClick={() => window.location.href = '/add-truck'}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Truck
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <DriversPage />
        </TabsContent>

        {/* HOS Tab */}
        <TabsContent value="hos" className="space-y-6">
          <HOSManagement />
        </TabsContent>

        {/* Loads Tab */}
        <TabsContent value="loads" className="space-y-6">
          <LoadManagement />
        </TabsContent>

        {/* Fuel Tab */}
        <TabsContent value="fuel" className="space-y-6">
          <FuelManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
