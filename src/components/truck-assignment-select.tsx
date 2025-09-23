import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TruckService } from "@/lib/supabase-client";

interface TruckAssignmentSelectProps {
  selectedTruckId: string | null | undefined;
  onTruckChange: (truckId: string | null) => void;
}

export function TruckAssignmentSelect({ selectedTruckId, onTruckChange }: TruckAssignmentSelectProps) {
  const { data: trucks = [], isLoading, error } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return (
    <Select
      value={selectedTruckId ?? "none"}
      onValueChange={(value) => onTruckChange(value === "none" ? null : value)}
    >
      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
        <SelectValue placeholder={isLoading ? "Loading trucks..." : error ? "Truck data unavailable" : "Select a truck"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No truck assigned</SelectItem>
        {error ? (
          <SelectItem value="unavailable" disabled>Truck data unavailable - check permissions</SelectItem>
        ) : (
          trucks.map((truck: any) => (
            <SelectItem key={truck.id} value={truck.id}>
              {truck.name} {truck.licensePlate ? `(${truck.licensePlate})` : ''}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}



