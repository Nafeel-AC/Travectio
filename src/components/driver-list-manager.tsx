import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DriverManagementCard } from "./driver-management-card";
import { useQuery } from "@tanstack/react-query";
import { OrgDriverService, OrgTruckService } from "@/lib/org-supabase-client";
import { 
  Users, 
  Search, 
  Filter, 
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
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => OrgDriverService.getDrivers(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: trucks = [] } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => OrgTruckService.getTrucks(),
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

  const activeDriversCount = drivers.filter((d: any) => d.isActive ?? true).length;
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
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Driver Management</span>
              <span className="sm:hidden">Drivers</span>
              <div className="flex items-center gap-2 ml-2 sm:ml-4">
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
            {/* No add button; drivers join via invite and self-onboarding */}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search drivers by name or CDL number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white h-10 sm:h-11"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white h-10 sm:h-11">
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
            <div className="text-center py-6 sm:py-8">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                {searchQuery || statusFilter !== "all" ? "No drivers found" : "No drivers in this organization yet"}
              </h3>
              <p className="text-slate-400 text-sm sm:text-base mb-4 px-4">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Invite drivers from Organization Members. Drivers complete their details in Profile."
                }
              </p>
              {/* No CTA button here */}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-700">
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

      {/* Add Driver Dialog removed */}
    </>
  );
}

export default DriverListManager;