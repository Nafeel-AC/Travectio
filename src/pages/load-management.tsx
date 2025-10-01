import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, DollarSign, Truck, MapPin, Calendar, Plus, Search, AlertCircle, Fuel, Edit, Trash2, Route } from "lucide-react";
import ManualLoadEntry from "@/components/manual-load-entry";
import { MultiStopLoadEntry } from "@/components/multi-stop-load-entry";

import { TruckProfileDisplay } from "@/components/truck-profile-display";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LoadService, TruckService } from "@/lib/supabase-client";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const statusColors = {
  "pending": "bg-yellow-600",
  "in_transit": "bg-blue-600",
  "delivered": "bg-green-600",
  "cancelled": "bg-red-600"
};

const statusLabels = {
  "pending": "Pending",
  "in_transit": "In Transit",
  "delivered": "Delivered", 
  "cancelled": "Cancelled"
};

const equipmentIcons = {
  "Dry Van": "📦",
  "Reefer": "🧊",
  "Flatbed": "🏗️"
};

export default function LoadManagement() {
  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showMultiStopForm, setShowMultiStopForm] = useState(false);
  const [editingLoad, setEditingLoad] = useState<any>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFilters, setImportFilters] = useState({ origin: "", destination: "", minRpm: "", maxMiles: "" });
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set());
  const [assignTruckId, setAssignTruckId] = useState<string>("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch trucks using proper Supabase service
  const { data: trucks = [], isLoading: trucksLoading, error: trucksError } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Fetch loads using proper Supabase service
  const { data: loads = [], isLoading: loadsLoading, error: loadsError, refetch: refetchLoads } = useQuery({
    queryKey: ['loads'],
    queryFn: () => LoadService.getLoads(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Fetch available mock load board rows when the dialog is open or filters change
  const { data: boardLoads = [], isLoading: boardLoading, refetch: refetchBoard } = useQuery({
    queryKey: ['mock-load-board', importFilters, isImportOpen],
    queryFn: async () => {
      if (!isImportOpen) return [] as any[];
      let q = supabase.from('mock_load_board').select('*').eq('status', 'available').order('createdAt', { ascending: false });
      if (importFilters.origin) q = q.ilike('originCity', `%${importFilters.origin}%`);
      if (importFilters.destination) q = q.ilike('destinationCity', `%${importFilters.destination}%`);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      let rows = data || [];
      if (importFilters.minRpm) {
        const min = parseFloat(importFilters.minRpm);
        rows = rows.filter((r: any) => (Number(r.ratePerMile || 0) >= min));
      }
      if (importFilters.maxMiles) {
        const max = parseInt(importFilters.maxMiles);
        rows = rows.filter((r: any) => (Number(r.miles || 0) <= max));
      }
      return rows;
    },
    staleTime: 1000 * 60,
    enabled: isImportOpen,
    refetchOnWindowFocus: false,
  });

  const toggleSelectBoardId = (id: string) => {
    setSelectedBoardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const importSelectedLoads = useMutation({
    mutationFn: async () => {
      const rows = (boardLoads as any[]).filter(r => selectedBoardIds.has(r.id));
      for (const row of rows) {
        const payload: any = {
          truckId: assignTruckId || null,
          type: row.equipmentType || 'Dry Van',
          pay: Number(row.rate || 0),
          miles: Number(row.miles || 0),
          isProfitable: 1,
          originCity: row.originCity,
          originState: row.originState,
          destinationCity: row.destinationCity,
          destinationState: row.destinationState,
          pickupDate: row.pickupDate || null,
          deliveryDate: row.deliveryDate || null,
          ratePerMile: Number(row.ratePerMile || 0),
          status: 'pending'
        };
        await LoadService.createLoad(payload);
        // Mark the board load as assigned so it doesn't reappear
        await supabase.from('mock_load_board').update({ status: 'assigned', updatedAt: new Date().toISOString() }).eq('id', row.id);
      }
      return true;
    },
    onSuccess: async () => {
      setSelectedBoardIds(new Set());
      setIsImportOpen(false);
      await refetchLoads();
      await refetchBoard();
      toast({ title: 'Imported', description: 'Selected loads were imported from the load board.' });
    },
    onError: (e: any) => {
      toast({ title: 'Import failed', description: e?.message || 'Could not import loads', variant: 'destructive' });
    }
  });

  // Mutation for updating load status
  const updateLoadStatusMutation = useMutation({
    mutationFn: async ({ loadId, status }: { loadId: string; status: string }) => {
      return LoadService.updateLoad(loadId, { status });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({
        title: "Status Updated",
        description: `Load status changed to ${statusLabels[variables.status as keyof typeof statusLabels]}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update load status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting load
  const deleteLoadMutation = useMutation({
    mutationFn: async (loadId: string) => {
      return LoadService.deleteLoad(loadId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({
        title: "Load Deleted",
        description: "Load has been successfully deleted and all numbers updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete load. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (loadId: string, newStatus: string) => {
    if (newStatus === "delete") {
      // Handle delete action
      if (window.confirm("Are you sure you want to delete this load? This action cannot be undone.")) {
        deleteLoadMutation.mutate(loadId);
      }
    } else {
      updateLoadStatusMutation.mutate({ loadId, status: newStatus });
    }
  };

  // Ensure loads is always an array to prevent filter errors
  const safeLoads = Array.isArray(loads) ? loads : [];

  // Filter and sort loads based on selected criteria
  const filteredLoads = safeLoads.filter(load => {
    if (selectedTruck && selectedTruck !== "all") {
      if (selectedTruck === "unassigned" && load.truckId) return false;
      if (selectedTruck !== "unassigned" && load.truckId !== selectedTruck) return false;
    }
    if (selectedStatus && selectedStatus !== "all" && load.status !== selectedStatus) return false;
    if (selectedEquipment && selectedEquipment !== "all" && load.type !== selectedEquipment) return false;
    return true;
  }).sort((a, b) => {
    // Sort by pickup date in chronological order (earliest first)
    const dateA = new Date(a.pickupDate || a.createdAt || 0);
    const dateB = new Date(b.pickupDate || b.createdAt || 0);
    return dateA.getTime() - dateB.getTime();
  });

  // CRITICAL: Use truck's total miles (includes deadhead) for consistency across all interfaces
  const trucksTotal = trucks.reduce((sum: number, truck: any) => sum + (truck.totalMiles || 0), 0);
  
  const loadStats = {
    total: safeLoads.length,
    pending: safeLoads.filter(l => l.status === "pending").length,
    inTransit: safeLoads.filter(l => l.status === "in_transit").length,
    delivered: safeLoads.filter(l => l.status === "delivered").length,
    totalRevenue: safeLoads.reduce((sum, l) => sum + (l.pay || 0), 0),
    totalMiles: trucksTotal // Use truck total miles for consistency with dashboard
  };

  const avgRatePerMile = loadStats.totalMiles > 0 ? (loadStats.totalRevenue / loadStats.totalMiles).toFixed(2) : "0.00";

  // Show error messages if any queries failed
  if (trucksError || loadsError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
            <h3 className="text-red-200 font-semibold mb-2">Error Loading Data</h3>
            {trucksError && (
              <p className="text-red-300 text-sm mb-1">Trucks: {trucksError.message}</p>
            )}
            {loadsError && (
              <p className="text-red-300 text-sm mb-1">Loads: {loadsError.message}</p>
            )}
            <p className="text-red-400 text-xs mt-2">Please check your connection and try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Load Management</h1>
            <p className="text-slate-400 text-sm sm:text-base">Track and manage freight loads across your fleet</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Dialog open={isImportOpen} onOpenChange={(v) => { setIsImportOpen(v); if (v) { setTimeout(() => refetchBoard(), 0); } }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                  <Package className="h-4 w-4 mr-2" />
                  Import from Load Board
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-5xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Load Board (Mock 123Loadboard)</DialogTitle>
                  <DialogDescription className="text-slate-300">Select available loads to import into your account. You may assign them to a truck.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Origin</label>
                      <Input value={importFilters.origin} onChange={(e) => setImportFilters({ ...importFilters, origin: e.target.value })} className="bg-slate-700 border-slate-600 text-white" placeholder="City contains" />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Destination</label>
                      <Input value={importFilters.destination} onChange={(e) => setImportFilters({ ...importFilters, destination: e.target.value })} className="bg-slate-700 border-slate-600 text-white" placeholder="City contains" />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Min $/mi</label>
                      <Input type="number" step="0.01" value={importFilters.minRpm} onChange={(e) => setImportFilters({ ...importFilters, minRpm: e.target.value })} className="bg-slate-700 border-slate-600 text-white" placeholder="2.00" />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Max miles</label>
                      <Input type="number" value={importFilters.maxMiles} onChange={(e) => setImportFilters({ ...importFilters, maxMiles: e.target.value })} className="bg-slate-700 border-slate-600 text-white" placeholder="1000" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => refetchBoard()} className="w-full bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Apply</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-slate-300 text-sm">{boardLoading ? 'Loading...' : `${(boardLoads as any[]).length} available loads`}</div>
                    <div className="flex items-center gap-2">
                      <label className="text-slate-300 text-sm">Assign to truck</label>
                      <Select value={assignTruckId || undefined} onValueChange={(v) => setAssignTruckId(v === 'none' ? '' : v)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="none" className="text-white">Unassigned</SelectItem>
                          {trucks.map((t: any) => (
                            <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="max-h-[50vh] overflow-auto border border-slate-700 rounded">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-700/60 text-slate-200">
                          <th className="text-left p-2">Sel</th>
                          <th className="text-left p-2">Lane</th>
                          <th className="text-left p-2">Miles</th>
                          <th className="text-left p-2">Rate</th>
                          <th className="text-left p-2">$/mi</th>
                          <th className="text-left p-2">Pickup</th>
                          <th className="text-left p-2">Delivery</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(boardLoads as any[]).map((l: any) => (
                          <tr key={l.id} className="border-t border-slate-700 hover:bg-slate-700/40">
                            <td className="p-2">
                              <input type="checkbox" checked={selectedBoardIds.has(l.id)} onChange={() => toggleSelectBoardId(l.id)} />
                            </td>
                            <td className="p-2 text-slate-100">{l.originCity}, {l.originState} → {l.destinationCity}, {l.destinationState}</td>
                            <td className="p-2 text-slate-100">{l.miles?.toLocaleString?.() || l.miles}</td>
                            <td className="p-2 text-green-300">${Number(l.rate || 0).toLocaleString()}</td>
                            <td className="p-2">${Number(l.ratePerMile || 0).toFixed(2)}/mi</td>
                            <td className="p-2">{l.pickupDate ? new Date(l.pickupDate).toLocaleDateString() : '-'}</td>
                            <td className="p-2">{l.deliveryDate ? new Date(l.deliveryDate).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                        {(!boardLoads || (boardLoads as any[]).length === 0) && !boardLoading && (
                          <tr><td className="p-4 text-slate-400" colSpan={7}>No loads match filters.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsImportOpen(false)} className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Cancel</Button>
                  <Button onClick={() => importSelectedLoads.mutate()} disabled={selectedBoardIds.size === 0 || importSelectedLoads.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {importSelectedLoads.isPending ? 'Importing...' : `Import ${selectedBoardIds.size || ''}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => {
                setShowEntryForm(!showEntryForm);
                setShowMultiStopForm(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{showEntryForm ? "Hide Form" : "Single Load"}</span>
              <span className="sm:hidden">{showEntryForm ? "Hide" : "Single"}</span>
            </Button>
            <Button
              onClick={() => {
                setShowMultiStopForm(!showMultiStopForm);
                setShowEntryForm(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              <Route className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{showMultiStopForm ? "Hide Form" : "Multi-Stop Load"}</span>
              <span className="sm:hidden">{showMultiStopForm ? "Hide" : "Multi"}</span>
            </Button>
            <Button
              onClick={() => {
                refetchLoads();
                queryClient.invalidateQueries({ queryKey: ['loads'] });
                toast({
                  title: "Refreshing",
                  description: "Load data is being refreshed...",
                });
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh Loads</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>

        {showEntryForm && (
          <div className="mb-8">
            <ManualLoadEntry />
          </div>
        )}

        {showMultiStopForm && (
          <div className="mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <MultiStopLoadEntry 
                  onClose={() => setShowMultiStopForm(false)}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {editingLoad && (
          <div className="mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Edit Load - {editingLoad.type} ({editingLoad.originCity}, {editingLoad.originState} → {editingLoad.destinationCity}, {editingLoad.destinationState})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingLoad(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ManualLoadEntry 
                  editMode={true}
                  loadData={editingLoad}
                  onClose={() => setEditingLoad(null)}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Load Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-2xl font-bold text-white">{loadStats.total}</div>
                  <div className="text-slate-400 text-xs sm:text-sm">Total Loads</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Removed Total Revenue to avoid duplication with Fleet Analytics */}

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-purple-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <MapPin className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-2xl font-bold text-white">{loadStats.totalMiles.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs sm:text-sm">Total Miles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-orange-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Truck className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-2xl font-bold text-white">${avgRatePerMile}</div>
                  <div className="text-slate-400 text-xs sm:text-sm">Avg Rate/Mile</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Summary */}
        <Card className="bg-slate-800 border-slate-700 mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">Load Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-3 sm:p-4">
                <div className="text-yellow-400 text-xs sm:text-sm font-medium">Pending</div>
                <div className="text-white text-lg sm:text-2xl font-bold">{loadStats.pending}</div>
              </div>
              
              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-3 sm:p-4">
                <div className="text-blue-400 text-xs sm:text-sm font-medium">In Transit</div>
                <div className="text-white text-lg sm:text-2xl font-bold">{loadStats.inTransit}</div>
              </div>
              
              <div className="bg-green-600/20 border border-green-600 rounded-lg p-3 sm:p-4">
                <div className="text-green-400 text-xs sm:text-sm font-medium">Delivered</div>
                <div className="text-white text-lg sm:text-2xl font-bold">{loadStats.delivered}</div>
              </div>
              
              <div className="bg-slate-600/20 border border-slate-600 rounded-lg p-3 sm:p-4">
                <div className="text-slate-400 text-xs sm:text-sm font-medium">Available</div>
                <div className="text-white text-lg sm:text-2xl font-bold">
                  {loads.filter(l => !l.truckId).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              <Search className="h-5 w-5" />
              Filter Loads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Truck Assignment</label>
                <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 sm:h-11">
                    <SelectValue placeholder="All trucks" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">All trucks</SelectItem>
                    <SelectItem value="unassigned" className="text-white">Unassigned</SelectItem>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id} className="text-white">
                        {truck.name} - {truck.equipmentType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Load Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 sm:h-11">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">All statuses</SelectItem>
                    <SelectItem value="pending" className="text-white">Pending</SelectItem>
                    <SelectItem value="in_transit" className="text-white">In Transit</SelectItem>
                    <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                    <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Equipment Type</label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 sm:h-11">
                    <SelectValue placeholder="All equipment" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">All equipment</SelectItem>
                    <SelectItem value="Dry Van" className="text-white">Dry Van</SelectItem>
                    <SelectItem value="Reefer" className="text-white">Reefer</SelectItem>
                    <SelectItem value="Flatbed" className="text-white">Flatbed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Status - Show trucks and drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Truck className="h-5 w-5" />
                <span className="hidden sm:inline">Fleet Status ({trucks.length} trucks)</span>
                <span className="sm:hidden">Fleet ({trucks.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trucksLoading ? (
                <div className="text-center py-4">
                  <div className="text-slate-400">Loading trucks...</div>
                </div>
              ) : trucks.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {trucks.map((truck) => (
                    <TruckProfileDisplay key={truck.id} truck={truck} compact={true} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <div className="text-slate-400 mb-2">No trucks in fleet</div>
                  <div className="text-slate-500 text-sm">Navigate to Add Truck to register your first vehicle</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-5 w-5" />
                <span className="hidden sm:inline">Load Assignment Quick Stats</span>
                <span className="sm:hidden">Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-slate-400">Trucks with loads</span>
                  <span className="text-white font-medium">
                    {loads.filter(l => l.truckId).length}/{trucks.length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-slate-400">Unassigned loads</span>
                  <span className="text-yellow-400 font-medium">
                    {loads.filter(l => !l.truckId).length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-slate-400">Active routes</span>
                  <span className="text-blue-400 font-medium">
                    {loads.filter(l => l.status === "in_transit").length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-slate-400">Available capacity</span>
                  <span className="text-green-400 font-medium">
                    {trucks.length - loads.filter(l => l.truckId && l.status === "in_transit").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Load Inventory */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              <Package className="h-5 w-5" />
              <span className="hidden sm:inline">Load Inventory ({filteredLoads.length} of {loads.length})</span>
              <span className="sm:hidden">Loads ({filteredLoads.length})</span>
            </CardTitle>
            {/* Debug information */}
            <div className="text-xs text-slate-400 mt-2">
              {loadsLoading ? "Loading..." : loadsError ? `Error: ${(loadsError as Error)?.message || 'Unknown error'}` : `Loaded ${loads.length} loads`}
            </div>
          </CardHeader>
          <CardContent>
            {loadsLoading ? (
              <div className="text-center py-8">
                <div className="text-slate-400">Loading loads...</div>
              </div>
            ) : filteredLoads.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left text-slate-300 py-3 px-4">Load Info</th>
                        <th className="text-left text-slate-300 py-3 px-4">Route</th>
                        <th className="text-left text-slate-300 py-3 px-4">Truck Assignment</th>
                        <th className="text-left text-slate-300 py-3 px-4">Financial</th>
                        <th className="text-left text-slate-300 py-3 px-4">Schedule</th>
                        <th className="text-left text-slate-300 py-3 px-4">Status</th>
                        <th className="text-left text-slate-300 py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoads.map((load: any) => {
                        const truck = trucks.find(t => t.id === load.truckId);
                        const ratePerMile = load.miles > 0 ? (load.pay / load.miles).toFixed(2) : "0.00";
                        const numericRPM = parseFloat(ratePerMile);
                        const fallbackCPM = truck ? ((truck.fixedCosts || 0) + (truck.variableCosts || 0)) / Math.max(truck.totalMiles || 3000, 1) : 0;
                        const costPerMileBenchmark = (load.totalCostPerMile || load.truckCostPerMile || fallbackCPM) as number;
                        const rpmColor = numericRPM > 0 && costPerMileBenchmark > 0
                          ? (numericRPM >= costPerMileBenchmark ? 'text-green-400' : 'text-red-400')
                          : 'text-blue-300';

                        return (
                          <tr key={load.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">
                                  {equipmentIcons[load.type as keyof typeof equipmentIcons] || "📦"}
                                </div>
                                <div>
                                  <div className="text-white font-medium">{load.type}</div>
                                  <div className="text-slate-400 text-sm">{load.commodity}</div>
                                  <div className="text-slate-500 text-xs">
                                    {load.weight ? `${load.weight.toLocaleString()} lbs` : 'Weight N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="text-white text-sm">
                                  <span className="text-slate-400">From:</span> {load.originCity}, {load.originState}
                                </div>
                                <div className="text-white text-sm">
                                  <span className="text-slate-400">To:</span> {load.destinationCity}, {load.destinationState}
                                </div>
                                <div className="text-xs">
                                  <span className="text-slate-400">Miles:</span>{' '}
                                  <span className="text-blue-300 font-medium">
                                    {load.miles ? `${load.miles.toLocaleString()}` : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {load.truckId && truck ? (
                                <TruckProfileDisplay truck={truck} compact={true} />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  <span className="text-yellow-400 text-sm">Unassigned</span>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="text-green-300 font-semibold">${load.pay?.toLocaleString() || 0}</div>
                                <div className={`text-sm font-medium ${rpmColor}`}>${ratePerMile}/mile</div>
                                
                                {/* Driver Pay Information */}
                                {load.calculatedDriverPay && load.calculatedDriverPay > 0 && (
                                  <div className="text-green-400 text-xs">
                                    Driver: ${load.calculatedDriverPay.toFixed(2)}
                                    {load.driverPayType === 'percentage' && ` (${load.driverPayPercentage || 70}%)`}
                                    {load.driverPayType === 'per_mile' && ` (${(load.calculatedDriverPay / load.miles).toFixed(2)}/mi)`}
                                    {load.driverPayType === 'flat_rate' && ' (flat)'}
                                  </div>
                                )}
                                
                                {/* Comprehensive Cost Breakdown */}
                                <div className="space-y-1">
                                  {/* Fuel Costs */}
                                  {load.actualFuelCost > 0 ? (
                                    <div className="text-green-400 text-xs">
                                      Fuel: ${load.actualFuelCost.toFixed(2)} (${load.actualFuelCostPerMile?.toFixed(3)}/mi)
                                    </div>
                                  ) : load.estimatedFuelCost > 0 ? (
                                    <div className="text-yellow-400 text-xs">
                                      Est. Fuel: ${load.estimatedFuelCost.toFixed(2)} (${load.estimatedFuelCostPerMile?.toFixed(3)}/mi)
                                    </div>
                                  ) : (
                                    <div className="text-slate-500 text-xs">
                                      No fuel data
                                    </div>
                                  )}
                                  
                                  {/* Truck Costs - only show if assigned to truck */}
                                  {load.truckId && load.truckCostPerMile > 0 && (
                                    <div className="text-blue-400 text-xs">
                                      Truck: ${load.truckCostPerMile?.toFixed(3)}/mi (Fixed: ${load.truckFixedCostPerMile?.toFixed(3)} + Var: ${load.truckVariableCostPerMile?.toFixed(3)})
                                    </div>
                                  )}
                                  
          {/* Remove CPM/Net Profit details from load cards summary; keep within per-load details if essential */}
                                  {load.totalCostPerMile > 0 && (
                                    <div className="text-purple-400 text-xs font-medium">
                                      Total CPM: ${load.totalCostPerMile?.toFixed(3)}/mi
                                    </div>
                                  )}
                                </div>
                                
                                {/* Net Profit - Enhanced Display */}
                                {load.netProfit !== undefined && load.totalCostPerMile > 0 ? (
                                  <div className="mt-2 pt-1 border-t border-slate-600">
                                    <div className={`text-sm font-medium ${load.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      Net Profit: ${load.netProfit.toFixed(2)}
                                    </div>
                                    <div className={`text-xs ${load.profitPerMile >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      ${load.profitPerMile?.toFixed(3)}/mi profit
                                    </div>
                                  </div>
                                ) : load.profit !== undefined && (
                                  <div className={`text-xs ${load.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    Est. Profit: ${load.profit.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                {load.pickupDate && (
                                  <div className="text-white text-sm">
                                    <span className="text-slate-400">Pickup:</span> {format(new Date(load.pickupDate), "MMM d")}
                                  </div>
                                )}
                                {load.deliveryDate && (
                                  <div className="text-white text-sm">
                                    <span className="text-slate-400">Delivery:</span> {format(new Date(load.deliveryDate), "MMM d")}
                                  </div>
                                )}
                                {!load.pickupDate && !load.deliveryDate && (
                                  <div className="text-slate-500 text-sm">No dates set</div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Select 
                                value={load.status} 
                                onValueChange={(newStatus) => handleStatusChange(load.id, newStatus)}
                                disabled={updateLoadStatusMutation.isPending}
                              >
                                <SelectTrigger className={`w-32 ${statusColors[load.status as keyof typeof statusColors] || 'bg-slate-600'} text-white border-0 hover:opacity-80`}>
                                  <SelectValue>
                                    {statusLabels[load.status as keyof typeof statusLabels] || load.status}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600">
                                  <SelectItem value="pending" className="text-white hover:bg-yellow-600/20">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                      Pending
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="in_transit" className="text-white hover:bg-blue-600/20">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      In Transit
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="delivered" className="text-white hover:bg-green-600/20">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      Delivered
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="cancelled" className="text-white hover:bg-red-600/20">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      Cancelled
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="delete" className="text-red-400 hover:bg-red-600/20 border-t border-slate-600 mt-1">
                                    <div className="flex items-center gap-2">
                                      <Trash2 className="w-3 h-3" />
                                      Delete Shipment
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-4 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingLoad(load);
                                  setShowEntryForm(false);
                                }}
                                className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {filteredLoads.map((load: any) => {
                    const truck = trucks.find(t => t.id === load.truckId);
                    const ratePerMile = load.miles > 0 ? (load.pay / load.miles).toFixed(2) : "0.00";
                    const numericRPM = parseFloat(ratePerMile);
                    const fallbackCPM = truck ? ((truck.fixedCosts || 0) + (truck.variableCosts || 0)) / Math.max(truck.totalMiles || 3000, 1) : 0;
                    const costPerMileBenchmark = (load.totalCostPerMile || load.truckCostPerMile || fallbackCPM) as number;
                    const rpmColor = numericRPM > 0 && costPerMileBenchmark > 0
                      ? (numericRPM >= costPerMileBenchmark ? 'text-green-400' : 'text-red-400')
                      : 'text-blue-300';

                    return (
                      <div key={load.id} className="bg-slate-700 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="text-2xl flex-shrink-0">
                              {equipmentIcons[load.type as keyof typeof equipmentIcons] || "📦"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-white font-medium text-sm sm:text-base truncate">{load.type}</div>
                              <div className="text-slate-400 text-xs sm:text-sm truncate">{load.commodity}</div>
                              {load.weight && (
                                <div className="text-slate-500 text-xs">
                                  {load.weight.toLocaleString()} lbs
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Select 
                              value={load.status} 
                              onValueChange={(newStatus) => handleStatusChange(load.id, newStatus)}
                              disabled={updateLoadStatusMutation.isPending}
                            >
                              <SelectTrigger className={`w-24 h-7 ${statusColors[load.status as keyof typeof statusColors] || 'bg-slate-600'} text-white border-0 text-xs`}>
                                <SelectValue>
                                  <span className="truncate">{statusLabels[load.status as keyof typeof statusLabels] || load.status}</span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="pending" className="text-white hover:bg-yellow-600/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    Pending
                                  </div>
                                </SelectItem>
                                <SelectItem value="in_transit" className="text-white hover:bg-blue-600/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    In Transit
                                  </div>
                                </SelectItem>
                                <SelectItem value="delivered" className="text-white hover:bg-green-600/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Delivered
                                  </div>
                                </SelectItem>
                                <SelectItem value="cancelled" className="text-white hover:bg-red-600/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Cancelled
                                  </div>
                                </SelectItem>
                                <SelectItem value="delete" className="text-red-400 hover:bg-red-600/20 border-t border-slate-600 mt-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingLoad(load);
                                setShowEntryForm(false);
                              }}
                              className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-300">Route:</span>
                            <span className="text-white text-right">
                              {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-300">Miles:</span>
                            <span className="text-blue-300 font-medium">
                              {load.miles ? `${load.miles.toLocaleString()}` : 'N/A'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-300">Pay:</span>
                            <span className="text-green-300 font-semibold">
                              ${load.pay?.toLocaleString() || 0} <span className={rpmColor}>({ratePerMile}/mi)</span>
                            </span>
                          </div>

                          {load.truckId && truck ? (
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-slate-300">Truck:</span>
                              <span className="text-white">{truck.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-slate-300">Truck:</span>
                              <span className="text-yellow-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Unassigned
                              </span>
                            </div>
                          )}

                          {(load.pickupDate || load.deliveryDate) && (
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-slate-300">Schedule:</span>
                              <span className="text-white text-right">
                                {load.pickupDate && format(new Date(load.pickupDate), "MMM d")}
                                {load.pickupDate && load.deliveryDate && " - "}
                                {load.deliveryDate && format(new Date(load.deliveryDate), "MMM d")}
                              </span>
                            </div>
                          )}

                          {/* Net Profit Display */}
                          {load.netProfit !== undefined && load.totalCostPerMile > 0 && (
                            <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-600">
                              <span className="text-slate-300">Net Profit:</span>
                              <span className={`font-medium ${load.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${load.netProfit.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
                <div className="text-slate-400 mb-2 text-sm sm:text-base">No loads found</div>
                <div className="text-slate-500 text-xs sm:text-sm px-4">
                  {selectedTruck || selectedStatus || selectedEquipment
                    ? "Try adjusting your filters or create a new load entry"
                    : "Create your first load entry to start tracking freight"
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