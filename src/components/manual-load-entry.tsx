import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Package, Plus, DollarSign, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateDistance, calculateDistanceBetweenCities } from "@shared/distance-utils";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import { useTrucks } from "@/hooks/useSupabase";

const loadEntrySchema = z.object({
  truckId: z.string().optional(),
  type: z.string().min(1, "Equipment type is required"),
  pay: z.number().min(1, "Pay amount is required"),
  miles: z.number().min(1, "Miles are required"),
  

  
  // Enhanced pickup location details
  originCity: z.string().min(1, "Origin city is required"),
  originState: z.string().min(1, "Origin state is required"),
  originAddress: z.string().optional(),
  originZip: z.string().optional(),
  pickupCompany: z.string().optional(),
  pickupContact: z.string().optional(),
  pickupPhone: z.string().optional(),
  pickupAppointment: z.string().optional(),
  
  // Enhanced delivery location details
  destinationCity: z.string().min(1, "Destination city is required"),
  destinationState: z.string().min(1, "Destination state is required"),
  destinationAddress: z.string().optional(),
  destinationZip: z.string().optional(),
  deliveryCompany: z.string().optional(),
  deliveryContact: z.string().optional(),
  deliveryPhone: z.string().optional(),
  deliveryAppointment: z.string().optional(),
  
  // Deadhead tracking
  deadheadFromCity: z.string().optional(),
  deadheadFromState: z.string().optional(),
  deadheadMiles: z.number().min(0).default(0),
  
  // Load dates
  pickupDate: z.date({ required_error: "Pickup date is required" }),
  deliveryDate: z.date({ required_error: "Delivery date is required" }),
  
  // Load details
  commodity: z.string().min(1, "Commodity is required"),
  weight: z.number().min(1, "Weight is required"),
  brokerName: z.string().min(1, "Broker name is required"),
  brokerContact: z.string().optional(),
  rateConfirmation: z.string().optional(),
  notes: z.string().optional(),
});

type LoadEntryForm = z.infer<typeof loadEntrySchema>;

const equipmentTypes = [
  { value: "Dry Van", label: "Dry Van" },
  { value: "Reefer", label: "Reefer" },
  { value: "Flatbed", label: "Flatbed" }
];

const states = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];





interface ManualLoadEntryProps {
  editMode?: boolean;
  loadData?: any;
  onClose?: () => void;
}

