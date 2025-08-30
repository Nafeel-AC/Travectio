import { useDemoApi } from "@/hooks/useDemoApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Driver {
  id: string;
  name: string;
  cdlNumber: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface DriverAssignmentSelectProps {
  selectedDriverId: string;
  onDriverChange: (driverId: string) => void;
}

export function DriverAssignmentSelect({ selectedDriverId, onDriverChange }: DriverAssignmentSelectProps) {
  const { useDemoQuery } = useDemoApi();
  const { data: drivers = [], isLoading, error } = useDemoQuery(
    ["/api/drivers"],
    "/api/drivers",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false, // Don't retry on auth errors
    }
  );

  const activeDrivers = drivers.filter(driver => driver.isActive);
  const selectedDriver = drivers.find(driver => driver.id === selectedDriverId);
  
  // Handle authentication errors gracefully
  if (error) {
    console.warn('Driver data unavailable:', error);
  }

  return (
    <Select 
      value={selectedDriverId || "none"} 
      onValueChange={(value) => onDriverChange(value === "none" ? "" : value)}
    >
      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
        <SelectValue placeholder={isLoading ? "Loading drivers..." : error ? "Driver data unavailable" : "Select a driver"}>
          {selectedDriver ? `${selectedDriver.name} (${selectedDriver.cdlNumber})` : selectedDriverId ? "Driver ID: " + selectedDriverId : "No driver assigned"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No driver assigned</SelectItem>
        {error ? (
          <SelectItem value="unavailable" disabled>Driver data unavailable - check permissions</SelectItem>
        ) : (
          activeDrivers.map((driver) => (
            <SelectItem key={driver.id} value={driver.id}>
              {driver.name} ({driver.cdlNumber})
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}