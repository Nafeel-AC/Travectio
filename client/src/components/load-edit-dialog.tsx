import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDemoApi } from "@/hooks/useDemoApi";
import { z } from "zod";
import { Calendar, MapPin, Truck, DollarSign } from "lucide-react";

const loadEditSchema = z.object({
  type: z.string().min(1, "Equipment type is required"),
  pay: z.number().min(0, "Pay must be positive"),
  miles: z.number().min(1, "Miles must be positive"),
  originCity: z.string().min(1, "Origin city is required"),
  originState: z.string().min(1, "Origin state is required"),
  destinationCity: z.string().min(1, "Destination city is required"),
  destinationState: z.string().min(1, "Destination state is required"),
  pickupDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  commodity: z.string().optional(),
  weight: z.number().optional(),
  brokerName: z.string().optional(),
  brokerContact: z.string().optional(),
  rateConfirmation: z.string().optional(),
  notes: z.string().optional(),
  truckId: z.string().optional(),
  status: z.enum(["pending", "in_transit", "delivered", "cancelled"]),
});

type LoadEditForm = z.infer<typeof loadEditSchema>;

interface LoadEditDialogProps {
  load: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export function LoadEditDialog({ load, open, onOpenChange }: LoadEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDemoQuery } = useDemoApi();
  // Fetch trucks for assignment
  const { data: trucks = [] } = useDemoQuery(
    ["load-edit-trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const form = useForm<LoadEditForm>({
    resolver: zodResolver(loadEditSchema),
    defaultValues: {
      type: "",
      pay: 0,
      miles: 0,
      originCity: "",
      originState: "",
      destinationCity: "",
      destinationState: "",
      pickupDate: "",
      deliveryDate: "",
      commodity: "",
      weight: 0,
      brokerName: "",
      brokerContact: "",
      rateConfirmation: "",
      notes: "",
      truckId: "",
      status: "pending",
    },
  });

  // Populate form when load changes
  useEffect(() => {
    if (load && open) {
      form.reset({
        type: load.type || "",
        pay: load.pay || 0,
        miles: load.miles || 0,
        originCity: load.originCity || "",
        originState: load.originState || "",
        destinationCity: load.destinationCity || "",
        destinationState: load.destinationState || "",
        pickupDate: load.pickupDate ? new Date(load.pickupDate).toISOString().split('T')[0] : "",
        deliveryDate: load.deliveryDate ? new Date(load.deliveryDate).toISOString().split('T')[0] : "",
        commodity: load.commodity || "",
        weight: load.weight || 0,
        brokerName: load.brokerName || "",
        brokerContact: load.brokerContact || "",
        rateConfirmation: load.rateConfirmation || "",
        notes: load.notes || "",
        truckId: load.truckId || "",
        status: load.status || "pending",
      });
    }
  }, [load, open, form]);

  const updateMutation = useMutation({
    mutationFn: (data: LoadEditForm) => 
      apiRequest(`/api/loads/${load.id}`, "PATCH", {
        ...data,
        pickupDate: data.pickupDate ? new Date(data.pickupDate).toISOString() : null,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      onOpenChange(false);
      toast({
        title: "Load Updated",
        description: "Load details have been updated successfully.",
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

  const onSubmit = (data: LoadEditForm) => {
    updateMutation.mutate(data);
  };

  if (!load) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Edit Load Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Load Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-slate-300">Equipment Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="Dry Van" className="text-white">Dry Van</SelectItem>
                  <SelectItem value="Reefer" className="text-white">Reefer</SelectItem>
                  <SelectItem value="Flatbed" className="text-white">Flatbed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-300">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: "pending" | "in_transit" | "delivered" | "cancelled") => 
                  form.setValue("status", value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="pending" className="text-white">Pending</SelectItem>
                  <SelectItem value="in_transit" className="text-white">In Transit</SelectItem>
                  <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                  <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay" className="text-slate-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Load Pay ($)
              </Label>
              <Input
                id="pay"
                type="number"
                step="0.01"
                {...form.register("pay", { valueAsNumber: true })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="miles" className="text-slate-300">Total Miles</Label>
              <Input
                id="miles"
                type="number"
                {...form.register("miles", { valueAsNumber: true })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Route Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Route Details</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originCity" className="text-slate-300">Origin City</Label>
                <Input
                  id="originCity"
                  {...form.register("originCity")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originState" className="text-slate-300">Origin State</Label>
                <Select
                  value={form.watch("originState")}
                  onValueChange={(value) => form.setValue("originState", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state} className="text-white">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationCity" className="text-slate-300">Destination City</Label>
                <Input
                  id="destinationCity"
                  {...form.register("destinationCity")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationState" className="text-slate-300">Destination State</Label>
                <Select
                  value={form.watch("destinationState")}
                  onValueChange={(value) => form.setValue("destinationState", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state} className="text-white">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupDate" className="text-slate-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Pickup Date
              </Label>
              <Input
                id="pickupDate"
                type="date"
                {...form.register("pickupDate")}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate" className="text-slate-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Delivery Date
              </Label>
              <Input
                id="deliveryDate"
                type="date"
                {...form.register("deliveryDate")}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Truck Assignment */}
          <div className="space-y-2">
            <Label htmlFor="truckId" className="text-slate-300 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Truck Assignment
            </Label>
            <Select
              value={form.watch("truckId")}
              onValueChange={(value) => form.setValue("truckId", value === "unassigned" ? "" : value)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select truck" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="unassigned" className="text-white">Unassigned</SelectItem>
                {trucks.map((truck: any) => (
                  <SelectItem key={truck.id} value={truck.id} className="text-white">
                    {truck.name} ({truck.licensePlate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commodity" className="text-slate-300">Commodity</Label>
              <Input
                id="commodity"
                {...form.register("commodity")}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., General Freight"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="text-slate-300">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                {...form.register("weight", { valueAsNumber: true })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Broker Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brokerName" className="text-slate-300">Broker Name</Label>
              <Input
                id="brokerName"
                {...form.register("brokerName")}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brokerContact" className="text-slate-300">Broker Contact</Label>
              <Input
                id="brokerContact"
                {...form.register("brokerContact")}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Phone or Email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rateConfirmation" className="text-slate-300">Rate Confirmation #</Label>
              <Input
                id="rateConfirmation"
                {...form.register("rateConfirmation")}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
              placeholder="Additional notes about this load..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMutation.isPending ? "Updating..." : "Update Load"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}