import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, AlertTriangle, CheckCircle, Timer, Car, Bed, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DriverService, TruckService, HOSService } from "@/lib/supabase-client";

const dutyStatusOptions = [
  { value: "OFF_DUTY", label: "Off Duty", icon: Coffee, color: "bg-slate-600", description: "Driver is off duty and not available for work" },
  { value: "SLEEPER_BERTH", label: "Sleeper Berth", icon: Bed, color: "bg-blue-600", description: "Driver is resting in sleeper berth" },
  { value: "DRIVING", label: "Driving", icon: Car, color: "bg-green-600", description: "Driver is actively driving the vehicle" },
  { value: "ON_DUTY", label: "On Duty (Not Driving)", icon: Timer, color: "bg-yellow-600", description: "Driver is on duty but not driving" }
];

const hosEntrySchema = z.object({
  driverId: z.string().min(1, "Driver selection is required"),
  truckId: z.string().min(1, "Truck selection is required"),
  dutyStatus: z.enum(["OFF_DUTY", "SLEEPER_BERTH", "DRIVING", "ON_DUTY"], {
    required_error: "Duty status is required"
  }),
  timestamp: z.coerce.date({ required_error: "Timestamp is required" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().min(1, "Location is required"),
  driveTimeRemaining: z.number().min(0).max(14, "Drive time must be between 0-14 hours"),
  onDutyRemaining: z.number().min(0).max(14, "On-duty time must be between 0-14 hours"),
  cycleHoursRemaining: z.number().min(0).max(70, "Cycle time must be between 0-70 hours"),
  annotations: z.string().optional(),
});

type HOSEntryForm = z.infer<typeof hosEntrySchema>;

export default function EnhancedHOSEntry() {
  const [selectedDutyStatus, setSelectedDutyStatus] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use Supabase services instead of demo API
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => DriverService.getDrivers(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const form = useForm<HOSEntryForm>({
    resolver: zodResolver(hosEntrySchema),
    defaultValues: {
      timestamp: new Date(),
      driveTimeRemaining: 11,
      onDutyRemaining: 14,
      cycleHoursRemaining: 70,
      address: "",
      annotations: ""
    }
  });

  const createHOSMutation = useMutation({
    mutationFn: async (data: HOSEntryForm) => {
      // Convert form data to match HOS log schema
      const hosLogData = {
        driverId: data.driverId,
        truckId: data.truckId,
        dutyStatus: data.dutyStatus,
        timestamp: data.timestamp.toISOString(),
        location: data.address,
        notes: data.annotations || null,
        violations: [],
        driveTimeRemaining: data.driveTimeRemaining,
        onDutyRemaining: data.onDutyRemaining,
        cycleHoursRemaining: data.cycleHoursRemaining,
      };
      return HOSService.createHosLog(hosLogData);
    },
    onSuccess: () => {
      toast({
        title: "HOS Entry Created",
        description: "Hours of service entry has been successfully recorded.",
      });
      form.reset();
      setSelectedDutyStatus("");
      queryClient.invalidateQueries({ queryKey: ["hos-logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create HOS entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HOSEntryForm) => {
    // Calculate violations before submitting
    const violations = calculateViolations(
      14 - data.driveTimeRemaining,
      14 - data.onDutyRemaining,
      70 - data.cycleHoursRemaining
    );

    const hosEntry = {
      ...data,
      violations: violations.length > 0 ? violations : null
    };

    createHOSMutation.mutate(hosEntry);
  };

  const calculateViolations = (driveTime: number, onDutyTime: number, cycleTime: number) => {
    const violations = [];
    if (driveTime > 11) violations.push("Drive time exceeds 11 hours");
    if (onDutyTime > 14) violations.push("On-duty time exceeds 14 hours");
    if (cycleTime > 70) violations.push("Cycle time exceeds 70 hours");
    return violations;
  };

  const watchedValues = form.watch(["driveTimeRemaining", "onDutyRemaining", "cycleHoursRemaining", "dutyStatus"]);
  const violations = calculateViolations(
    14 - (watchedValues[0] || 0),
    14 - (watchedValues[1] || 0),
    70 - (watchedValues[2] || 0)
  );

  const selectedStatus = dutyStatusOptions.find(s => s.value === watchedValues[3]);

  return (
    <Card className="bg-slate-800 border-slate-700 mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Enhanced HOS Entry - All Duty Status Types
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Driver and Truck Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Driver *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id} className="text-white">
                            {driver.name} - {driver.cdlNumber}
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
                name="truckId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Truck *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select truck" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {trucks.map((truck) => (
                          <SelectItem key={truck.id} value={truck.id} className="text-white">
                            {truck.name} - {truck.equipmentType} {truck.driver ? `(Driver: ${truck.driver.name})` : '(No Driver)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Duty Status Selection */}
            <FormField
              control={form.control}
              name="dutyStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Duty Status *</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dutyStatusOptions.map((status) => {
                      const Icon = status.icon;
                      const isSelected = field.value === status.value;
                      return (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => field.onChange(status.value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected 
                              ? `${status.color} border-white text-white` 
                              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Icon className="h-6 w-6" />
                            <div className="text-sm font-medium">{status.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedStatus && (
                    <div className="mt-2 p-3 bg-slate-700 rounded-lg">
                      <div className="text-slate-300 text-sm">{selectedStatus.description}</div>
                    </div>
                  )}
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Timestamp and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Timestamp *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="bg-slate-700 border-slate-600 text-white"
                        value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City, State or Address"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Hours Remaining */}
            <div className="space-y-4">
              <div className="text-slate-300 font-medium">Hours Remaining</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="driveTimeRemaining"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Drive Time Remaining (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="14"
                          placeholder="11.0"
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
                  name="onDutyRemaining"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">On-Duty Time Remaining (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="14"
                          placeholder="14.0"
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
                  name="cycleHoursRemaining"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Cycle Time Remaining (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="70"
                          placeholder="70.0"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Violation Status */}
            {violations.length > 0 && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 font-medium">HOS Violations Detected</span>
                </div>
                <div className="space-y-1">
                  {violations.map((violation, index) => (
                    <Badge key={index} variant="destructive" className="bg-red-600 mr-2">
                      {violation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {violations.length === 0 && watchedValues[3] && (
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-medium">No HOS Violations</span>
                </div>
              </div>
            )}

            {/* Optional GPS Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Latitude (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="40.7128"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Longitude (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="-74.0060"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Annotations */}
            <FormField
              control={form.control}
              name="annotations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Driver Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this duty status change..."
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createHOSMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                {createHOSMutation.isPending ? "Recording..." : "Record HOS Entry"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedDutyStatus("");
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}