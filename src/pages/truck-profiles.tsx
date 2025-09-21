import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TruckService } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, 
  Settings, 
  Fuel, 
  Package, 
  Clock, 
  DollarSign, 
  MapPin,
  User,
  Plus,
  RefreshCw
} from "lucide-react";

export default function TruckProfiles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          <div className="text-white">Loading truck profiles...</div>
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
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Truck Profiles</h1>
            <p className="text-gray-400 text-sm md:text-base">Manage and view detailed information about your fleet</p>
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

      {/* Stats Overview */}
      <div className="mobile-grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Trucks</p>
                <p className="text-2xl font-bold text-white">{trucks.length}</p>
              </div>
              <Truck className="w-8 h-8 text-[var(--primary-blue)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Trucks</p>
                <p className="text-2xl font-bold text-white">
                  {trucks.filter(truck => truck.isActive).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Assigned Drivers</p>
                <p className="text-2xl font-bold text-white">
                  {trucks.filter(truck => truck.currentDriverId).length}
                </p>
              </div>
              <User className="w-8 h-8 text-[var(--primary-blue)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Cost/Mile</p>
                <p className="text-2xl font-bold text-white">
                  ${trucks.length > 0 
                    ? (trucks.reduce((sum, truck) => sum + (truck.costPerMile || 0), 0) / trucks.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[var(--primary-blue)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Truck Grid */}
      {trucks.length === 0 ? (
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Trucks Found</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first truck to the fleet</p>
            <Button 
              className="bg-[var(--primary-blue)] hover:bg-[var(--blue-accent)] text-white"
              onClick={() => window.location.href = '/add-truck'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Truck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {trucks.map((truck) => (
            <Card key={truck.id} className="bg-[var(--dark-card)] border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{truck.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(truck.isActive)}`}></div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getEquipmentTypeColor(truck.equipmentType)}`}
                    >
                      {truck.equipmentType || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">VIN:</span>
                    <span className="text-white font-mono">{truck.vin || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">License:</span>
                    <span className="text-white">{truck.licensePlate || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">ELD Device:</span>
                    <span className="text-white">{truck.eldDeviceId || 'N/A'}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">Cost/Mile</p>
                    <p className="text-white font-semibold">
                      ${(truck.costPerMile || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">Total Miles</p>
                    <p className="text-white font-semibold">
                      {(truck.totalMiles || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    onClick={() => window.location.href = `/truck/${truck.id}`}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
                    onClick={() => window.location.href = `/truck/${truck.id}#costs`}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Costs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
