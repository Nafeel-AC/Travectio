import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fuel, Edit, Trash2, Link, MapPin, Calendar, DollarSign, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import { useDemoApi } from "@/hooks/useDemoApi";
import { format } from "date-fns";

interface FuelPurchase {
  id: string;
  loadId: string | null;
  truckId: string;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  stationName: string;
  stationAddress: string;
  purchaseDate: string;
  receiptNumber?: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

interface Load {
  id: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  status: string;
  pay: number;
}

interface Truck {
  id: string;
  name: string;
  licensePlate: string;
}

export function FuelManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDemoQuery } = useDemoApi();
  const [selectedPurchase, setSelectedPurchase] = useState<FuelPurchase | null>(null);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<FuelPurchase | null>(null);
  const [editForm, setEditForm] = useState({
    gallons: 0,
    pricePerGallon: 0,
    totalCost: 0,
    stationName: "",
    stationAddress: "",
    purchaseDate: "",
    receiptNumber: "",
    paymentMethod: "",
    notes: "",
    truckId: ""
  });

  // Fetch all fuel purchases
  const { data: fuelPurchases = [], isLoading } = useDemoQuery(
    ["fuel-management-purchases"],
    "/api/fuel-purchases",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Fetch loads for attachment
  const { data: loads = [] } = useDemoQuery(
    ["fuel-management-loads"],
    "/api/loads",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Fetch trucks
  const { data: trucks = [] } = useDemoQuery(
    ["fuel-management-trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Delete fuel purchase mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/fuel-purchases/${id}`, "DELETE"),
    ...createSynchronizedMutation(queryClient, 'all'), // Comprehensive synchronization
    onSuccess: () => {
      toast({
        title: "Fuel Purchase Deleted & Synchronized",
        description: "The fuel purchase has been removed and all metrics updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update fuel purchase mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/fuel-purchases/${id}`, "PUT", data),
    ...createSynchronizedMutation(queryClient, 'all'), // Comprehensive synchronization
    onSuccess: () => {
      setEditingPurchase(null);
      toast({
        title: "Fuel Purchase Updated & Synchronized",
        description: "The fuel purchase has been updated and all fleet metrics synchronized successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Attach to load mutation
  const attachMutation = useMutation({
    mutationFn: ({ purchaseId, loadId }: { purchaseId: string; loadId: string | null }) =>
      apiRequest(`/api/fuel-purchases/${purchaseId}/attach`, "PATCH", { loadId }),
    ...createSynchronizedMutation(queryClient, 'all'), // Comprehensive synchronization
    onSuccess: () => {
      setShowAttachDialog(false);
      setSelectedPurchase(null);
      toast({
        title: "Attachment Updated & Synchronized",
        description: "Fuel purchase has been attached to the load and all fleet metrics updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Attachment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTruckName = (truckId: string) => {
    const truck = trucks.find((t: Truck) => t.id === truckId);
    return truck ? `${truck.name} (${truck.licensePlate})` : "Unknown Truck";
  };

  const getLoadName = (loadId: string | null) => {
    if (!loadId) return "Unattached";
    const load = loads.find((l: Load) => l.id === loadId);
    return load ? `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}` : "Unknown Load";
  };

  const handleAttach = (loadId: string | null) => {
    if (selectedPurchase) {
      attachMutation.mutate({ purchaseId: selectedPurchase.id, loadId });
    }
  };

  const handleEditStart = (purchase: FuelPurchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      gallons: purchase.gallons,
      pricePerGallon: purchase.pricePerGallon,
      totalCost: purchase.totalCost,
      stationName: purchase.stationName,
      stationAddress: purchase.stationAddress,
      purchaseDate: purchase.purchaseDate.split('T')[0], // Format for date input
      receiptNumber: purchase.receiptNumber || "",
      paymentMethod: purchase.paymentMethod,
      notes: purchase.notes || "",
      truckId: purchase.truckId,
      fuelType: purchase.fuelType || 'diesel'
    });
  };

  const handleEditSave = () => {
    if (!editingPurchase) return;
    
    updateMutation.mutate({
      id: editingPurchase.id,
      data: editForm
    });
  };

  const handleEditCancel = () => {
    setEditingPurchase(null);
    setEditForm({
      gallons: 0,
      pricePerGallon: 0,
      totalCost: 0,
      stationName: "",
      stationAddress: "",
      purchaseDate: "",
      receiptNumber: "",
      paymentMethod: "",
      notes: "",
      truckId: "",
      fuelType: "diesel"
    });
  };

  // Calculate totals
  const totalGallons = fuelPurchases.reduce((sum: number, purchase: FuelPurchase) => sum + purchase.gallons, 0);
  const totalCost = fuelPurchases.reduce((sum: number, purchase: FuelPurchase) => sum + purchase.totalCost, 0);
  const avgPricePerGallon = totalGallons > 0 ? totalCost / totalGallons : 0;
  const unattachedCount = fuelPurchases.filter((p: FuelPurchase) => !p.loadId).length;

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">Loading fuel purchases...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{fuelPurchases.length}</div>
                <div className="text-slate-400 text-sm">Total Purchases</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</div>
                <div className="text-slate-400 text-sm">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">{totalGallons.toFixed(1)}</div>
                <div className="text-slate-400 text-sm">Total Gallons</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link className="h-5 w-5 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-white">{unattachedCount}</div>
                <div className="text-slate-400 text-sm">Unattached</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Purchases Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Fuel Purchase History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fuelPurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left text-slate-300 py-3 px-4">Date & Station</th>
                    <th className="text-left text-slate-300 py-3 px-4">Truck</th>
                    <th className="text-left text-slate-300 py-3 px-4">Fuel Details</th>
                    <th className="text-left text-slate-300 py-3 px-4">Load Assignment</th>
                    <th className="text-left text-slate-300 py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelPurchases.map((purchase: FuelPurchase) => (
                    <tr key={purchase.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-white text-sm font-medium">
                            {format(new Date(purchase.purchaseDate), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                          <div className="text-slate-400 text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {purchase.stationName}
                          </div>
                          <div className="text-slate-500 text-xs">{purchase.stationAddress}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-white text-sm">{getTruckName(purchase.truckId)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-white text-sm font-medium">
                            {purchase.gallons.toFixed(1)} gal @ ${purchase.pricePerGallon.toFixed(3)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={purchase.fuelType === 'diesel' ? "default" : "secondary"}
                              className="text-xs uppercase"
                            >
                              {purchase.fuelType === 'diesel' ? 'Diesel' : 'DEF'}
                            </Badge>
                            <div className="text-green-400 text-sm font-bold">
                              ${purchase.totalCost.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant={purchase.loadId ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {purchase.loadId ? "Attached" : "Unattached"}
                        </Badge>
                        <div className="text-slate-400 text-xs mt-1">
                          {getLoadName(purchase.loadId)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(purchase)}
                            className="h-8 w-8 p-0"
                            title="Edit Purchase"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setShowAttachDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="Attach to Load"
                          >
                            <Link className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(purchase.id)}
                            className="h-8 w-8 p-0"
                            disabled={deleteMutation.isPending}
                            title="Delete Purchase"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Fuel className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <div className="text-slate-400 mb-2">No fuel purchases found</div>
              <div className="text-slate-500 text-sm">Add fuel purchases to track costs and profitability</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Fuel Purchase Dialog */}
      <Dialog open={!!editingPurchase} onOpenChange={() => editingPurchase && handleEditCancel()}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Fuel Purchase</DialogTitle>
          </DialogHeader>
          {editingPurchase && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Gallons</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.gallons}
                  onChange={(e) => setEditForm(prev => ({ ...prev, gallons: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Price per Gallon</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={editForm.pricePerGallon}
                  onChange={(e) => setEditForm(prev => ({ ...prev, pricePerGallon: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Total Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.totalCost}
                  onChange={(e) => setEditForm(prev => ({ ...prev, totalCost: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Purchase Date</Label>
                <Input
                  type="date"
                  value={editForm.purchaseDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Station Name</Label>
                <Input
                  type="text"
                  value={editForm.stationName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, stationName: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Station Address</Label>
                <Input
                  type="text"
                  value={editForm.stationAddress}
                  onChange={(e) => setEditForm(prev => ({ ...prev, stationAddress: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Receipt Number</Label>
                <Input
                  type="text"
                  value={editForm.receiptNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Payment Method</Label>
                <Select 
                  value={editForm.paymentMethod} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Credit Card" className="text-white">Credit Card</SelectItem>
                    <SelectItem value="Debit Card" className="text-white">Debit Card</SelectItem>
                    <SelectItem value="Fleet Card" className="text-white">Fleet Card</SelectItem>
                    <SelectItem value="Cash" className="text-white">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Truck</Label>
                <Select 
                  value={editForm.truckId} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, truckId: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {trucks.map((truck: Truck) => (
                      <SelectItem key={truck.id} value={truck.id} className="text-white">
                        {truck.name} ({truck.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-300">Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>
              
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleEditCancel}
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attach to Load Dialog */}
      <Dialog open={showAttachDialog} onOpenChange={setShowAttachDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Attach Fuel Purchase to Load</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPurchase && (
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="text-white font-medium">
                  {selectedPurchase.gallons.toFixed(1)} gallons at {selectedPurchase.stationName}
                </div>
                <div className="text-slate-400 text-sm">
                  ${selectedPurchase.totalCost.toFixed(2)} on {format(new Date(selectedPurchase.purchaseDate), "MMM d, yyyy")}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">Select Load</label>
              <Select
                value={selectedPurchase?.loadId || ""}
                onValueChange={(value) => handleAttach(value === "unattach" ? null : value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Choose a load..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="unattach" className="text-white">
                    🔗 Unattach from any load
                  </SelectItem>
                  {loads.map((load: Load) => (
                    <SelectItem key={load.id} value={load.id} className="text-white">
                      {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState} (${load.pay})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}