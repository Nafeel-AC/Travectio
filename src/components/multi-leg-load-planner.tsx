import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Route, Plus, Edit3, Trash2, Save, MapPin, Clock, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import type { LoadPlan, LoadPlanLeg, Truck as TruckType, Driver } from "@shared/schema";

interface LoadPlanWithLegs extends LoadPlan {
  legs: LoadPlanLeg[];
}

export function MultiLegLoadPlanner() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isAddingLeg, setIsAddingLeg] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<LoadPlan>>({});
  const [newLeg, setNewLeg] = useState<Partial<LoadPlanLeg>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { useDemoQuery } = useDemoApi();

  const { data: trucks = [] } = useDemoQuery(
    ["/api/trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

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

  const { data: loadPlans = [] } = useDemoQuery(
    ["/api/load-plans"],
    "/api/load-plans",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const selectedPlanData = loadPlans.find(p => p.id === selectedPlan);

  const createPlanMutation = useMutation({
    mutationFn: (data: Partial<LoadPlan>) =>
      apiRequest("/api/load-plans", "POST", data),
    ...createSynchronizedMutation(queryClient, 'planning'),
    onSuccess: (newPlan: any) => {
      setSelectedPlan(newPlan.id);
      setIsCreatingPlan(false);
      setNewPlan({});
      toast({
        title: "Load Plan Created",
        description: "Multi-leg plan created and synchronized across fleet management.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Could not create load plan.",
        variant: "destructive",
      });
    },
  });

  const addLegMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: Partial<LoadPlanLeg> }) =>
      apiRequest(`/api/load-plans/${planId}/legs`, "POST", data),
    ...createSynchronizedMutation(queryClient, 'planning'),
    onSuccess: () => {
      setIsAddingLeg(false);
      setNewLeg({});
      toast({
        title: "Load Leg Added",
        description: "Trip leg added and fleet data synchronized.",
      });
    },
    onError: () => {
      toast({
        title: "Addition Failed",
        description: "Could not add load leg.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) =>
      apiRequest(`/api/load-plans/${planId}`, "DELETE"),
    ...createSynchronizedMutation(queryClient, 'planning'),
    onSuccess: () => {
      setSelectedPlan("");
      toast({
        title: "Load Plan Deleted",
        description: "Plan removed and fleet data synchronized.",
      });
    },
  });

  const handleCreatePlan = () => {
    if (newPlan.planName && newPlan.truckId && newPlan.estimatedDuration) {
      createPlanMutation.mutate({
        ...newPlan,
        totalMiles: 0,
        totalRevenue: 0,
        totalProfit: 0,
        status: "draft",
      });
    }
  };

  const handleAddLeg = () => {
    if (selectedPlan && newLeg.originCity && newLeg.destinationCity && newLeg.miles && newLeg.rate) {
      const legNumber = (selectedPlanData?.legs.length || 0) + 1;
      addLegMutation.mutate({
        planId: selectedPlan,
        data: {
          ...newLeg,
          legNumber,
          ratePerMile: (newLeg.rate || 0) / (newLeg.miles || 1),
        },
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "draft": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getTruckName = (truckId: string) => {
    return trucks.find(t => t.id === truckId)?.name || "Unknown Truck";
  };

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return "Unassigned";
    return drivers.find(d => d.id === driverId)?.name || "Unknown Driver";
  };

  return (
    <div className="space-y-6">
      {/* Header and Plan Selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Multi-Leg Load Planning
            </CardTitle>
            <CardDescription>
              Plan 3-5 leg trips for weekly advance planning and maximum efficiency
            </CardDescription>
          </div>
          <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Load Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Load Plan</DialogTitle>
                <DialogDescription>
                  Set up a new multi-leg trip plan for weekly dispatch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input
                    id="plan-name"
                    placeholder="e.g., Texas to California Round Trip"
                    value={newPlan.planName || ""}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, planName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="truck-select">Assign Truck</Label>
                  <Select 
                    value={newPlan.truckId || ""} 
                    onValueChange={(value) => setNewPlan(prev => ({ ...prev, truckId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select truck..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>
                          {truck.name} - {truck.equipmentType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="driver-select">Assign Driver (Optional)</Label>
                  <Select 
                    value={newPlan.driverId || ""} 
                    onValueChange={(value) => setNewPlan(prev => ({ ...prev, driverId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {drivers.filter(d => d.isActive === 1).map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="estimated-duration">Estimated Duration (Hours)</Label>
                  <Input
                    id="estimated-duration"
                    type="number"
                    placeholder="e.g., 120"
                    value={newPlan.estimatedDuration || ""}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatingPlan(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePlan}
                    disabled={createPlanMutation.isPending}
                  >
                    Create Plan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label>Active Plan:</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Select a load plan..." />
              </SelectTrigger>
              <SelectContent>
                {loadPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(plan.status)}`} />
                      {plan.planName} - {getTruckName(plan.truckId)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedPlanData && (
        <>
          {/* Plan Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedPlanData.planName}
                  <Badge className={getStatusColor(selectedPlanData.status)}>
                    {selectedPlanData.status.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {getTruckName(selectedPlanData.truckId)} • {getDriverName(selectedPlanData.driverId)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deletePlanMutation.mutate(selectedPlan)}
                  disabled={deletePlanMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Miles</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedPlanData.totalMiles.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${selectedPlanData.totalRevenue.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">Estimated Profit</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${selectedPlanData.totalProfit.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedPlanData.estimatedDuration}h
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legs Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Load Legs ({selectedPlanData.legs.length}/5)
              </CardTitle>
              <Dialog open={isAddingLeg} onOpenChange={setIsAddingLeg}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    disabled={selectedPlanData.legs.length >= 5}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Leg
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Load Leg</DialogTitle>
                    <DialogDescription>
                      Add leg #{(selectedPlanData.legs.length || 0) + 1} to the load plan
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="origin-city">Origin City</Label>
                      <Input
                        id="origin-city"
                        placeholder="e.g., Dallas"
                        value={newLeg.originCity || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, originCity: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="origin-state">Origin State</Label>
                      <Input
                        id="origin-state"
                        placeholder="e.g., TX"
                        value={newLeg.originState || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, originState: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dest-city">Destination City</Label>
                      <Input
                        id="dest-city"
                        placeholder="e.g., Phoenix"
                        value={newLeg.destinationCity || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, destinationCity: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dest-state">Destination State</Label>
                      <Input
                        id="dest-state"
                        placeholder="e.g., AZ"
                        value={newLeg.destinationState || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, destinationState: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="miles">Miles</Label>
                      <Input
                        id="miles"
                        type="number"
                        placeholder="800"
                        value={newLeg.miles || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, miles: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="rate">Total Rate ($)</Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        placeholder="2400.00"
                        value={newLeg.rate || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pickup-date">Pickup Date</Label>
                      <Input
                        id="pickup-date"
                        type="datetime-local"
                        value={newLeg.pickupDate ? new Date(newLeg.pickupDate).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, pickupDate: new Date(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="delivery-date">Delivery Date</Label>
                      <Input
                        id="delivery-date"
                        type="datetime-local"
                        value={newLeg.deliveryDate ? new Date(newLeg.deliveryDate).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, deliveryDate: new Date(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="commodity">Commodity</Label>
                      <Input
                        id="commodity"
                        placeholder="e.g., Electronics"
                        value={newLeg.commodity || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, commodity: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        type="number"
                        placeholder="45000"
                        value={newLeg.weight || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, weight: parseInt(e.target.value) || null }))}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="broker-name">Broker Name</Label>
                      <Input
                        id="broker-name"
                        placeholder="e.g., Prime Logistics"
                        value={newLeg.brokerName || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, brokerName: e.target.value }))}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional notes or special instructions..."
                        value={newLeg.notes || ""}
                        onChange={(e) => setNewLeg(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingLeg(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddLeg}
                      disabled={addLegMutation.isPending}
                    >
                      Add Leg
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedPlanData.legs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No legs added yet. Click "Add Leg" to start planning your route.
                  </div>
                ) : (
                  selectedPlanData.legs.map((leg, index) => (
                    <Card key={leg.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">Leg {leg.legNumber}</Badge>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4" />
                              {leg.originCity}, {leg.originState} → {leg.destinationCity}, {leg.destinationState}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            ${leg.ratePerMile.toFixed(2)}/mi
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Miles</div>
                            <div className="font-semibold">{leg.miles.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Rate</div>
                            <div className="font-semibold">${leg.rate.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Pickup</div>
                            <div className="font-semibold">
                              {format(new Date(leg.pickupDate), "MMM dd, HH:mm")}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Delivery</div>
                            <div className="font-semibold">
                              {format(new Date(leg.deliveryDate), "MMM dd, HH:mm")}
                            </div>
                          </div>
                        </div>
                        
                        {leg.commodity && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Commodity: </span>
                                <span className="font-medium">{leg.commodity}</span>
                              </div>
                              {leg.weight && (
                                <div>
                                  <span className="text-muted-foreground">Weight: </span>
                                  <span className="font-medium">{leg.weight.toLocaleString()} lbs</span>
                                </div>
                              )}
                              {leg.brokerName && (
                                <div>
                                  <span className="text-muted-foreground">Broker: </span>
                                  <span className="font-medium">{leg.brokerName}</span>
                                </div>
                              )}
                            </div>
                            {leg.notes && (
                              <div className="mt-2">
                                <span className="text-muted-foreground">Notes: </span>
                                <span className="text-sm">{leg.notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loadPlans.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Load Plans Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first multi-leg load plan to start weekly advance planning
            </p>
            <Button onClick={() => setIsCreatingPlan(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}