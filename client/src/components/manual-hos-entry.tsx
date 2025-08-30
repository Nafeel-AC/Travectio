import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDemoApi } from "@/hooks/useDemoApi";

const hosEntrySchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  truckId: z.string().min(1, "Truck is required"),
  dutyStatus: z.string().min(1, "Duty status is required"),
  timestamp: z.date({ required_error: "Timestamp is required" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().min(1, "Address is required"),
  driveTimeRemaining: z.number().min(0).max(14, "Drive time must be between 0-14 hours"),
  onDutyRemaining: z.number().min(0).max(14, "On-duty time must be between 0-14 hours"),
  cycleHoursRemaining: z.number().min(0).max(70, "Cycle time must be between 0-70 hours"),
  annotations: z.string().optional(),
});

type HOSEntryForm = z.infer<typeof hosEntrySchema>;

const dutyStatuses = [
  { value: "OFF_DUTY", label: "Off Duty" },
  { value: "SLEEPER", label: "Sleeper Berth" },
  { value: "DRIVING", label: "Driving" },
  { value: "ON_DUTY", label: "On Duty (Not Driving)" }
];

export default function ManualHOSEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDemoQuery } = useDemoApi();
  const { data: drivers = [] } = useDemoQuery(
    ["manual-hos-entry-drivers"],
    "/api/drivers",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: trucks = [] } = useDemoQuery(
    ["manual-hos-entry-trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

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
      return await apiRequest("/api/hos-logs", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "HOS Entry Created",
        description: "The hours of service entry has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hos-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-overview"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create HOS entry",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: HOSEntryForm) => {
    createHOSMutation.mutate(data);
  };

  const calculateViolations = (driveTime: number, onDutyTime: number, cycleTime: number) => {
    const violations = [];
    if (driveTime > 11) violations.push("Drive time exceeds 11 hours");
    if (onDutyTime > 14) violations.push("On-duty time exceeds 14 hours");
    if (cycleTime > 70) violations.push("Cycle time exceeds 70 hours");
    return violations;
  };

  const watchedValues = form.watch(["driveTimeRemaining", "onDutyRemaining", "cycleHoursRemaining"]);
  const violations = calculateViolations(
    14 - (watchedValues[0] || 0),
    14 - (watchedValues[1] || 0),
    70 - (watchedValues[2] || 0)
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Manual HOS Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Driver</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel className="text-slate-300">Truck</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select truck" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {trucks.map((truck) => (
                          <SelectItem key={truck.id} value={truck.id} className="text-white">
                            {truck.truckNumber} - {truck.make} {truck.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dutyStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Duty Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select duty status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {dutyStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value} className="text-white">
                            {status.label}
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
                name="timestamp"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-slate-300">Date & Time</FormLabel>
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
                              format(field.value, "PPP p")
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Current location address"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {violations.length > 0 && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">DOT Compliance Violations Detected:</h4>
                <ul className="text-red-300 text-sm space-y-1">
                  {violations.map((violation, index) => (
                    <li key={index}>• {violation}</li>
                  ))}
                </ul>
              </div>
            )}

            <FormField
              control={form.control}
              name="annotations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Notes/Annotations (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this HOS entry..."
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={createHOSMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              {createHOSMutation.isPending ? "Creating Entry..." : "Create HOS Entry"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}