import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DriverEditForm } from "./driver-edit-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDrivers } from "@/hooks/useSupabase";
import { TruckService } from "@/lib/supabase-client";
import { TruckAssignmentSelect } from "./truck-assignment-select";
import { 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Loader2,
  Save,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Driver {
  id: string;
  name: string;
  cdlNumber: string;
  phone?: string;
  email?: string;
  licenseState?: string;
  isActive: boolean;
  createdAt: string;
}

interface DriverManagementCardProps {
  driver: Driver;
  assignedTrucks?: number;
  onUpdate: (updatedDriver: Driver) => void;
}

export function DriverManagementCard({ driver, assignedTrucks = 0, onUpdate }: DriverManagementCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { updateDriver, deleteDriver } = useDrivers();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: trucks = [] } = useQuery({
    queryKey: ["trucks"],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const currentlyAssignedTruckId: string | null = (trucks.find((t: any) => t.currentDriverId === driver.id)?.id) || null;
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(currentlyAssignedTruckId);

  const deleteDriverMutation = useMutation({
    mutationFn: async () => {
      // Use the deleteDriver method from useDrivers hook
      await deleteDriver(driver.id);
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      toast({
        title: "Driver Deleted",
        description: `${driver.name} has been removed from the system.`,
      });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete driver. They may be assigned to active trucks.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteDriverMutation.mutate();
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedDriver, setEditedDriver] = useState(driver);

  const handleSave = async () => {
    try {
      await updateDriver(driver.id, editedDriver);
      onUpdate(editedDriver);
      setIsEditing(false);
      toast({
        title: "Driver Updated",
        description: "Driver information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update driver information.",
        variant: "destructive",
      });
    }
  };

  const assignDriverMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTruckId) {
        // If no truck chosen, unassign from any currently assigned truck (if any)
        if (currentlyAssignedTruckId) {
          return await TruckService.assignDriverToTruck(currentlyAssignedTruckId, null);
        }
        return null;
      }
      return await TruckService.assignDriverToTruck(selectedTruckId, driver.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      // Invalidate the specific truck profiles affected
      if (selectedTruckId) {
        queryClient.invalidateQueries({ queryKey: ["truck", selectedTruckId] });
      }
      if (currentlyAssignedTruckId && currentlyAssignedTruckId !== selectedTruckId) {
        queryClient.invalidateQueries({ queryKey: ["truck", currentlyAssignedTruckId] });
      }
      toast({
        title: "Assignment updated",
        description: selectedTruckId ? `${driver.name} assigned successfully` : `${driver.name} unassigned from truck`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Assignment failed",
        description: error?.message || "Could not update assignment",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2 min-w-0 flex-1">
              <div className="p-2 bg-blue-600/20 rounded-lg flex-shrink-0">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <span className="truncate">{driver.name}</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={driver.isActive 
                ? "bg-green-600/20 text-green-200 border-green-600/30 text-xs" 
                : "bg-red-600/20 text-red-200 border-red-600/30 text-xs"
              }>
                {driver.isActive ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertTriangle className="w-3 h-3 mr-1" />
                )}
                <span className="hidden sm:inline">{driver.isActive ? "Active" : "Inactive"}</span>
                <span className="sm:hidden">{driver.isActive ? "✓" : "✗"}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Driver Details */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-300">CDL:</span>
              <span className="text-white font-medium truncate">{driver.cdlNumber}</span>
              {driver.licenseState && (
                <span className="text-slate-400 text-xs">({driver.licenseState})</span>
              )}
            </div>
            
            {driver.phoneNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-300">Phone:</span>
                <span className="text-white truncate">{driver.phoneNumber}</span>
              </div>
            )}
            
            {driver.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-300">Email:</span>
                <span className="text-white truncate">{driver.email}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-300">Added:</span>
              <span className="text-white">
                {formatDistanceToNow(new Date(driver.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="space-y-2">
            {assignedTrucks > 0 && (
              <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-blue-200 text-sm font-medium">
                    Assigned to {assignedTrucks} truck{assignedTrucks !== 1 ? 's' : ''}
                  </span>
                </div>
                {currentlyAssignedTruckId && (
                  <div className="pl-4 space-y-1">
                    {trucks.filter((t: any) => t.currentDriverId === driver.id).map((truck: any) => (
                      <div key={truck.id} className="text-blue-100 text-sm">
                        <div className="font-medium">Truck: {truck.name}</div>
                        <div className="text-xs text-blue-200">License: {truck.licensePlate}</div>
                        <div className="text-xs text-blue-200">Type: {truck.equipmentType}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <div className="text-slate-300 text-sm">Assign to Truck</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <TruckAssignmentSelect
                    selectedTruckId={selectedTruckId}
                    onTruckChange={setSelectedTruckId}
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => assignDriverMutation.mutate()}
                  disabled={assignDriverMutation.isPending}
                >
                  {assignDriverMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <Button
                onClick={() => setShowEditDialog(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex-1 h-9 sm:h-10"
              >
                <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit Driver</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              
              <Button
                onClick={() => setShowDeleteDialog(true)}
                size="sm"
                variant="destructive"
                disabled={assignedTrucks > 0}
                className="flex-1 h-9 sm:h-10"
              >
                <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
                <span className="sm:hidden">Del</span>
              </Button>
            </div>
          </div>
          
          {assignedTrucks > 0 && (
            <div className="mt-2">
              <Badge variant="secondary" className="bg-slate-600 text-slate-300 text-xs">
                Cannot delete - assigned to trucks
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Driver Information</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm sm:text-base">
              Update {driver.name}'s profile information and status.
            </DialogDescription>
          </DialogHeader>
          <DriverEditForm
            driver={driver}
            compact={true}
            onSave={() => setShowEditDialog(false)}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white mx-4 sm:mx-0 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Delete Driver
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-sm sm:text-base">
              Are you sure you want to delete <strong className="text-white">{driver.name}</strong>? 
              This action cannot be undone and will remove all driver records from the system.
              
              {assignedTrucks > 0 && (
                <div className="mt-3 p-3 bg-red-600/10 rounded-lg border border-red-600/20">
                  <p className="text-red-200 text-sm font-medium">
                    This driver is currently assigned to {assignedTrucks} truck{assignedTrucks !== 1 ? 's' : ''}. 
                    Please reassign or remove them from trucks before deletion.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteDriverMutation.isPending || assignedTrucks > 0}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {deleteDriverMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Driver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DriverManagementCard;