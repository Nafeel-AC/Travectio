import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, User, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface HOSData {
  driverId: string;
  driverName: string;
  truckId?: string;
  dutyStatus: string;
  driveTimeRemaining: number;
  onDutyRemaining: number;
  cycleHoursRemaining: number;
  violations: string[];
  lastUpdate: string;
}

interface ComplianceOverview {
  totalActiveDrivers: number;
  driversInViolation: number;
  driversWithLowHours: number;
  complianceRate: number;
  driverDetails: HOSData[];
}

export default function HOSDashboard() {
  // TODO: Implement proper compliance service
  const { data: compliance, isLoading } = useQuery({
    queryKey: ['compliance-overview'],
    queryFn: () => Promise.resolve({
      totalActiveDrivers: 0,
      violations: [],
      alerts: []
    }), // Placeholder
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const getDutyStatusColor = (status: string) => {
    switch (status) {
      case "DRIVING":
        return "bg-green-500";
      case "ON_DUTY":
        return "bg-yellow-500";
      case "OFF_DUTY":
        return "bg-gray-500";
      case "SLEEPER_BERTH":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDutyStatusText = (status: string) => {
    switch (status) {
      case "DRIVING":
        return "Driving";
      case "ON_DUTY":
        return "On Duty";
      case "OFF_DUTY":
        return "Off Duty";
      case "SLEEPER_BERTH":
        return "Sleeper";
      default:
        return status;
    }
  };

  const getHoursColor = (hours: number, type: "drive" | "duty" | "cycle") => {
    if (type === "drive") {
      if (hours <= 1) return "text-red-400";
      if (hours <= 3) return "text-yellow-400";
      return "text-green-400";
    }
    if (type === "duty") {
      if (hours <= 2) return "text-red-400";
      if (hours <= 4) return "text-yellow-400";
      return "text-green-400";
    }
    if (type === "cycle") {
      if (hours <= 10) return "text-red-400";
      if (hours <= 20) return "text-yellow-400";
      return "text-green-400";
    }
    return "text-gray-400";
  };

  if (isLoading) {
    return (
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Hours of Service Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-600 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Drivers</p>
                <p className="text-2xl font-bold text-white">{compliance?.totalActiveDrivers || 0}</p>
              </div>
              <User className="w-8 h-8 text-[var(--primary-blue)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-400">{compliance?.complianceRate || 0}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Violations</p>
                <p className="text-2xl font-bold text-red-400">{compliance?.driversInViolation || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--dark-card)] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Low Hours</p>
                <p className="text-2xl font-bold text-yellow-400">{compliance?.driversWithLowHours || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Status Details */}
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Driver Status Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!compliance?.driverDetails?.length ? (
              <p className="text-gray-400 text-center py-8">No active drivers found</p>
            ) : (
              compliance.driverDetails.map((driver) => (
                <div
                  key={driver.driverId}
                  className="bg-[var(--dark-elevated)] rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[var(--primary-blue)] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{driver.driverName}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={`${getDutyStatusColor(driver.dutyStatus)} text-white text-xs`}
                          >
                            {getDutyStatusText(driver.dutyStatus)}
                          </Badge>
                          {driver.truckId && (
                            <span className="text-gray-400 text-sm flex items-center">
                              <Truck className="w-3 h-3 mr-1" />
                              {driver.truckId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Last Update</p>
                      <p className="text-white text-sm">
                        {formatDistanceToNow(new Date(driver.lastUpdate), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Drive Time</p>
                      <p className={`font-semibold ${getHoursColor(driver.driveTimeRemaining, "drive")}`}>
                        {driver.driveTimeRemaining.toFixed(1)}h remaining
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">On Duty</p>
                      <p className={`font-semibold ${getHoursColor(driver.onDutyRemaining, "duty")}`}>
                        {driver.onDutyRemaining.toFixed(1)}h remaining
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Cycle Hours</p>
                      <p className={`font-semibold ${getHoursColor(driver.cycleHoursRemaining, "cycle")}`}>
                        {driver.cycleHoursRemaining.toFixed(1)}h remaining
                      </p>
                    </div>
                  </div>

                  {driver.violations.length > 0 && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-medium">
                          {driver.violations.length} violation(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}