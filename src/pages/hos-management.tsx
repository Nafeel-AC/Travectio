import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertTriangle, CheckCircle, Users, Search, Calendar, Plus, Trash2, Eye, Lock } from "lucide-react";
import EnhancedHOSEntry from "@/components/enhanced-hos-entry";

import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useOrgDrivers, useOrgTrucks, useOrgHosLogs, useCreateOrgHosLog, useUpdateOrgHosLogStatus, useRoleAccess } from "@/hooks/useOrgData";
import { useOrgRole } from "@/lib/org-role-context";

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
  const { toast } = useToast();
  const { role } = useOrgRole();
  const roleAccess = useRoleAccess();

  // Use organization-aware hooks
  const { data: drivers = [], isLoading: driversLoading } = useOrgDrivers();
  const { data: trucks = [], isLoading: trucksLoading } = useOrgTrucks();
  const { data: hosLogs = [], isLoading: logsLoading } = useOrgHosLogs(selectedDriver || undefined, selectedTruck || undefined);
  const createHosLogMutation = useCreateOrgHosLog();
  const updateHosStatusMutation = useUpdateOrgHosLogStatus();

  // Handle HOS status change with role-based access control
  const handleHosStatusChange = (hosLogId: string, newStatus: string) => {
    const hosLog = hosLogs.find(log => log.id === hosLogId);
    
    if (role === 'driver') {
      // Drivers can only update their own HOS logs
      if (hosLog?.driverId !== drivers.find(d => d.userId === hosLog?.driverId)?.id) {
        toast({
          title: "Access Denied",
          description: "You can only update your own HOS logs.",
          variant: "destructive",
        });
        return;
      }
    } else if (!roleAccess.canManageDrivers) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to update HOS logs.",
        variant: "destructive",
      });
      return;
    }

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
    <div className="min-h-screen bg-slate-900 text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Hours of Service Management</h1>
            <p className="text-slate-400 text-sm sm:text-base">
              {role === 'driver' ? 'Manage your HOS logs and compliance' : 'Monitor driver hours and DOT compliance status'}
            </p>
            
            {/* Role-based info */}
            {role === 'driver' && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2 text-blue-300">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">Driver View: Showing your HOS logs only</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {roleAccess.canCreateData && (
              <Button
                onClick={() => setShowEntryForm(!showEntryForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showEntryForm ? "Hide Entry Form" : "New HOS Entry"}
              </Button>
            )}
            
            {!roleAccess.canCreateData && role === 'driver' && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="h-4 w-4" />
                <span>View your HOS logs - Use ELD device to log hours</span>
              </div>
            )}
            
            {!roleAccess.canCreateData && role !== 'driver' && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Lock className="h-4 w-4" />
                <span>View Only - Contact owner for access</span>
              </div>
            )}
          </div>
        </div>

        {showEntryForm && (
          <div className="mb-8">
            <EnhancedHOSEntry />
          </div>
        )}

        {/* Filters - Role-based visibility */}
        {(roleAccess.canManageDrivers || role === 'driver') && (
          <Card className="bg-slate-800 border-slate-700 mb-4 sm:mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Search className="h-5 w-5" />
                {role === 'driver' ? 'Your HOS Logs' : 'Filter HOS Logs'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {/* Driver filter - only show for owners/dispatchers */}
                {roleAccess.canManageDrivers && (
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">Driver</label>
                    <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 sm:h-11">
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
                )}
                
                {/* Truck filter - show for all but limit for drivers */}
                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">
                    {role === 'driver' ? 'Your Truck' : 'Truck'}
                  </label>
                  <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 sm:h-11">
                      <SelectValue placeholder={role === 'driver' ? 'Your assigned truck' : 'All trucks'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {roleAccess.canManageDrivers && (
                        <SelectItem value="all" className="text-white">All trucks</SelectItem>
                      )}
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
        )}

        {/* Driver Management Section */}
        <Card className="bg-slate-800 border-slate-700 mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
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
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {drivers.map((driver: any) => (
                  <div key={driver.id} className="bg-slate-700 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="text-white font-medium text-sm sm:text-base min-w-0 flex-1">
                        <div className="truncate">{driver.name}</div>
                        <div className="text-slate-300 text-xs sm:text-sm">CDL: {driver.cdlNumber}</div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDriverMutation.mutate(driver.id)}
                        disabled={deleteDriverMutation.isPending}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {driver.phoneNumber && (
                      <div className="text-slate-300 text-xs sm:text-sm mb-2">Phone: {driver.phoneNumber}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${driver.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-slate-300 text-xs sm:text-sm">
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-6 sm:py-8">
                No drivers found in the system
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Trucks Overview */}
        <Card className="bg-slate-800 border-slate-700 mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-5 w-5" />
              <span className="hidden sm:inline">Active Trucks Available for Assignment</span>
              <span className="sm:hidden">Active Trucks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trucksLoading ? (
              <div className="text-center py-4">
                <div className="text-slate-400">Loading trucks...</div>
              </div>
            ) : trucks.filter(truck => truck.isActive).length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {trucks.filter((truck: any) => truck.isActive).map((truck: any) => (
                  <div key={truck.id} className="bg-slate-700 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="text-white font-medium text-sm sm:text-base min-w-0 flex-1">
                        <div className="truncate">{truck.name}</div>
                        <div className="text-slate-300 text-xs sm:text-sm">Equipment: {truck.equipmentType}</div>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-400 text-xs flex-shrink-0">
                        Active
                      </Badge>
                    </div>
                    <div className="text-slate-300 text-xs sm:text-sm mb-2">Cost/Mile: ${truck.costPerMile?.toFixed(2) || '0.00'}</div>
                    {truck.driver ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-slate-300 text-xs sm:text-sm">
                          Assigned to: {truck.driver.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-slate-300 text-xs sm:text-sm">
                          Available for assignment
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-6 sm:py-8">
                No active trucks available for assignment
              </div>
            )}
          </CardContent>
        </Card>

        {/* HOS Status Summary */}
        {selectedDriver && selectedDriverData && (
          <Card className="bg-slate-800 border-slate-700 mb-4 sm:mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                <span className="hidden sm:inline">Current Status: {selectedDriverData.name}</span>
                <span className="sm:hidden">Status: {selectedDriverData.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hosLogs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-700 rounded-lg p-3 sm:p-4">
                    <div className="text-slate-300 text-xs sm:text-sm">Current Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-3 h-3 rounded-full ${dutyStatusColors[hosLogs[0]?.dutyStatus as keyof typeof dutyStatusColors] || 'bg-slate-600'}`}></div>
                      <span className="text-white font-medium text-sm sm:text-base">
                        {dutyStatusLabels[hosLogs[0]?.dutyStatus as keyof typeof dutyStatusLabels] || hosLogs[0]?.dutyStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-3 sm:p-4">
                    <div className="text-slate-300 text-xs sm:text-sm">Drive Time Remaining</div>
                    <div className="text-white font-medium text-base sm:text-lg">
                      {hosLogs[0]?.driveTimeRemaining !== null ? `${hosLogs[0]?.driveTimeRemaining}h` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-3 sm:p-4">
                    <div className="text-slate-300 text-xs sm:text-sm">On-Duty Remaining</div>
                    <div className="text-white font-medium text-base sm:text-lg">
                      {hosLogs[0]?.onDutyRemaining !== null ? `${hosLogs[0]?.onDutyRemaining}h` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-3 sm:p-4">
                    <div className="text-slate-300 text-xs sm:text-sm">Cycle Hours Remaining</div>
                    <div className="text-white font-medium text-base sm:text-lg">
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
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
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
              <div className="space-y-3 sm:space-y-4">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
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

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {hosLogs.map((log: any) => {
                    const driver = drivers.find((d: any) => d.id === log.driverId);
                    const truck = trucks.find((t: any) => t.id === log.truckId);
                    const violations = getViolationStatus(log);

                    return (
                      <div key={log.id} className="bg-slate-700 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-medium text-sm sm:text-base truncate">
                              {driver?.name || 'Unknown'}
                            </div>
                            <div className="text-slate-400 text-xs sm:text-sm">
                              {driver?.cdlNumber} • {truck?.name || 'Unknown'}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {violations.length > 0 ? (
                              <Badge variant="destructive" className="bg-red-600 text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {violations.length}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-600 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                OK
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-300">Status:</span>
                            <Select 
                              value={log.dutyStatus} 
                              onValueChange={(newStatus) => handleHosStatusChange(log.id, newStatus)}
                              disabled={updateHosStatusMutation.isPending}
                            >
                              <SelectTrigger className={`w-32 h-8 ${dutyStatusColors[log.dutyStatus as keyof typeof dutyStatusColors] || 'bg-slate-600'} text-white border-0 text-xs`}>
                                <SelectValue>
                                  <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${dutyStatusColors[log.dutyStatus as keyof typeof dutyStatusColors] || 'bg-slate-600'}`}></div>
                                    <span className="truncate">{dutyStatusLabels[log.dutyStatus as keyof typeof dutyStatusLabels] || log.dutyStatus}</span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="DRIVING" className="text-white hover:bg-green-600/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Driving
                                  </div>
                                </SelectItem>
                                <SelectItem value="ON_DUTY" className="text-white hover:bg-yellow-600/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    On Duty
                                  </div>
                                </SelectItem>
                                <SelectItem value="OFF_DUTY" className="text-white hover:bg-slate-600/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                    Off Duty
                                  </div>
                                </SelectItem>
                                <SelectItem value="SLEEPER" className="text-white hover:bg-blue-600/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Sleeper
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-300">Time:</span>
                            <span className="text-white">
                              {format(new Date(log.timestamp), "MMM d, h:mm a")}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-300">Location:</span>
                            <span className="text-white truncate ml-2">{log.address || 'No location'}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300">Drive:</span>
                              <span className="text-white">
                                {log.driveTimeRemaining !== null ? `${log.driveTimeRemaining}h` : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300">On-Duty:</span>
                              <span className="text-white">
                                {log.onDutyRemaining !== null ? `${log.onDutyRemaining}h` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
                <div className="text-slate-400 mb-2 text-sm sm:text-base">No HOS logs found</div>
                <div className="text-slate-500 text-xs sm:text-sm px-4">
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