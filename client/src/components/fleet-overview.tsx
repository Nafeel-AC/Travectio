import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Truck, Trash2, MoreVertical, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AddTruckDialog from "./add-truck-dialog";
import { useState } from "react";

export default function FleetOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDemoQuery } = useDemoApi();
  const [selectedTruckForDriver, setSelectedTruckForDriver] = useState<any>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  
  const { data: trucks = [], isLoading, error } = useDemoQuery(
    ["fleet-overview-trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: drivers = [] } = useDemoQuery(
    ["/api/drivers"],
    "/api/drivers",
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const deleteTruckMutation = useMutation({
    mutationFn: async (truckId: string) => {
      await apiRequest(`/api/trucks/${truckId}`, 'DELETE');
    },
    onSuccess: (_, truckId) => {
      const truck = (trucks as any[]).find((t: any) => t.id === truckId);
      toast({
        title: "Truck deleted",
        description: `${truck?.name || 'Truck'} has been removed from your fleet`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "Could not delete truck. Please try again.",
        variant: "destructive",
      });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ truckId, driverId }: { truckId: string; driverId: string }) => {
      await apiRequest(`/api/trucks/${truckId}`, 'PATCH', { 
        currentDriverId: driverId || null 
      });
    },
    onSuccess: () => {
      toast({
        title: "Driver assigned",
        description: selectedDriverId 
          ? `Driver assigned to ${selectedTruckForDriver?.name} successfully`
          : `Driver removed from ${selectedTruckForDriver?.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setIsDriverDialogOpen(false);
      setSelectedTruckForDriver(null);
      setSelectedDriverId("");
    },
    onError: (error) => {
      toast({
        title: "Assignment failed",
        description: "Could not assign driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTruck = (truck: any) => {
    if (window.confirm(`Are you sure you want to delete ${truck.name}? This action cannot be undone and will permanently remove all associated cost data, loads, and planning information from your fleet.`)) {
      deleteTruckMutation.mutate(truck.id);
    }
  };

  const handleAssignDriver = (truck: any) => {
    setSelectedTruckForDriver(truck);
    setSelectedDriverId(truck.currentDriverId || "");
    setIsDriverDialogOpen(true);
  };

  const confirmDriverAssignment = () => {
    assignDriverMutation.mutate({
      truckId: selectedTruckForDriver.id,
      driverId: selectedDriverId
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const getColorByIndex = (index: number) => {
    const colors = [
      'bg-[var(--primary-blue)]',
      'bg-[var(--blue-accent)]', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500'
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--dark-card)] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Fleet Overview</CardTitle>
          <Button
            onClick={() => window.location.href = '/add-truck'}
            size="sm"
            className="text-[var(--primary-blue)] hover:text-[var(--blue-light)] bg-transparent hover:bg-[var(--dark-elevated)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Truck
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Truck</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Driver</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">CPM</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Fixed</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Variable</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Miles</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(trucks as any[]).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Truck className="h-12 w-12 text-gray-500" />
                      <div className="text-gray-400">
                        <p className="text-lg font-medium">No trucks in your fleet yet</p>
                        <p className="text-sm">Add trucks to start managing costs and loads</p>
                      </div>
                      <Button 
                        onClick={() => window.location.href = '/add-truck'}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Truck
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                (trucks as any[]).map((truck: any, index: number) => (
                  <tr
                    key={truck.id}
                    className="border-b border-gray-700 hover:bg-[var(--dark-elevated)] transition-colors"
                  >
                    <td 
                      className="py-3 px-2 cursor-pointer"
                      onClick={() => window.location.href = `/truck/${truck.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${getColorByIndex(index)} rounded-full flex items-center justify-center text-sm font-semibold text-white`}>
                          {getInitials(truck.name)}
                        </div>
                        <span className="text-white font-medium hover:text-blue-400 transition-colors">{truck.name}</span>
                      </div>
                    </td>
                    <td 
                      className="py-3 px-2 text-gray-300 cursor-pointer"
                      onClick={() => window.location.href = `/truck/${truck.id}`}
                    >
                      {truck.driver ? truck.driver.name : 'No driver assigned'}
                    </td>
                    <td 
                      className="py-3 px-2 text-white font-medium cursor-pointer"
                      onClick={() => window.location.href = `/truck/${truck.id}`}
                    >
                      ${truck.costPerMile || '0.00'}
                    </td>
                    <td 
                      className="py-3 px-2 text-gray-300 cursor-pointer"
                      onClick={() => window.location.href = `/truck/${truck.id}`}
                    >
                      ${truck.fixedCosts?.toFixed(2) || '0.00'}
                    </td>
                    <td 
                      className="py-3 px-2 text-gray-300 cursor-pointer"
                      onClick={() => window.location.href = `/truck/${truck.id}`}
                    >
                      ${truck.variableCosts?.toFixed(2) || '0.00'}
                    </td>
                    <td 
                      className="py-3 px-2 text-gray-300 cursor-pointer"
                      onClick={() => window.location.href = `/truck/${truck.id}`}
                    >
                      {truck.totalMiles?.toLocaleString() || '0'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignDriver(truck);
                            }}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Assign Driver
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/truck/${truck.id}`;
                            }}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTruck(truck);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                            disabled={deleteTruckMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteTruckMutation.isPending ? "Deleting..." : "Delete Truck"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Driver Assignment Dialog */}
      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Assign Driver to {selectedTruckForDriver?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Select a driver to assign to this truck, or remove the current assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select 
              value={selectedDriverId} 
              onValueChange={setSelectedDriverId}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select a driver..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem 
                  value="" 
                  className="text-slate-300 hover:bg-slate-700"
                >
                  No driver (unassign)
                </SelectItem>
                {(drivers as any[])
                  .filter((driver: any) => driver.isActive)
                  .map((driver: any) => (
                    <SelectItem 
                      key={driver.id} 
                      value={driver.id}
                      className="text-slate-300 hover:bg-slate-700"
                    >
                      {driver.name} {driver.cdlNumber ? `(${driver.cdlNumber})` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {(drivers as any[]).filter((d: any) => d.isActive).length === 0 && (
              <p className="text-sm text-slate-400 mt-2">
                No active drivers available. Add drivers first to assign them to trucks.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDriverDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDriverAssignment}
              disabled={assignDriverMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {assignDriverMutation.isPending ? 'Assigning...' : 'Assign Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}