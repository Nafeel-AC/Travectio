import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Save, X, Truck, User, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface TruckManagementCardProps {
  truck: any;
  compact?: boolean;
}

export function TruckManagementCard({ truck, compact = false }: TruckManagementCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [editData, setEditData] = useState({
    name: truck.name || '',
    equipmentType: truck.equipmentType || 'Dry Van',
    vin: truck.vin || '',
    licensePlate: truck.licensePlate || '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDemoQuery } = useDemoApi();

  const { data: drivers = [] } = useDemoQuery(
    ["/api/drivers"],
    "/api/drivers",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const updateTruckMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest(`/api/trucks/${truck.id}`, 'PATCH', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Truck updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update truck",
        variant: "destructive",
      });
    },
  });

  const deleteTruckMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/trucks/${truck.id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${truck.name} deleted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete truck",
        variant: "destructive",
      });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ driverId }: { driverId: string }) => {
      await apiRequest(`/api/trucks/${truck.id}`, 'PATCH', { 
        currentDriverId: driverId || null 
      });
    },
    onSuccess: () => {
      toast({
        title: "Driver assigned",
        description: selectedDriverId 
          ? `Driver assigned to ${truck.name} successfully`
          : `Driver removed from ${truck.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setIsDriverDialogOpen(false);
      setSelectedDriverId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete truck",
        variant: "destructive",
      });
    },
  });

  const startEditing = () => {
    setEditData({
      name: truck.name || '',
      equipmentType: truck.equipmentType || 'Dry Van',
      vin: truck.vin || '',
      licensePlate: truck.licensePlate || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = () => {
    updateTruckMutation.mutate(editData);
  };

  const handleChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const confirmDelete = () => {
    deleteTruckMutation.mutate();
  };

  const openDriverDialog = () => {
    setSelectedDriverId(truck.currentDriverId || "");
    setIsDriverDialogOpen(true);
  };

  const confirmDriverAssignment = () => {
    assignDriverMutation.mutate({ driverId: selectedDriverId });
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case "Dry Van": return "📦";
      case "Reefer": return "🧊";
      case "Flatbed": return "🏗️";
      case "Step Deck": return "📋";
      case "Lowboy": return "🚛";
      case "Tanker": return "🛢️";
      case "Car Hauler": return "🚗";
      case "Dump Truck": return "🚚";
      default: return "🚛";
    }
  };

  if (isEditing) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">Edit Truck</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={saveChanges}
                size="sm"
                disabled={updateTruckMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-1" />
                {updateTruckMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={cancelEditing}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <Input
                value={editData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Truck name"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Select 
                value={editData.equipmentType} 
                onValueChange={(value) => handleChange('equipmentType', value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dry Van">Dry Van</SelectItem>
                  <SelectItem value="Reefer">Reefer</SelectItem>
                  <SelectItem value="Flatbed">Flatbed</SelectItem>
                  <SelectItem value="Step Deck">Step Deck</SelectItem>
                  <SelectItem value="Lowboy">Lowboy</SelectItem>
                  <SelectItem value="Tanker">Tanker</SelectItem>
                  <SelectItem value="Car Hauler">Car Hauler</SelectItem>
                  <SelectItem value="Dump Truck">Dump Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={editData.vin}
                onChange={(e) => handleChange('vin', e.target.value)}
                placeholder="VIN"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                value={editData.licensePlate}
                onChange={(e) => handleChange('licensePlate', e.target.value)}
                placeholder="License plate"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-2xl">{getEquipmentIcon(truck.equipmentType)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold truncate">{truck.name}</h3>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  truck.isActive ? "bg-green-500" : "bg-gray-500"
                )} />
              </div>
              <div className="space-y-1">
                <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                  {truck.equipmentType}
                </Badge>
                {truck.licensePlate && (
                  <div className="text-xs text-slate-400 font-mono">
                    Plate: {truck.licensePlate}
                  </div>
                )}
                {truck.driver && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <User className="w-3 h-3" />
                    {truck.driver.name}
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  {truck.totalMiles.toLocaleString()} miles • ${truck.costPerMile?.toFixed(3) || '0.000'}/mi
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <Button
              onClick={openDriverDialog}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-blue-400 h-8 w-8 p-0"
              title="Assign Driver"
            >
              <Users className="w-4 h-4" />
            </Button>
            <Link href={`/truck/${truck.id}`}>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-blue-400 h-8 w-8 p-0"
              >
                <Truck className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              onClick={startEditing}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-yellow-400 h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete {truck.name}?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will permanently delete the truck and all associated data (loads, cost breakdowns, HOS logs). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleteTruckMutation.isPending}
                  >
                    {deleteTruckMutation.isPending ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>

      {/* Driver Assignment Dialog */}
      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Assign Driver to {truck.name}
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
                {drivers
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
            {drivers.filter((d: any) => d.isActive).length === 0 && (
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