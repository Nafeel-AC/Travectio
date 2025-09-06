import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertTriangle, CheckCircle, Users, Search, Calendar, Plus, Trash2 } from "lucide-react";
import EnhancedHOSEntry from "@/components/enhanced-hos-entry";

import { useStableQuery } from "@/hooks/use-stable-query";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DriverService, TruckService, HOSService } from "@/lib/supabase-client";

const dutyStatusColors = {
  "DRIVING": "bg-green-600",
  "ON_DUTY": "bg-yellow-600", 
  "OFF_DUTY": "bg-slate-600",
  "SLEEPER": "bg-blue-600"
};

const dutyStatusLabels = {
  "DRIVING": "Driving",
  "ON_DUTY": "On Duty",
  "OFF_DUTY": "Off Duty", 
  "SLEEPER": "Sleeper"
};

export default function HOSManagement() {
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ✅ FIXED: Use Supabase services instead of demo API
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => DriverService.getDrivers(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // ✅ FIXED: Use Supabase services instead of demo API
  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: hosLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['hos-logs', selectedDriver, selectedTruck],
    queryFn: async () => {
      const logs = await HOSService.getHosLogs(selectedDriver || undefined, selectedTruck || undefined);
      console.log('HOS Logs fetched:', logs);
      return logs;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // ✅ FIXED: Use Supabase services instead of demo API
  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return DriverService.deleteDriver(driverId);
    },
    onSuccess: (_, driverId) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      
      // Clear selected driver if it was deleted
      if (selectedDriver === driverId) {
        setSelectedDriver("");
      }
      
      toast({
        title: "Driver Deleted",
        description: "Driver has been successfully removed from the fleet with cascade cleanup.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  // HOS status update mutation
  const updateHosStatusMutation = useMutation({
    mutationFn: async ({ hosLogId, dutyStatus }: { hosLogId: string; dutyStatus: string }) => {
      return HOSService.updateHosLogStatus(hosLogId, dutyStatus);
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["hos-logs"] });
      
      toast({
        title: "Status Updated",
        description: "HOS status has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating HOS status:", error);
      toast({
        title: "Error",
        description: "Failed to update HOS status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle HOS status change
  const handleHosStatusChange = (hosLogId: string, newStatus: string) => {
    updateHosStatusMutation.mutate({ hosLogId, dutyStatus: newStatus });
  };

  const getViolationStatus = (log: any) => {
    const violations = [];
    if (log.driveTimeRemaining !== null && log.driveTimeRemaining < 0) {
      violations.push("Drive time exceeded");
    }
    if (log.onDutyRemaining !== null && log.onDutyRemaining < 0) {
      violations.push("On-duty time exceeded");
    }
    if (log.cycleHoursRemaining !== null && log.cycleHoursRemaining < 0) {
      violations.push("Cycle hours exceeded");
    }
    return violations;
  };

  const selectedDriverData = drivers.find((d: any) => d.id === selectedDriver);
  const selectedTruckData = trucks.find((t: any) => t.id === selectedTruck);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Hours of Service Management</h1>
            <p className="text-slate-400">Monitor driver hours and DOT compliance status</p>
          </div>
          <Button
            onClick={() => setShowEntryForm(!showEntryForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showEntryForm ? "Hide Entry Form" : "New HOS Entry"}
          </Button>
        </div>

        {showEntryForm && (
          <div className="mb-8">
            <EnhancedHOSEntry />
          </div>
        )}

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filter HOS Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Driver</label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="All drivers" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">All drivers</SelectItem>
                    {drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id} className="text-white">
                        {driver.name} - {driver.cdlNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Truck</label>
                <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="All trucks" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">All trucks</SelectItem>
                    {trucks
                      .filter((truck: any) => truck.isActive) // Only show active trucks
                      .map((truck: any) => (
                      <SelectItem key={truck.id} value={truck.id} className="text-white">
                        {truck.name} - {truck.equipmentType}
                        {truck.driver && ` (${truck.driver.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Management Section */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Driver Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driversLoading ? (
              <div className="text-center py-4">
                <div className="text-slate-400">Loading drivers...</div>
              </div>
            ) : drivers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver: any) => (
                  <div key={driver.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-medium">{driver.name}</div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDriverMutation.mutate(driver.id)}
                        disabled={deleteDriverMutation.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-slate-300 text-sm">CDL: {driver.cdlNumber}</div>
                    {driver.phoneNumber && (
                      <div className="text-slate-300 text-sm">Phone: {driver.phoneNumber}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-2 h-2 rounded-full ${driver.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-slate-300 text-sm">
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-8">
                No drivers found in the system
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Trucks Overview */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Trucks Available for Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trucksLoading ? (
              <div className="text-center py-4">
                <div className="text-slate-400">Loading trucks...</div>
              </div>
            ) : trucks.filter(truck => truck.isActive).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trucks.filter((truck: any) => truck.isActive).map((truck: any) => (
                  <div key={truck.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-medium">{truck.name}</div>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Active
                      </Badge>
                    </div>
                    <div className="text-slate-300 text-sm">Equipment: {truck.equipmentType}</div>
                    <div className="text-slate-300 text-sm">Cost/Mile: ${truck.costPerMile?.toFixed(2) || '0.00'}</div>
                    {truck.driver ? (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-slate-300 text-sm">
                          Assigned to: {truck.driver.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-slate-300 text-sm">
                          Available for assignment
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-8">
                No active trucks available for assignment
              </div>
            )}
          </CardContent>
        </Card>

        {/* HOS Status Summary */}
        {selectedDriver && selectedDriverData && (
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Status: {selectedDriverData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hosLogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-slate-300 text-sm">Current Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-3 h-3 rounded-full ${dutyStatusColors[hosLogs[0]?.dutyStatus as keyof typeof dutyStatusColors] || 'bg-slate-600'}`}></div>
                      <span className="text-white font-medium">
                        {dutyStatusLabels[hosLogs[0]?.dutyStatus as keyof typeof dutyStatusLabels] || hosLogs[0]?.dutyStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-slate-300 text-sm">Drive Time Remaining</div>
                    <div className="text-white font-medium text-lg">
                      {hosLogs[0]?.driveTimeRemaining !== null ? `${hosLogs[0]?.driveTimeRemaining}h` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-slate-300 text-sm">On-Duty Remaining</div>
                    <div className="text-white font-medium text-lg">
                      {hosLogs[0]?.onDutyRemaining !== null ? `${hosLogs[0]?.onDutyRemaining}h` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-slate-300 text-sm">Cycle Hours Remaining</div>
                    <div className="text-white font-medium text-lg">
                      {hosLogs[0]?.cycleHoursRemaining !== null ? `${hosLogs[0]?.cycleHoursRemaining}h` : 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-4">
                  No HOS data available for selected driver
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* HOS Logs Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              HOS Log History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-8">
                <div className="text-slate-400">Loading HOS logs...</div>
              </div>
            ) : hosLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left text-slate-300 py-3 px-4">Driver</th>
                      <th className="text-left text-slate-300 py-3 px-4">Truck</th>
                      <th className="text-left text-slate-300 py-3 px-4">Status</th>
                      <th className="text-left text-slate-300 py-3 px-4">Timestamp</th>
                      <th className="text-left text-slate-300 py-3 px-4">Location</th>
                      <th className="text-left text-slate-300 py-3 px-4">Drive Time</th>
                      <th className="text-left text-slate-300 py-3 px-4">On-Duty</th>
                      <th className="text-left text-slate-300 py-3 px-4">Violations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosLogs.map((log: any) => {
                      const driver = drivers.find((d: any) => d.id === log.driverId);
                      const truck = trucks.find((t: any) => t.id === log.truckId);
                      const violations = getViolationStatus(log);

                      return (
                        <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="py-4 px-4">
                            <div className="text-white font-medium">{driver?.name || 'Unknown'}</div>
                            <div className="text-slate-400 text-sm">{driver?.cdlNumber}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-white">{truck?.name || 'Unknown'}</div>
                            <div className="text-slate-400 text-sm">{truck?.licensePlate} • {truck?.equipmentType}</div>
                          </td>
                          <td className="py-4 px-4">
                            <Select 
                              value={log.dutyStatus} 
                              onValueChange={(newStatus) => handleHosStatusChange(log.id, newStatus)}
                              disabled={updateHosStatusMutation.isPending}
                            >
                              <SelectTrigger className={`w-36 ${dutyStatusColors[log.dutyStatus as keyof typeof dutyStatusColors] || 'bg-slate-600'} text-white border-0 hover:opacity-80`}>
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${dutyStatusColors[log.dutyStatus as keyof typeof dutyStatusColors] || 'bg-slate-600'}`}></div>
                                    {dutyStatusLabels[log.dutyStatus as keyof typeof dutyStatusLabels] || log.dutyStatus}
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="DRIVING" className="text-white hover:bg-green-600/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Driving
                                  </div>
                                </SelectItem>
                                <SelectItem value="ON_DUTY" className="text-white hover:bg-yellow-600/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    On Duty
                                  </div>
                                </SelectItem>
                                <SelectItem value="OFF_DUTY" className="text-white hover:bg-slate-600/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                    Off Duty
                                  </div>
                                </SelectItem>
                                <SelectItem value="SLEEPER" className="text-white hover:bg-blue-600/20">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Sleeper
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-white">{format(new Date(log.timestamp), "MMM d, yyyy")}</div>
                            <div className="text-slate-400 text-sm">{format(new Date(log.timestamp), "h:mm a")}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-white">{log.address || 'No location'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-white">
                              {log.driveTimeRemaining !== null ? `${log.driveTimeRemaining}h` : 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-white">
                              {log.onDutyRemaining !== null ? `${log.onDutyRemaining}h` : 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {violations.length > 0 ? (
                              <Badge variant="destructive" className="bg-red-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {violations.length} violation{violations.length > 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Compliant
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <div className="text-slate-400 mb-2">No HOS logs found</div>
                <div className="text-slate-500 text-sm">
                  {selectedDriver || selectedTruck 
                    ? "Try adjusting your filters or create a new HOS entry"
                    : "Create your first HOS entry to start tracking driver hours"
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