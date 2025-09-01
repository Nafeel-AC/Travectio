import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DriverManagementCard } from "./driver-management-card";
import { useQuery } from "@tanstack/react-query";
import { DriverService, TruckService } from "@/lib/supabase-client";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  UserCheck, 
  UserX,
  Loader2
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  cdlNumber: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

interface Truck {
  id: string;
  name: string;
  currentDriverId?: string;
}

export function DriverListManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => DriverService.getDrivers(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: trucks = [] } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Calculate how many trucks each driver is assigned to
  const getAssignedTrucksCount = (driverId: string) => {
    return trucks.filter(truck => truck.currentDriverId === driverId).length;
  };

  // Handle driver updates
  const handleDriverUpdate = (updatedDriver: Driver) => {
    // The query will automatically refetch and update the UI
    // This function is called by the DriverManagementCard component
  };

  // Filter drivers based on search and status
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         driver.cdlNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && driver.isActive) ||
                         (statusFilter === "inactive" && !driver.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const activeDriversCount = drivers.filter(d => d.isActive).length;
  const inactiveDriversCount = drivers.length - activeDriversCount;

  if (driversLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-2" />
          <span className="text-slate-300">Loading drivers...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Driver Management
            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-600/20 rounded-md">
                <UserCheck className="w-3 h-3 text-green-400" />
                <span className="text-green-200 text-xs font-medium">{activeDriversCount}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-red-600/20 rounded-md">
                <UserX className="w-3 h-3 text-red-400" />
                <span className="text-red-200 text-xs font-medium">{inactiveDriversCount}</span>
              </div>
            </div>
          </CardTitle>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-1" />
            Add Driver
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search drivers by name or CDL number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">All Drivers</SelectItem>
              <SelectItem value="active" className="text-white">Active Only</SelectItem>
              <SelectItem value="inactive" className="text-white">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Drivers List */}
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery || statusFilter !== "all" ? "No drivers found" : "No drivers added yet"}
            </h3>
            <p className="text-slate-400 mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Add your first driver to start managing your team"
              }
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Driver
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDrivers.map((driver) => (
              <DriverManagementCard
                key={driver.id}
                driver={driver}
                assignedTrucks={getAssignedTrucksCount(driver.id)}
                onUpdate={handleDriverUpdate}
              />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredDrivers.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Showing {filteredDrivers.length} of {drivers.length} drivers
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-300">
                <span className="text-green-400 font-medium">{activeDriversCount}</span> active
              </span>
              <span className="text-slate-300">
                <span className="text-red-400 font-medium">{inactiveDriversCount}</span> inactive
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DriverListManager;