import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Fuel, Edit, Trash2, Link, Unlink, Plus, MapPin, Calendar, DollarSign, Truck, ArrowLeft, Save, X, Eye, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useOrgFuelPurchases, useOrgTrucks, useOrgLoads, useCreateOrgFuelPurchase, useUpdateOrgFuelPurchase, useDeleteOrgFuelPurchase, useRoleAccess } from "@/hooks/useOrgData";
import { useOrgRole } from "@/lib/org-role-context";

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
  miles: number;
}

interface Truck {
  id: string;
  name: string;
  licensePlate: string;
}

export default function FuelManagementPage() {
  const [selectedTab, setSelectedTab] = useState("unattached");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<FuelPurchase | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<FuelPurchase | null>(null);
  const [editForm, setEditForm] = useState({
    gallons: 0,
    pricePerGallon: 0,
    totalCost: 0,
    purchaseDate: "",
    stationName: "",
    stationAddress: "",
    receiptNumber: "",
    paymentMethod: "",
    notes: "",
    truckId: "",
    fuelType: "diesel"
  });
  const { toast } = useToast();
  const { role } = useOrgRole();
  const roleAccess = useRoleAccess();
  const [, setLocation] = useLocation();

  // Use organization-aware hooks
  const { data: allPurchases = [], isLoading: purchasesLoading, error: purchasesError } = useOrgFuelPurchases();
  const { data: trucks = [], isLoading: trucksLoading, error: trucksError } = useOrgTrucks();
  const { data: loads = [], isLoading: loadsLoading, error: loadsError } = useOrgLoads();
  const createFuelPurchaseMutation = useCreateOrgFuelPurchase();
  const updateFuelPurchaseMutation = useUpdateOrgFuelPurchase();
  const deleteFuelPurchaseMutation = useDeleteOrgFuelPurchase();

  // Filter purchases
  const unattachedPurchases = (allPurchases as FuelPurchase[]).filter(p => !p.loadId);
  const attachedPurchases = (allPurchases as FuelPurchase[]).filter(p => p.loadId);

  // Create fuel purchase mutation (organization-aware)
  const createPurchaseMutation = createFuelPurchaseMutation;

  // Attach purchase to load (organization-aware uses update mutation)
  const attachPurchaseMutation = updateFuelPurchaseMutation;

  // Detach purchase from load (organization-aware uses update mutation)
  const detachPurchaseMutation = updateFuelPurchaseMutation;

  // Delete purchase mutation (organization-aware)
  const deletePurchaseMutation = deleteFuelPurchaseMutation;

  // Update purchase mutation (organization-aware)
  const updatePurchaseMutation = updateFuelPurchaseMutation;

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      truckId: formData.get("truckId") as string,
      fuelType: formData.get("fuelType") as string,
      gallons: parseFloat(formData.get("gallons") as string),
      pricePerGallon: parseFloat(formData.get("pricePerGallon") as string),
      totalCost: parseFloat(formData.get("gallons") as string) * parseFloat(formData.get("pricePerGallon") as string),
      stationName: formData.get("stationName") as string,
      stationAddress: formData.get("stationAddress") as string,
      purchaseDate: new Date(formData.get("purchaseDate") as string).toISOString(),
      receiptNumber: formData.get("receiptNumber") as string || null,
      paymentMethod: formData.get("paymentMethod") as string,
      notes: formData.get("notes") as string || null,
    };
    createPurchaseMutation.mutate(data);
  };

  const handleAttachToLoad = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const loadId = formData.get("loadId") as string;
    if (selectedPurchase && loadId) {
      attachPurchaseMutation.mutate({ purchaseId: selectedPurchase.id, updates: { loadId } });
    }
  };

  const getTruckName = (truckId: string) => {
    const truck = (trucks as Truck[]).find(t => t.id === truckId);
    return truck ? `${truck.name} (${truck.licensePlate})` : "Unknown Truck";
  };

  const getLoadDetails = (loadId: string) => {
    const load = (loads as Load[]).find(l => l.id === loadId);
    return load ? `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}` : "Unknown Load";
  };

  const handleEditPurchase = (purchase: FuelPurchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      gallons: purchase.gallons,
      pricePerGallon: purchase.pricePerGallon,
      totalCost: purchase.totalCost,
      purchaseDate: new Date(purchase.purchaseDate).toISOString().slice(0, 16),
      stationName: purchase.stationName,
      stationAddress: purchase.stationAddress,
      receiptNumber: purchase.receiptNumber || "",
      paymentMethod: purchase.paymentMethod,
      notes: purchase.notes || "",
      truckId: purchase.truckId,
      fuelType: (purchase as any).fuelType || "diesel"
    });
  };

  const handleEditCancel = () => {
    setEditingPurchase(null);
    setEditForm({
      gallons: 0,
      pricePerGallon: 0,
      totalCost: 0,
      purchaseDate: "",
      stationName: "",
      stationAddress: "",
      receiptNumber: "",
      paymentMethod: "",
      notes: "",
      truckId: "",
      fuelType: "diesel"
    });
  };

  const handleEditSave = () => {
    if (!editingPurchase) return;
    
    const data = {
      gallons: editForm.gallons,
      pricePerGallon: editForm.pricePerGallon,
      totalCost: editForm.totalCost,
      stationName: editForm.stationName,
      stationAddress: editForm.stationAddress,
      purchaseDate: new Date(editForm.purchaseDate).toISOString(),
      receiptNumber: editForm.receiptNumber || null,
      paymentMethod: editForm.paymentMethod,
      notes: editForm.notes || null,
      truckId: editForm.truckId,
      fuelType: editForm.fuelType,
    };
    
    updatePurchaseMutation.mutate({ purchaseId: editingPurchase.id, updates: data });
  };

  if (purchasesLoading) {
    return <div className="p-6">Loading fuel purchases...</div>;
  }

  // Show error messages if any queries failed
  if (purchasesError || trucksError || loadsError) {
    return (
      <div className="p-6">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
          <h3 className="text-red-200 font-semibold mb-2">Error Loading Data</h3>
          {purchasesError && (
            <p className="text-red-300 text-sm mb-1">Fuel purchases: {purchasesError.message}</p>
          )}
          {trucksError && (
            <p className="text-red-300 text-sm mb-1">Trucks: {trucksError.message}</p>
          )}
          {loadsError && (
            <p className="text-red-300 text-sm mb-1">Loads: {loadsError.message}</p>
          )}
          <p className="text-red-400 text-xs mt-2">Please check your connection and try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back to Dashboard Button */}
      <div className="mb-4">
        <Button
          onClick={() => setLocation("/")}
          variant="outline"
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Fuel className="h-8 w-8" />
            {role === 'driver' ? 'My Fuel Purchases' : 'Fuel Management'}
          </h1>
          <p className="text-slate-400 mt-2">
            {role === 'driver' 
              ? 'Track your fuel purchases and expenses'
              : 'Complete fuel tracking, purchase management, and load expense allocation'
            }
          </p>
          
          {/* Role-based info */}
          {role === 'driver' && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 text-blue-300">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Driver View: Showing fuel purchases for your assigned truck only</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {roleAccess.canCreateData && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {role === 'driver' ? 'Add Fuel Purchase' : 'Create Fuel Purchase'}
            </Button>
          )}
          
          {!roleAccess.canCreateData && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Lock className="h-4 w-4" />
              <span>View Only - Contact dispatcher to add fuel purchases</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Fuel Purchase Dialog */}
      {roleAccess.canCreateData && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Fuel Purchase</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="truckId" className="text-white">Truck</Label>
                  <Select name="truckId" required>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select truck" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {(trucks as Truck[]).map((truck) => (
                        <SelectItem key={truck.id} value={truck.id} className="text-white">
                          {truck.name} ({truck.licensePlate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="purchaseDate" className="text-white">Purchase Date</Label>
                  <Input
                    name="purchaseDate"
                    type="datetime-local"
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
                             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="fuelType" className="text-white">Fuel Type</Label>
                   <Select name="fuelType" required defaultValue="diesel">
                     <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                       <SelectValue placeholder="Select fuel type" />
                     </SelectTrigger>
                     <SelectContent className="bg-slate-700 border-slate-600">
                       <SelectItem value="diesel" className="text-white">Diesel</SelectItem>
                       <SelectItem value="def" className="text-white">DEF (Diesel Exhaust Fluid)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="paymentMethod" className="text-white">Payment Method</Label>
                   <Select name="paymentMethod" required defaultValue="Company Card">
                     <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                       <SelectValue placeholder="Select method" />
                     </SelectTrigger>
                     <SelectContent className="bg-slate-700 border-slate-600">
                       <SelectItem value="Company Card" className="text-white">Company Card</SelectItem>
                       <SelectItem value="Cash" className="text-white">Cash</SelectItem>
                       <SelectItem value="Fleet Card" className="text-white">Fleet Card</SelectItem>
                       <SelectItem value="Personal Card" className="text-white">Personal Card</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="gallons" className="text-white">Gallons</Label>
                   <Input
                     name="gallons"
                     type="number"
                     step="0.1"
                     required
                     className="bg-slate-700 border-slate-600 text-white"
                     placeholder="25.5"
                   />
                 </div>
                 <div>
                   <Label htmlFor="pricePerGallon" className="text-white">Price per Gallon</Label>
                   <Input
                     name="pricePerGallon"
                     type="number"
                     step="0.001"
                     required
                     className="bg-slate-700 border-slate-600 text-white"
                     placeholder="3.899"
                   />
                 </div>
               </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stationName" className="text-white">Station Name</Label>
                  <Input
                    name="stationName"
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Shell, Pilot, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="receiptNumber" className="text-white">Receipt Number</Label>
                  <Input
                    name="receiptNumber"
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="stationAddress" className="text-white">Station Address</Label>
                <Input
                  name="stationAddress"
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-white">Notes</Label>
                <Input
                  name="notes"
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPurchaseMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createPurchaseMutation.isPending ? "Creating..." : "Create Purchase"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Unlink className="h-5 w-5 text-yellow-400" />
              Unattached Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{unattachedPurchases.length}</div>
            <p className="text-slate-400 text-sm">Fuel purchases not linked to loads</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Link className="h-5 w-5 text-green-400" />
              Attached Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{attachedPurchases.length}</div>
            <p className="text-slate-400 text-sm">Fuel purchases linked to loads</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              ${(allPurchases as FuelPurchase[]).reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)}
            </div>
            <p className="text-slate-400 text-sm">All fuel purchases combined</p>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Purchases Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="unattached" className="text-slate-300 data-[state=active]:text-white">
            Unattached ({unattachedPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="attached" className="text-slate-300 data-[state=active]:text-white">
            Attached ({attachedPurchases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unattached" className="space-y-4">
          <div className="text-white mb-4">
            <h3 className="text-xl font-semibold">Unattached Fuel Purchases</h3>
            <p className="text-slate-400">These purchases are not linked to any specific load yet.</p>
          </div>
          
          {unattachedPurchases.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <Fuel className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No unattached fuel purchases found.</p>
                <p className="text-slate-500 text-sm mt-2">Create a fuel purchase without selecting a load to see it here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {unattachedPurchases.map((purchase) => (
                <Card key={purchase.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-400" />
                            <span className="text-white font-medium">{getTruckName(purchase.truckId)}</span>
                          </div>
                          <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                            Unattached
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Gallons:</span>
                            <div className="text-white font-medium">{purchase.gallons}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Price/Gal:</span>
                            <div className="text-white font-medium">${purchase.pricePerGallon.toFixed(3)}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Cost:</span>
                            <div className="text-green-400 font-medium">${purchase.totalCost.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Date:</span>
                            <div className="text-white font-medium">{format(new Date(purchase.purchaseDate), 'MMM dd, yyyy')}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <MapPin className="h-3 w-3" />
                            {purchase.stationName} - {purchase.stationAddress}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPurchase(purchase)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setShowAttachDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Attach to Load
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePurchaseMutation.mutate(purchase.id)}
                          disabled={deletePurchaseMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attached" className="space-y-4">
          <div className="text-white mb-4">
            <h3 className="text-xl font-semibold">Attached Fuel Purchases</h3>
            <p className="text-slate-400">These purchases are linked to specific loads and affect profitability calculations.</p>
          </div>
          
          {attachedPurchases.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <Link className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No attached fuel purchases found.</p>
                <p className="text-slate-500 text-sm mt-2">Attach unattached purchases to loads to see them here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {attachedPurchases.map((purchase) => (
                <Card key={purchase.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-400" />
                            <span className="text-white font-medium">{getTruckName(purchase.truckId)}</span>
                          </div>
                          <Badge variant="outline" className="border-green-600 text-green-400">
                            Attached
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-300 mb-3">
                          <strong>Load:</strong> {getLoadDetails(purchase.loadId!)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Gallons:</span>
                            <div className="text-white font-medium">{purchase.gallons}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Price/Gal:</span>
                            <div className="text-white font-medium">${purchase.pricePerGallon.toFixed(3)}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Cost:</span>
                            <div className="text-green-400 font-medium">${purchase.totalCost.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Date:</span>
                            <div className="text-white font-medium">{format(new Date(purchase.purchaseDate), 'MMM dd, yyyy')}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <MapPin className="h-3 w-3" />
                            {purchase.stationName} - {purchase.stationAddress}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPurchase(purchase)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => detachPurchaseMutation.mutate({ purchaseId: purchase.id, updates: { loadId: null } })}
                          disabled={detachPurchaseMutation.isPending}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Detach
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePurchaseMutation.mutate(purchase.id)}
                          disabled={deletePurchaseMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Attach to Load Dialog */}
      <Dialog open={showAttachDialog} onOpenChange={setShowAttachDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Attach Fuel Purchase to Load</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="text-white font-medium mb-2">Fuel Purchase Details</h4>
                <div className="text-sm text-slate-300">
                  <div>Truck: {getTruckName(selectedPurchase.truckId)}</div>
                  <div>Amount: {selectedPurchase.gallons} gallons @ ${selectedPurchase.pricePerGallon.toFixed(3)}/gal</div>
                  <div>Total: ${selectedPurchase.totalCost.toFixed(2)}</div>
                </div>
              </div>
              <form onSubmit={handleAttachToLoad}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loadId" className="text-white">Select Load</Label>
                    <Select name="loadId" required>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Choose a load" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {(loads as Load[]).map((load) => (
                          <SelectItem key={load.id} value={load.id} className="text-white">
                            {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState} (${load.pay})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAttachDialog(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={attachPurchaseMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {attachPurchaseMutation.isPending ? "Attaching..." : "Attach to Load"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Fuel Purchase Dialog */}
      <Dialog open={!!editingPurchase} onOpenChange={(open) => !open && handleEditCancel()}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Fuel Purchase</DialogTitle>
          </DialogHeader>
          {editingPurchase && (
                         <div className="space-y-4">
               <div className="grid grid-cols-3 gap-4">
                 <div>
                   <Label htmlFor="edit-fuelType" className="text-white">Fuel Type</Label>
                   <Select 
                     value={editForm.fuelType} 
                     onValueChange={(value) => setEditForm({ ...editForm, fuelType: value })}
                   >
                     <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="bg-slate-700 border-slate-600">
                       <SelectItem value="diesel" className="text-white">Diesel</SelectItem>
                       <SelectItem value="def" className="text-white">DEF (Diesel Exhaust Fluid)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="edit-gallons" className="text-white">Gallons</Label>
                   <Input
                     id="edit-gallons"
                     type="number"
                     step="0.001"
                     value={editForm.gallons}
                     onChange={(e) => setEditForm({ ...editForm, gallons: parseFloat(e.target.value) || 0 })}
                     className="bg-slate-700 border-slate-600 text-white"
                   />
                 </div>
                 <div>
                   <Label htmlFor="edit-price" className="text-white">Price per Gallon</Label>
                   <Input
                     id="edit-price"
                     type="number"
                     step="0.001"
                     value={editForm.pricePerGallon}
                     onChange={(e) => setEditForm({ ...editForm, pricePerGallon: parseFloat(e.target.value) || 0 })}
                     className="bg-slate-700 border-slate-600 text-white"
                   />
                 </div>
               </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-total" className="text-white">Total Cost</Label>
                  <Input
                    id="edit-total"
                    type="number"
                    step="0.01"
                    value={editForm.totalCost}
                    onChange={(e) => setEditForm({ ...editForm, totalCost: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date" className="text-white">Purchase Date</Label>
                  <Input
                    id="edit-date"
                    type="datetime-local"
                    value={editForm.purchaseDate}
                    onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-truck" className="text-white">Truck</Label>
                <Select value={editForm.truckId} onValueChange={(value) => setEditForm({ ...editForm, truckId: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {(trucks as Truck[]).map((truck) => (
                      <SelectItem key={truck.id} value={truck.id} className="text-white">
                        {truck.name} ({truck.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-station" className="text-white">Station Name</Label>
                  <Input
                    id="edit-station"
                    value={editForm.stationName}
                    onChange={(e) => setEditForm({ ...editForm, stationName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-receipt" className="text-white">Receipt Number</Label>
                  <Input
                    id="edit-receipt"
                    value={editForm.receiptNumber}
                    onChange={(e) => setEditForm({ ...editForm, receiptNumber: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-address" className="text-white">Station Address</Label>
                <Input
                  id="edit-address"
                  value={editForm.stationAddress}
                  onChange={(e) => setEditForm({ ...editForm, stationAddress: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="edit-payment" className="text-white">Payment Method</Label>
                <Select 
                  value={editForm.paymentMethod} 
                  onValueChange={(value) => setEditForm({ ...editForm, paymentMethod: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Company Card" className="text-white">Company Card</SelectItem>
                    <SelectItem value="Cash" className="text-white">Cash</SelectItem>
                    <SelectItem value="Fleet Card" className="text-white">Fleet Card</SelectItem>
                    <SelectItem value="Personal Card" className="text-white">Personal Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-notes" className="text-white">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditCancel}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSave}
                  disabled={updatePurchaseMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {updatePurchaseMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}