import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, MapPin, DollarSign, Clock, Filter, Truck, RefreshCw, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface LoadBoardItem {
  id: string;
  loadBoardSource: string;
  externalId: string;
  equipmentType: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  miles: number;
  rate: number;
  ratePerMile: number;
  pickupDate?: string;
  deliveryDate?: string;
  weight?: number;
  commodity?: string;
  brokerName?: string;
  brokerMc?: string;
  status: string;
  createdAt: string;
}

export default function LoadBoard() {
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [minRate, setMinRate] = useState<string>("");
  const [maxMiles, setMaxMiles] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    loadBoardSource: "Manual Entry",
    externalId: "",
    equipmentType: "Dry Van",
    originCity: "",
    originState: "",
    destinationCity: "",
    destinationState: "",
    miles: "",
    rate: "",
    pickupDate: "",
    deliveryDate: "",
    weight: "",
    commodity: "",
    brokerName: "",
    brokerMc: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // TODO: Implement proper load board service
  const { data: loads = [], isLoading, refetch } = useQuery({
    queryKey: ['load-board', selectedEquipment],
    queryFn: () => Promise.resolve([]), // Placeholder
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const assignLoadMutation = useMutation({
    mutationFn: (loadId: string) =>
      apiRequest(`/api/load-board/${loadId}/status`, "PATCH", { status: "assigned" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/load-board"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Load Assigned",
        description: "Load has been successfully assigned to your fleet.",
      });
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign the load. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createLoadMutation = useMutation({
    mutationFn: async (loadData: any) => {
      const ratePerMile = parseFloat(loadData.rate) / parseFloat(loadData.miles);
      const loadPayload = {
        ...loadData,
        miles: parseInt(loadData.miles),
        rate: parseFloat(loadData.rate),
        ratePerMile,
        weight: loadData.weight ? parseInt(loadData.weight) : null,
        pickupDate: loadData.pickupDate ? new Date(loadData.pickupDate).toISOString() : null,
        deliveryDate: loadData.deliveryDate ? new Date(loadData.deliveryDate).toISOString() : null,
      };
      return apiRequest("/api/load-board", "POST", loadPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/load-board"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Load Added",
        description: "Manual load entry has been added to the load board.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Failed to Add Load",
        description: "Could not add the load. Please check all required fields.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      loadBoardSource: "Manual Entry",
      externalId: "",
      equipmentType: "Dry Van",
      originCity: "",
      originState: "",
      destinationCity: "",
      destinationState: "",
      miles: "",
      rate: "",
      pickupDate: "",
      deliveryDate: "",
      weight: "",
      commodity: "",
      brokerName: "",
      brokerMc: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.originCity || !formData.originState || !formData.destinationCity || 
        !formData.destinationState || !formData.miles || !formData.rate) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in origin, destination, miles, and rate.",
        variant: "destructive",
      });
      return;
    }
    createLoadMutation.mutate(formData);
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "DAT":
        return "bg-blue-600";
      case "123Loadboard":
        return "bg-green-600";
      case "Truckstop":
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case "Reefer":
        return "🚛";
      case "Flatbed":
        return "🚚";
      default:
        return "📦";
    }
  };

  const filteredLoads = loads.filter(load => {
    if (minRate && load.ratePerMile < parseFloat(minRate)) return false;
    if (maxMiles && load.miles > parseInt(maxMiles)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Load Board Filters</span>
            </CardTitle>
            <Button
              onClick={() => refetch()}
              size="sm"
              className="bg-[var(--primary-blue)] hover:bg-[var(--blue-accent)] text-white"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-gray-300 text-sm block mb-2">Equipment Type</label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger className="bg-[var(--dark-elevated)] border-gray-600 text-white">
                  <SelectValue placeholder="All Equipment" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--dark-surface)] border-gray-600">
                  <SelectItem value="all">All Equipment</SelectItem>
                  <SelectItem value="Dry Van">Dry Van</SelectItem>
                  <SelectItem value="Reefer">Reefer</SelectItem>
                  <SelectItem value="Flatbed">Flatbed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-gray-300 text-sm block mb-2">Min Rate/Mile</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  className="bg-[var(--dark-elevated)] border-gray-600 text-white pl-8"
                  placeholder="2.50"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm block mb-2">Max Miles</label>
              <Input
                type="number"
                value={maxMiles}
                onChange={(e) => setMaxMiles(e.target.value)}
                className="bg-[var(--dark-elevated)] border-gray-600 text-white"
                placeholder="1000"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSelectedEquipment("all");
                  setMinRate("");
                  setMaxMiles("");
                }}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-[var(--dark-elevated)]"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Board Results */}
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Available Loads ({filteredLoads.length})</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Auto-refresh: 1min</span>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Load
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Manual Load Entry</DialogTitle>
                    <DialogDescription className="text-slate-300">
                      Enter load details to add to the available freight board.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="externalId" className="text-white">Load ID</Label>
                      <Input
                        id="externalId"
                        value={formData.externalId}
                        onChange={(e) => handleInputChange("externalId", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="LOAD-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="equipmentType" className="text-white">Equipment Type</Label>
                      <Select value={formData.equipmentType} onValueChange={(value) => handleInputChange("equipmentType", value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="Dry Van">Dry Van</SelectItem>
                          <SelectItem value="Reefer">Reefer</SelectItem>
                          <SelectItem value="Flatbed">Flatbed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="originCity" className="text-white">Origin City*</Label>
                      <Input
                        id="originCity"
                        value={formData.originCity}
                        onChange={(e) => handleInputChange("originCity", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Dallas"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="originState" className="text-white">Origin State*</Label>
                      <Input
                        id="originState"
                        value={formData.originState}
                        onChange={(e) => handleInputChange("originState", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="TX"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destinationCity" className="text-white">Destination City*</Label>
                      <Input
                        id="destinationCity"
                        value={formData.destinationCity}
                        onChange={(e) => handleInputChange("destinationCity", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Miami"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destinationState" className="text-white">Destination State*</Label>
                      <Input
                        id="destinationState"
                        value={formData.destinationState}
                        onChange={(e) => handleInputChange("destinationState", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="FL"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="miles" className="text-white">Miles*</Label>
                      <Input
                        id="miles"
                        type="number"
                        value={formData.miles}
                        onChange={(e) => handleInputChange("miles", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="1000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate" className="text-white">Total Rate*</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={formData.rate}
                          onChange={(e) => handleInputChange("rate", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white pl-8"
                          placeholder="2500.00"
                          required
                        />
                      </div>
                      {formData.miles && formData.rate && (
                        <p className="text-sm text-green-400">
                          Rate/Mile: ${(parseFloat(formData.rate) / parseFloat(formData.miles)).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-white">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="45000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commodity" className="text-white">Commodity</Label>
                      <Input
                        id="commodity"
                        value={formData.commodity}
                        onChange={(e) => handleInputChange("commodity", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Electronics"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickupDate" className="text-white">Pickup Date</Label>
                      <Input
                        id="pickupDate"
                        type="datetime-local"
                        value={formData.pickupDate}
                        onChange={(e) => handleInputChange("pickupDate", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDate" className="text-white">Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        type="datetime-local"
                        value={formData.deliveryDate}
                        onChange={(e) => handleInputChange("deliveryDate", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brokerName" className="text-white">Broker Name</Label>
                      <Input
                        id="brokerName"
                        value={formData.brokerName}
                        onChange={(e) => handleInputChange("brokerName", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="ABC Logistics"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brokerMc" className="text-white">Broker MC#</Label>
                      <Input
                        id="brokerMc"
                        value={formData.brokerMc}
                        onChange={(e) => handleInputChange("brokerMc", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="MC-123456"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={createLoadMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                      {createLoadMutation.isPending ? "Adding..." : "Add Load"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-600 h-24 rounded"></div>
              ))}
            </div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No loads found matching your criteria</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoads.map((load) => (
                <div
                  key={load.id}
                  className="bg-[var(--dark-elevated)] rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getEquipmentIcon(load.equipmentType)}</div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={`${getSourceBadgeColor(load.loadBoardSource)} text-white text-xs`}>
                            {load.loadBoardSource}
                          </Badge>
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                            {load.equipmentType}
                          </Badge>
                          <span className="text-gray-400 text-sm">#{load.externalId}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-white">
                            <MapPin className="w-4 h-4 mr-1 text-green-400" />
                            <span className="font-medium">{load.originCity}, {load.originState}</span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center text-white">
                            <MapPin className="w-4 h-4 mr-1 text-red-400" />
                            <span className="font-medium">{load.destinationCity}, {load.destinationState}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        ${load.ratePerMile.toFixed(2)}/mi
                      </div>
                      <div className="text-gray-300 text-sm">
                        ${load.rate.toLocaleString()} total
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Distance:</span>
                      <div className="text-white font-medium">{load.miles.toLocaleString()} mi</div>
                    </div>
                    {load.weight && (
                      <div>
                        <span className="text-gray-400">Weight:</span>
                        <div className="text-white font-medium">{load.weight.toLocaleString()} lbs</div>
                      </div>
                    )}
                    {load.commodity && (
                      <div>
                        <span className="text-gray-400">Commodity:</span>
                        <div className="text-white font-medium">{load.commodity}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Posted:</span>
                      <div className="text-white font-medium">
                        {formatDistanceToNow(new Date(load.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  {load.pickupDate && (
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-400">Pickup:</span>
                        <div className="text-white font-medium">
                          {new Date(load.pickupDate).toLocaleDateString()}
                        </div>
                      </div>
                      {load.deliveryDate && (
                        <div>
                          <span className="text-gray-400">Delivery:</span>
                          <div className="text-white font-medium">
                            {new Date(load.deliveryDate).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {load.brokerName && (
                    <div className="mb-4 text-sm">
                      <span className="text-gray-400">Broker:</span>
                      <span className="text-white font-medium ml-2">
                        {load.brokerName}
                        {load.brokerMc && <span className="text-gray-400 ml-1">({load.brokerMc})</span>}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300 text-sm">
                        Revenue potential: ${load.rate.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      onClick={() => assignLoadMutation.mutate(load.id)}
                      disabled={assignLoadMutation.isPending || load.status !== "available"}
                      className="bg-[var(--primary-blue)] hover:bg-[var(--blue-accent)] text-white"
                      size="sm"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {assignLoadMutation.isPending ? "Assigning..." : "Assign Load"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}