export default function ManualLoadEntry({ editMode = false, loadData, onClose }: ManualLoadEntryProps) {
  const [isAutoCalculated, setIsAutoCalculated] = useState(false);
  const [isDeadheadCalculated, setIsDeadheadCalculated] = useState(false);
  const [lastCalculatedRoute, setLastCalculatedRoute] = useState<string>("");
  const [lastCalculatedDeadhead, setLastCalculatedDeadhead] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDemoQuery } = useDemoApi();
  const { getTruckLastKnownLocation } = useTrucks();
  
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
  const { data: loads = [] } = useDemoQuery(
    ["/api/loads"],
    "/api/loads",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Find the most recent delivery to use as previous delivery location
  const getMostRecentDelivery = () => {
    const deliveredLoads = (loads as any[]).filter((load: any) => load.status === 'delivered');
    if (deliveredLoads.length === 0) {
      return { city: "", state: "" }; // No fallback for new fleets
    }
    
    // Sort by delivery date or creation date to find the most recent
    const mostRecent = deliveredLoads.sort((a: any, b: any) => {
      const dateA = new Date(a.deliveryDate || a.createdAt || '').getTime();
      const dateB = new Date(b.deliveryDate || b.createdAt || '').getTime();
      return dateB - dateA; // Most recent first
    })[0];
    
    return {
      city: mostRecent.destinationCity || "",
      state: mostRecent.destinationState || "PA"
    };
  };

  const mostRecentDelivery = getMostRecentDelivery();

  const form = useForm<LoadEntryForm>({
    resolver: zodResolver(loadEntrySchema),
    defaultValues: editMode && loadData ? {
      truckId: loadData.truckId || "",
      type: loadData.type || "",
      pay: loadData.pay || undefined,
      miles: loadData.miles || 0,

      originCity: loadData.originCity || "",
      originState: loadData.originState || "",
      destinationCity: loadData.destinationCity || "",
      destinationState: loadData.destinationState || "",
      deadheadFromCity: loadData.deadheadFromCity || "",
      deadheadFromState: loadData.deadheadFromState || "",
      deadheadMiles: loadData.deadheadMiles || 0,
      pickupDate: loadData.pickupDate ? new Date(loadData.pickupDate) : new Date(),
      deliveryDate: loadData.deliveryDate ? new Date(loadData.deliveryDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      commodity: loadData.commodity || "",
      weight: loadData.weight || 0,
      brokerName: loadData.brokerName || "",
      brokerContact: loadData.brokerContact || "",
      rateConfirmation: loadData.rateConfirmation || "",
      notes: loadData.notes || "",
    } : {
      pickupDate: new Date(),
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      brokerContact: "",
      rateConfirmation: "",
      notes: "",
      deadheadFromCity: "", // Leave empty for new fleets - no previous delivery assumed
      deadheadFromState: "",
      deadheadMiles: 0,

    }
  });

  const createLoadMutation = useMutation({
    mutationFn: async (data: LoadEntryForm) => {
      const totalMilesWithDeadhead = data.miles + (data.deadheadMiles || 0);
      

      
      const loadDataForSubmit = {
        ...data,
        // Date objects will be handled by z.coerce.date() in the schema
        isProfitable: 1, // Default to profitable
        estimatedFuelCost: 0,
        estimatedGallons: 0,
        status: "pending",
        ratePerMile: data.pay / data.miles, // Revenue per loaded mile
        totalMilesWithDeadhead, // Total miles including deadhead

        profit: 0 // Will be calculated on server
      };
      
      if (editMode && loadData?.id) {
        return await apiRequest(`/api/loads/${loadData.id}`, "PUT", loadDataForSubmit);
      } else {
        return await apiRequest("/api/loads", "POST", loadDataForSubmit);
      }
    },
    ...createSynchronizedMutation(queryClient, 'all'), // Comprehensive synchronization
    onSuccess: () => {
      toast({
        title: editMode ? "Load Updated" : "Load Entry Created",
        description: editMode ? "The load has been successfully updated - all metrics synchronized." : "The load has been successfully added to the system - all metrics synchronized.",
      });
      if (editMode && onClose) {
        onClose();
      } else {
        // Completely clear all form fields to prevent any cached values
        form.reset({
          truckId: "",
          type: "",
          pay: 0,
          miles: 0,
          originCity: "",
          originState: "",
          destinationCity: "",
          destinationState: "",
          pickupDate: new Date(),
          deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          brokerContact: "",
          rateConfirmation: "",
          notes: "",
          commodity: "",
          weight: 0,
          brokerName: "",
          deadheadFromCity: "", // Explicitly clear to prevent Pittsburgh defaults
          deadheadFromState: "", // Explicitly clear to prevent Pittsburgh defaults  
          deadheadMiles: 0,


        });
        
        // Force clear deadhead fields to override any cached values
        setTimeout(() => {
          form.setValue("deadheadFromCity", "");
          form.setValue("deadheadFromState", "");
          form.setValue("deadheadMiles", 0);
        }, 100);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || (editMode ? "Failed to update load entry" : "Failed to create load entry"),
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: LoadEntryForm) => {
    createLoadMutation.mutate(data);
  };

  // Auto-calculate deadhead miles when truck is selected
  const watchedTruckId = form.watch("truckId");
  
  useEffect(() => {
    if (!editMode && watchedTruckId && watchedTruckId.trim() !== "") {
      // Automatically get truck's last known location and calculate deadhead (only if truck has delivery history)
      const autoCalculateDeadhead = async () => {
        try {
          const location = await getTruckLastKnownLocation(watchedTruckId);
          
          // Only populate deadhead fields if there's actual delivery history AND it's not a placeholder value
          if (location && location.city && location.city.trim() !== "") {
            // Update deadhead origin fields
            form.setValue("deadheadFromCity", location.city);
            form.setValue("deadheadFromState", location.state);
            
            // Auto-calculate deadhead miles if pickup location is already set
            const originCity = form.getValues("originCity");
            const originState = form.getValues("originState");
            
            if (originCity && originState) {
              const deadheadMiles = calculateDistanceBetweenCities(
                location.city,
                location.state, 
                originCity,
                originState
              );
              
              if (deadheadMiles > 0) {
                form.setValue("deadheadMiles", deadheadMiles);
                toast({
                  title: "Deadhead Auto-Calculated", 
                  description: `${deadheadMiles} miles from truck's last location (${location.city}, ${location.state}) to pickup`,
                });
              }
            }
          } else {
            // Clear deadhead fields for new trucks or when location is a placeholder
            console.log("Clearing deadhead fields - no valid delivery history");
            form.setValue("deadheadFromCity", "");
            form.setValue("deadheadFromState", "");
            form.setValue("deadheadMiles", 0);

          }
        } catch (error) {
          // Error getting last location - clear deadhead fields for new trucks
          console.log("Error fetching truck location - clearing deadhead fields");
          form.setValue("deadheadFromCity", "");
          form.setValue("deadheadFromState", "");
          form.setValue("deadheadMiles", 0);

          console.log("Could not auto-calculate deadhead for truck:", error);
        }
      };
      
      autoCalculateDeadhead();
    }
  }, [watchedTruckId, editMode, form, toast]);

  // Update form values when loads data changes to set the most recent delivery location (only in create mode)
  useEffect(() => {
    if (!editMode && (loads as any[]).length > 0 && !watchedTruckId) {
      // Only use general recent delivery if no truck is selected AND there are actually delivered loads
      const recentDelivery = getMostRecentDelivery();
      // Only set deadhead fields if there's actual delivery history (non-empty city)
      if (recentDelivery.city && recentDelivery.city.trim() !== "") {
        form.setValue("deadheadFromCity", recentDelivery.city);
        form.setValue("deadheadFromState", recentDelivery.state);
      } else {
        // Clear deadhead fields for new fleets with no delivery history
        form.setValue("deadheadFromCity", "");
        form.setValue("deadheadFromState", "");
        form.setValue("deadheadMiles", 0);
      }
    }
  }, [loads, form, editMode, watchedTruckId]);

  // Reset form with existing data when in edit mode
  useEffect(() => {
    if (editMode && loadData) {
      form.reset({
        truckId: loadData.truckId || "",
        type: loadData.type || "",
        pay: loadData.pay || undefined,
        miles: loadData.miles || 0,
        
        // Enhanced pickup location details
        originCity: loadData.originCity || "",
        originState: loadData.originState || "", 
        originAddress: loadData.originAddress || "",
        originZip: loadData.originZip || "",
        pickupCompany: loadData.pickupCompany || "",
        pickupContact: loadData.pickupContact || "",
        pickupPhone: loadData.pickupPhone || "",
        pickupAppointment: loadData.pickupAppointment || "",
        
        // Enhanced delivery location details
        destinationCity: loadData.destinationCity || "",
        destinationState: loadData.destinationState || "",
        destinationAddress: loadData.destinationAddress || "",
        destinationZip: loadData.destinationZip || "",
        deliveryCompany: loadData.deliveryCompany || "",
        deliveryContact: loadData.deliveryContact || "",
        deliveryPhone: loadData.deliveryPhone || "",
        deliveryAppointment: loadData.deliveryAppointment || "",
        
        // Deadhead tracking
        deadheadFromCity: loadData.deadheadFromCity || "",
        deadheadFromState: loadData.deadheadFromState || "",
        deadheadMiles: loadData.deadheadMiles || 0,
        
        // Load dates and details
        pickupDate: loadData.pickupDate ? new Date(loadData.pickupDate) : new Date(),
        deliveryDate: loadData.deliveryDate ? new Date(loadData.deliveryDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        commodity: loadData.commodity || "",
        weight: loadData.weight || 0,
        brokerName: loadData.brokerName || "",
        brokerContact: loadData.brokerContact || "",
        rateConfirmation: loadData.rateConfirmation || "",
        notes: loadData.notes || "",
      });
    }
  }, [editMode, loadData, form]);

  // Watch for origin/destination changes to auto-calculate miles (using city-to-city calculation)
  const watchedLocationValues = form.watch(["originCity", "originState", "destinationCity", "destinationState"]);
  const watchedPayMilesValues = form.watch(["pay", "miles", "deadheadMiles"]);
  const ratePerMile = watchedPayMilesValues[0] && watchedPayMilesValues[1] 
    ? (watchedPayMilesValues[0] / watchedPayMilesValues[1]).toFixed(2)
    : "0.00";
  
  // Calculate total miles (deadhead + loaded miles)
  const totalMiles = (watchedPayMilesValues[1] || 0) + (watchedPayMilesValues[2] || 0);

  // Auto-calculate miles when origin and destination cities are selected (only in create mode)
  useEffect(() => {
    // Skip auto-calculation in edit mode to prevent interference
    if (editMode) return;
    
    const [originCity, originState, destinationCity, destinationState] = watchedLocationValues;
    const currentRoute = `${originCity}, ${originState}-${destinationCity}, ${destinationState}`;
    
    if (originCity && originState && destinationCity && destinationState) {
      // Skip calculation if it's the same location
      if (originCity === destinationCity && originState === destinationState) {
        form.setValue("miles", 0);
        setIsAutoCalculated(false);
        setLastCalculatedRoute("");
        return;
      }
      
      // Only calculate if this is a new route combination
      if (currentRoute !== lastCalculatedRoute) {
        const calculatedMiles = calculateDistanceBetweenCities(
          originCity, 
          originState, 
          destinationCity, 
          destinationState
        );
        console.log(`Distance calculation: ${originCity}, ${originState} to ${destinationCity}, ${destinationState} = ${calculatedMiles} miles`);
        if (calculatedMiles > 0) {
          form.setValue("miles", calculatedMiles);
          setIsAutoCalculated(true);
          setLastCalculatedRoute(currentRoute);
          toast({
            title: "Miles Auto-Calculated",
            description: `Distance calculated: ${calculatedMiles} miles from ${originCity}, ${originState} to ${destinationCity}, ${destinationState}`,
          });
        }
      }
    } else {
      setIsAutoCalculated(false);
      setLastCalculatedRoute("");
    }
  }, [watchedLocationValues, form, toast, lastCalculatedRoute, editMode]);

  // Watch for deadhead location changes to auto-calculate deadhead miles (only in create mode)
  const watchedDeadheadValues = form.watch(["deadheadFromCity", "deadheadFromState", "originCity", "originState"]);
  
  useEffect(() => {
    // Skip auto-calculation in edit mode to prevent interference
    if (editMode) return;
    
    const [deadheadFromCity, deadheadFromState, originCity, originState] = watchedDeadheadValues;
    const currentDeadheadRoute = `${deadheadFromCity}, ${deadheadFromState}-${originCity}, ${originState}`;
    
    if (deadheadFromCity && deadheadFromState && originCity && originState) {
      // Skip calculation if it's the same location
      if (deadheadFromCity === originCity && deadheadFromState === originState) {
        form.setValue("deadheadMiles", 0);
        setIsDeadheadCalculated(false);
        setLastCalculatedDeadhead("");
        return;
      }
      
      // Only calculate if this is a new deadhead route combination
      if (currentDeadheadRoute !== lastCalculatedDeadhead) {
        const calculatedDeadheadMiles = calculateDistanceBetweenCities(
          deadheadFromCity, 
          deadheadFromState, 
          originCity, 
          originState
        );
        if (calculatedDeadheadMiles > 0) {
          form.setValue("deadheadMiles", calculatedDeadheadMiles);
          setIsDeadheadCalculated(true);
          setLastCalculatedDeadhead(currentDeadheadRoute);
          toast({
            title: "Deadhead Miles Auto-Calculated",
            description: `Deadhead distance: ${calculatedDeadheadMiles} miles from ${deadheadFromCity}, ${deadheadFromState} to ${originCity}, ${originState}`,
            variant: "default",
          });
        }
      }
    } else {
      setIsDeadheadCalculated(false);
      setLastCalculatedDeadhead("");
    }
  }, [watchedDeadheadValues, form, toast, lastCalculatedDeadhead, editMode]);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="h-5 w-5" />
          {editMode ? "Edit Load Entry" : "Manual Load Entry"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Load Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Load Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="truckId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Assign to Truck (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Select truck or leave unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {(trucks as any[]).map((truck: any) => (
                            <SelectItem key={truck.id} value={truck.id} className="text-white">
                              {truck.name} - {truck.equipmentType} {truck.driver ? `(Driver: ${truck.driver.name})` : '(No driver)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Equipment Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Select equipment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {equipmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-white">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pickup Location Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-400" />
                Pickup Location
              </h3>
              <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="originCity"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-slate-300">City *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Chicago"
                              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="originState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">State *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="IL" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-700 border-slate-600 max-h-48">
                              {states.map((state) => (
                                <SelectItem key={state} value={state} className="text-white">
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="originZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">ZIP Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="60601"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="originAddress"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel className="text-slate-300">Street Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main Street"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickupCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ABC Logistics"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pickupContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contact Person</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Smith"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="pickupPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(555) 123-4567"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pickupAppointment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Appointment Time</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="8:00 AM - 5:00 PM"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Delivery Location Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-400" />
                Delivery Location
              </h3>
              <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="destinationCity"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-slate-300">City *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Dallas"
                              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinationState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">State *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="TX" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-700 border-slate-600 max-h-48">
                              {states.map((state) => (
                                <SelectItem key={state} value={state} className="text-white">
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="destinationZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">ZIP Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="75201"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="destinationAddress"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel className="text-slate-300">Street Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="456 Commerce Blvd"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="XYZ Distribution"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contact Person</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Doe"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="deliveryPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(555) 987-6543"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryAppointment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Appointment Time</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9:00 AM - 3:00 PM"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Deadhead Miles Tracking */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Deadhead Miles (Non-Revenue)
              </h3>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <p className="text-slate-300 text-sm mb-4">
                  Track empty miles from previous delivery location to pickup for accurate cost calculation. Leave empty if this is your first load or starting from home/terminal.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <FormLabel className="text-slate-300">Previous Delivery Location</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="deadheadFromCity"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormControl>
                              <Input
                                placeholder="Previous city"
                                className="bg-slate-600 border-slate-500 text-white placeholder:text-slate-400"
                                autoComplete="off"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deadheadFromState"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                                  <SelectValue placeholder="State" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-700 border-slate-600 max-h-48">
                                {states.map((state) => (
                                  <SelectItem key={state} value={state} className="text-white">
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="deadheadMiles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 flex items-center gap-2">
                          Deadhead Miles
                          {isDeadheadCalculated && (
                            <span className="flex items-center gap-1 text-xs text-orange-400">
                              <MapPin className="h-3 w-3" />
                              Auto-calculated
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              placeholder="125"
                              className={cn(
                                "bg-slate-600 border-slate-500 text-white placeholder:text-slate-400",
                                isDeadheadCalculated && "border-orange-500 bg-orange-950/20"
                              )}
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                                setIsDeadheadCalculated(false); // Reset when manually edited
                              }}
                            />
                            {isDeadheadCalculated && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <MapPin className="h-4 w-4 text-orange-400" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <div className="w-full">
                      <FormLabel className="text-slate-300">Total Miles (Loaded + Deadhead)</FormLabel>
                      <div className="flex items-center h-10 px-3 bg-slate-600 border border-slate-500 rounded-md">
                        <span className="text-white font-medium">
                          {(form.watch("miles") || 0) + (form.watch("deadheadMiles") || 0)} miles
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Total Load Pay ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="2500.00"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="miles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 flex items-center gap-2">
                        Total Miles
                        {isAutoCalculated && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <MapPin className="h-3 w-3" />
                            Auto-calculated
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            placeholder="850"
                            className={cn(
                              "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400",
                              isAutoCalculated && "border-green-500 bg-green-950/20"
                            )}
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value) || 0);
                              setIsAutoCalculated(false); // Reset when manually edited
                            }}
                          />
                          {isAutoCalculated && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <MapPin className="h-4 w-4 text-green-400" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
                  <div className="w-full">
                    <FormLabel className="text-slate-300">Rate per Mile</FormLabel>
                    <div className="flex items-center h-10 px-3 bg-slate-600 border border-slate-500 rounded-md">
                      <DollarSign className="h-4 w-4 text-slate-400 mr-1" />
                      <span className="text-white font-medium">{ratePerMile}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickupDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-slate-300">Pickup Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "bg-slate-700 border-slate-600 text-white pl-3 text-left font-normal",
                                !field.value && "text-slate-400"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="bg-slate-700"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-slate-300">Delivery Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "bg-slate-700 border-slate-600 text-white pl-3 text-left font-normal",
                                !field.value && "text-slate-400"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="bg-slate-700"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Load Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Load Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commodity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Commodity</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Electronics, Food Products, etc."
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Weight (lbs)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="80000"
                          placeholder="45000"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Broker Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Broker Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brokerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Broker Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC Logistics"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brokerContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Broker Contact</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(555) 123-4567 or email"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rateConfirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Rate Confirmation Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="RC-123456789"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Special instructions, hazmat requirements, etc."
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={createLoadMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              {createLoadMutation.isPending 
                ? (editMode ? "Updating Load..." : "Creating Load...") 
                : (editMode ? "Update Load Entry" : "Create Load Entry")
              }
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}