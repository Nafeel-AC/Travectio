import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Move, MapPin, Truck, DollarSign, Calendar, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { calculateDistance, calculateDistanceBetweenCities } from "@shared/distance-utils";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import { TruckService, LoadService } from "@/lib/supabase-client";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const loadStopSchema = z.object({
  type: z.enum(["pickup", "delivery"]),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  appointmentTime: z.string().optional(),
  notes: z.string().optional(),
  stopOrder: z.number().min(1)
});

const multiStopLoadSchema = z.object({
  type: z.enum(["dryVan", "reefer", "flatbed", "tanker", "other"]),
  truckId: z.string().min(1, "Please select a truck"),
  pay: z.number().min(0, "Pay must be non-negative"),
  miles: z.number().min(0, "Miles must be non-negative").optional(),
  pickupDate: z.string().min(1, "Pickup date is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  brokerName: z.string().optional(),
  loadNumber: z.string().optional(),
  commodity: z.string().optional(),
  weight: z.number().optional(),
  notes: z.string().optional(),
  stops: z.array(loadStopSchema).min(2, "At least one pickup and one delivery stop are required"),
  deadheadMiles: z.number().optional(),
  deadheadFromCity: z.string().optional(),
  deadheadFromState: z.string().optional(),
  totalMilesWithDeadhead: z.number().optional()
});

type MultiStopLoadFormData = z.infer<typeof multiStopLoadSchema>;
type LoadStop = z.infer<typeof loadStopSchema>;

interface MultiStopLoadEntryProps {
  onClose: () => void;
  editingLoad?: any;
}

export function MultiStopLoadEntry({ onClose, editingLoad }: MultiStopLoadEntryProps) {
  const [stops, setStops] = useState<LoadStop[]>([
    { type: "pickup", city: "", state: "", stopOrder: 1 },
    { type: "delivery", city: "", state: "", stopOrder: 2 }
  ]);
  const [totalMiles, setTotalMiles] = useState<number>(0);
  const [isCalculatingMiles, setIsCalculatingMiles] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDemoQuery } = useDemoApi();

  const form = useForm<MultiStopLoadFormData>({
    resolver: zodResolver(multiStopLoadSchema),
    defaultValues: {
      type: "dryVan",
      truckId: "",
      pay: 0,
      miles: 0,
      pickupDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0],
      stops: stops
    }
  });

  // Fetch trucks for selection
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

  const createLoadMutation = useMutation({
    mutationFn: async (data: MultiStopLoadFormData) => {
      // Calculate deadhead miles automatically
      let deadheadMiles = 0;
      const truckId = data.truckId;
      
      if (truckId && data.stops.length > 0) {
        try {
          // Get truck information from Supabase
          const truck = await TruckService.getTruck(truckId);
          if (truck && truck.lastLocation) {
            const lastLocation = truck.lastLocation;
            const firstPickup = data.stops.find(s => s.type === "pickup");
            
            if (firstPickup && firstPickup.city && lastLocation.city) {
              // Use city-to-city calculation for accurate distances, especially within same states
              deadheadMiles = calculateDistanceBetweenCities(
                lastLocation.city, lastLocation.state,
                firstPickup.city, firstPickup.state
              );
              console.log(`Auto-calculated deadhead: ${deadheadMiles} miles from ${lastLocation.city}, ${lastLocation.state} to ${firstPickup.city}, ${firstPickup.state}`);
              
              // Update loadData with deadhead information
              data.deadheadMiles = deadheadMiles;
              data.deadheadFromCity = lastLocation.city;
              data.deadheadFromState = lastLocation.state;
              data.totalMilesWithDeadhead = (totalMiles || 0) + deadheadMiles;
            }
          }
        } catch (error) {
          console.log("Could not auto-calculate deadhead miles:", error);
        }
      }

      // Create the main load first
      const loadData = {
        ...data,
        // Use primary pickup and delivery locations for main load record
        originCity: data.stops.find(s => s.type === "pickup")?.city || "",
        originState: data.stops.find(s => s.type === "pickup")?.state || "",
        destinationCity: data.stops.find(s => s.type === "delivery")?.city || "",
        destinationState: data.stops.find(s => s.type === "delivery")?.state || "",
        miles: totalMiles || 0,
        pickupDate: new Date(data.pickupDate),
        deliveryDate: new Date(data.deliveryDate),
        status: "in-transit",
        // Required fields for database schema
        isProfitable: 1, // Will be calculated later
        deadheadMiles: data.deadheadMiles || deadheadMiles, // Use calculated deadhead miles
        totalMilesWithDeadhead: (totalMiles || 0) + (data.deadheadMiles || deadheadMiles), // Total includes deadhead
        // Deadhead origin tracking
        deadheadFromCity: data.deadheadFromCity || "", // Populated from last location
        deadheadFromState: data.deadheadFromState || "", // Populated from last location
        // Convert equipment type to match database format
        type: data.type === "dryVan" ? "Dry Van" : 
              data.type === "reefer" ? "Reefer" : 
              data.type === "flatbed" ? "Flatbed" : 
              data.type === "tanker" ? "Tanker" : "Other"
      };

      // Create load using Supabase service
      const load = await LoadService.createLoad(loadData);
      console.log("Created load response:", load);

      // Ensure we have a valid load ID
      if (!load || !load.id) {
        throw new Error("Failed to create load - no ID returned");
      }

      // Create all stops with proper field mapping
      for (const stop of data.stops) {
        const stopData = {
          loadId: load.id,
          sequence: stop.stopOrder,
          type: stop.type,
          city: stop.city,
          state: stop.state,
          address: stop.address || "",
          contactName: stop.contactName || "",
          contactPhone: stop.contactPhone || "",
          instructions: stop.notes || "",
          milesFromPrevious: 0 // Will be calculated later
        };
        console.log(`Creating stop for load ${load.id}:`, stopData);
        await LoadService.createLoadStop(load.id, stopData);
      }

      return load;
    },
    ...createSynchronizedMutation(queryClient, 'all'), // Comprehensive synchronization
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Multi-stop load created successfully - all metrics synchronized"
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Error creating multi-stop load:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create multi-stop load",
        variant: "destructive"
      });
    }
  });

  const addStop = (type: "pickup" | "delivery") => {
    const newStop: LoadStop = {
      type,
      city: "",
      state: "",
      stopOrder: stops.length + 1
    };
    setStops([...stops, newStop]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) {
      toast({
        title: "Cannot Remove",
        description: "A load must have at least one pickup and one delivery stop",
        variant: "destructive"
      });
      return;
    }
    
    const newStops = stops.filter((_, i) => i !== index);
    // Renumber stop orders
    const reorderedStops = newStops.map((stop, i) => ({ ...stop, stopOrder: i + 1 }));
    setStops(reorderedStops);
  };

  const updateStop = (index: number, field: keyof LoadStop, value: any) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  };

  const moveStop = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === stops.length - 1)) {
      return;
    }

    const newStops = [...stops];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap stops
    [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
    
    // Update stop orders
    newStops[index].stopOrder = index + 1;
    newStops[targetIndex].stopOrder = targetIndex + 1;
    
    setStops(newStops);
  };

  const calculateTotalMiles = async () => {
    if (stops.length < 2) return;

    setIsCalculatingMiles(true);
    let total = 0;
    let deadheadMiles = 0;

    try {
      const truckId = form.watch("truckId");
      
      let lastLocation = null;
      
      // First, calculate deadhead miles from truck's last known location to first pickup
      if (truckId && stops.length > 0) {
        try {
          const response = await fetch(`/api/trucks/${truckId}/last-location`);
          if (response.ok) {
            lastLocation = await response.json();
            const firstPickup = stops.find(s => s.type === "pickup");
            
            console.log("Last location:", lastLocation);
            console.log("First pickup:", firstPickup);
            
            if (firstPickup && firstPickup.city && lastLocation.city) {
              // Use city-to-city calculation for accurate deadhead miles
              deadheadMiles = calculateDistanceBetweenCities(
                lastLocation.city, lastLocation.state, 
                firstPickup.city, firstPickup.state
              );
              console.log(`Calculated deadhead (city-to-city): ${lastLocation.city}, ${lastLocation.state} → ${firstPickup.city}, ${firstPickup.state} = ${deadheadMiles} miles`);
            }
          }
        } catch (error) {
          console.log("Could not calculate deadhead miles:", error);
        }
      }

      // Calculate loaded miles between stops using city-to-city calculation
      for (let i = 0; i < stops.length - 1; i++) {
        const currentStop = stops[i];
        const nextStop = stops[i + 1];

        if (currentStop.city && currentStop.state && nextStop.city && nextStop.state) {
          const distance = calculateDistanceBetweenCities(
            currentStop.city, currentStop.state,
            nextStop.city, nextStop.state
          );
          console.log(`Stop-to-stop distance: ${currentStop.city}, ${currentStop.state} → ${nextStop.city}, ${nextStop.state} = ${distance} miles`);
          total += distance;
        }
      }

      setTotalMiles(total);
      form.setValue("miles", total);
      
      // Set deadhead information in form
      console.log("Setting form values - Deadhead miles:", deadheadMiles);
      console.log("Setting form values - Last location:", lastLocation);
      
      form.setValue("deadheadMiles", deadheadMiles);
      form.setValue("totalMilesWithDeadhead", total + deadheadMiles);
      
      if (deadheadMiles > 0 && lastLocation) {
        form.setValue("deadheadFromCity", lastLocation.city || "");
        form.setValue("deadheadFromState", lastLocation.state || "");
      } else {
        form.setValue("deadheadFromCity", "");
        form.setValue("deadheadFromState", "");
      }
      
      const totalWithDeadhead = total + deadheadMiles;
      
      toast({
        title: "Miles Calculated",
        description: `Loaded miles: ${total}, Deadhead: ${deadheadMiles}, Total: ${totalWithDeadhead} miles`
      });
    } catch (error) {
      console.error("Error calculating miles:", error);
      toast({
        title: "Calculation Error",
        description: "Could not calculate total miles. Please enter manually.",
        variant: "destructive"
      });
    } finally {
      setIsCalculatingMiles(false);
    }
  };

  // Auto-calculate miles when stops change
  useEffect(() => {
    if (stops.every(stop => stop.city && stop.state)) {
      calculateTotalMiles();
    }
  }, [stops]);

  // Update form stops when stops state changes
  useEffect(() => {
    form.setValue("stops", stops);
  }, [stops, form]);

  const onSubmit = (data: MultiStopLoadFormData) => {
    console.log("Form submission data:", data);
    console.log("Deadhead miles in form:", data.deadheadMiles);
    console.log("Total miles with deadhead:", data.totalMilesWithDeadhead);
    createLoadMutation.mutate(data);
  };

  const pickupStops = stops.filter(stop => stop.type === "pickup");
  const deliveryStops = stops.filter(stop => stop.type === "delivery");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Multi-Stop Load Entry</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create loads with multiple pickup and delivery locations</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {stops.length} Stops
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Load Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Load Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="type">Load Type</Label>
              <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dryVan">Dry Van</SelectItem>
                  <SelectItem value="reefer">Refrigerated</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="tanker">Tanker</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="truckId">Select Truck</Label>
              <Select value={form.watch("truckId")} onValueChange={(value) => form.setValue("truckId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose truck" />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((truck: any) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.name} ({truck.licensePlate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pay" className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Total Pay
              </Label>
              <Input
                id="pay"
                type="number"
                step="0.01"
                {...form.register("pay", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="miles">Total Miles</Label>
              <div className="flex gap-2">
                <Input
                  id="miles"
                  type="number"
                  value={totalMiles}
                  onChange={(e) => {
                    const miles = parseFloat(e.target.value) || 0;
                    setTotalMiles(miles);
                    form.setValue("miles", miles);
                  }}
                  placeholder="0"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={calculateTotalMiles}
                  disabled={isCalculatingMiles}
                >
                  {isCalculatingMiles ? "Calculating..." : "Auto-Calculate"}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="pickupDate" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Pickup Date
              </Label>
              <Input
                id="pickupDate"
                type="date"
                {...form.register("pickupDate")}
              />
            </div>

            <div>
              <Label htmlFor="deliveryDate" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Delivery Date
              </Label>
              <Input
                id="deliveryDate"
                type="date"
                {...form.register("deliveryDate")}
              />
            </div>

            <div>
              <Label htmlFor="brokerName">Broker Name</Label>
              <Input
                id="brokerName"
                {...form.register("brokerName")}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="loadNumber">Load Number</Label>
              <Input
                id="loadNumber"
                {...form.register("loadNumber")}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="commodity">Commodity</Label>
              <Input
                id="commodity"
                {...form.register("commodity")}
                placeholder="What's being hauled"
              />
            </div>

            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                {...form.register("weight", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Multi-Stop Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Load Stops ({stops.length})
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addStop("pickup")}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Pickup
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addStop("delivery")}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Delivery
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stops.map((stop, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={stop.type === "pickup" ? "default" : "secondary"}>
                          {stop.type === "pickup" ? "Pickup" : "Delivery"} #{stop.stopOrder}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStop(index, "up")}
                            disabled={index === 0}
                          >
                            <Move className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStop(index, "down")}
                            disabled={index === stops.length - 1}
                          >
                            <Move className="w-3 h-3 rotate-180" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStop(index)}
                        disabled={stops.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>City *</Label>
                      <Input
                        value={stop.city}
                        onChange={(e) => updateStop(index, "city", e.target.value)}
                        placeholder="City name"
                      />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Select
                        value={stop.state}
                        onValueChange={(value) => updateStop(index, "state", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={stop.address || ""}
                        onChange={(e) => updateStop(index, "address", e.target.value)}
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <Label>ZIP Code</Label>
                      <Input
                        value={stop.zipCode || ""}
                        onChange={(e) => updateStop(index, "zipCode", e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={stop.contactName || ""}
                        onChange={(e) => updateStop(index, "contactName", e.target.value)}
                        placeholder="Contact person"
                      />
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      <Input
                        value={stop.contactPhone || ""}
                        onChange={(e) => updateStop(index, "contactPhone", e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Appointment Time
                      </Label>
                      <Input
                        type="datetime-local"
                        value={stop.appointmentTime || ""}
                        onChange={(e) => updateStop(index, "appointmentTime", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input
                        value={stop.notes || ""}
                        onChange={(e) => updateStop(index, "notes", e.target.value)}
                        placeholder="Special instructions"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Load Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              {...form.register("notes")}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              rows={3}
              placeholder="Any additional notes or special instructions for this multi-stop load..."
            />
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createLoadMutation.isPending}
          >
            {createLoadMutation.isPending ? "Creating Load..." : "Create Multi-Stop Load"}
          </Button>
        </div>
      </form>
    </div>
  );
}