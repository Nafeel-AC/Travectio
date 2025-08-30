import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Save, X, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DriverAssignmentSelect } from "./driver-assignment-select";

interface TruckEditFormProps {
  truck: any;
  onEditComplete: () => void;
  onDelete: () => void;
}

export function TruckEditForm({ truck, onEditComplete, onDelete }: TruckEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTruck, setEditedTruck] = useState({
    name: truck.name || '',
    vin: truck.vin || '',
    licensePlate: truck.licensePlate || '',
    eldDeviceId: truck.eldDeviceId || '',
    equipmentType: truck.equipmentType || 'Dry Van',
    currentDriverId: truck.currentDriverId || '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTruckMutation = useMutation({
    mutationFn: async (updatedTruck: any) => {
      await apiRequest(`/api/trucks/${truck.id}`, 'PATCH', updatedTruck);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Truck information updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      onEditComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update truck information",
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
        description: `${truck.name} has been deleted from your fleet`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      onDelete();
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
    setEditedTruck({
      name: truck.name || '',
      vin: truck.vin || '',
      licensePlate: truck.licensePlate || '',
      eldDeviceId: truck.eldDeviceId || '',
      equipmentType: truck.equipmentType || 'Dry Van',
      currentDriverId: truck.currentDriverId || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = () => {
    updateTruckMutation.mutate(editedTruck);
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedTruck(prev => ({ ...prev, [field]: value }));
  };

  const confirmDelete = () => {
    deleteTruckMutation.mutate();
  };

  if (isEditing) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Truck Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truck-name" className="text-white">Truck Name *</Label>
              <Input
                id="truck-name"
                value={editedTruck.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., T1063"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment-type" className="text-white">Equipment Type</Label>
              <Select 
                value={editedTruck.equipmentType} 
                onValueChange={(value) => handleFieldChange('equipmentType', value)}
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
            <div className="space-y-2">
              <Label htmlFor="vin" className="text-white">VIN</Label>
              <Input
                id="vin"
                value={editedTruck.vin}
                onChange={(e) => handleFieldChange('vin', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Vehicle Identification Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-plate" className="text-white">License Plate</Label>
              <Input
                id="license-plate"
                value={editedTruck.licensePlate}
                onChange={(e) => handleFieldChange('licensePlate', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., ABC-123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eld-device-id" className="text-white">ELD Device ID</Label>
              <Input
                id="eld-device-id"
                value={editedTruck.eldDeviceId}
                onChange={(e) => handleFieldChange('eldDeviceId', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Electronic Logging Device ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-assignment" className="text-white">Assigned Driver</Label>
              <DriverAssignmentSelect
                selectedDriverId={editedTruck.currentDriverId}
                onDriverChange={(driverId) => handleFieldChange('currentDriverId', driverId)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 pt-4">
            <Button
              onClick={saveChanges}
              disabled={updateTruckMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateTruckMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={cancelEditing}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Truck Information</span>
          <div className="flex items-center gap-2">
            <Button
              onClick={startEditing}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Truck</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Are you sure you want to delete {truck.name}? This action will permanently remove the truck and all associated data including loads, cost breakdowns, and HOS logs. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={deleteTruckMutation.isPending}
                  >
                    {deleteTruckMutation.isPending ? 'Deleting...' : 'Delete Truck'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-400 text-sm">Truck Name</Label>
            <div className="text-white font-medium">{truck.name}</div>
          </div>
          <div>
            <Label className="text-slate-400 text-sm">Equipment Type</Label>
            <div className="text-white font-medium">{truck.equipmentType}</div>
          </div>
          {truck.vin && (
            <div>
              <Label className="text-slate-400 text-sm">VIN</Label>
              <div className="text-white font-mono text-sm">{truck.vin}</div>
            </div>
          )}
          {truck.licensePlate && (
            <div>
              <Label className="text-slate-400 text-sm">License Plate</Label>
              <div className="text-white font-mono text-sm">{truck.licensePlate}</div>
            </div>
          )}
          {truck.eldDeviceId && (
            <div className="md:col-span-2">
              <Label className="text-slate-400 text-sm">ELD Device ID</Label>
              <div className="text-white font-mono text-sm">{truck.eldDeviceId}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}