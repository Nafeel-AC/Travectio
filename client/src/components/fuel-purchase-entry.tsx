import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Fuel, Receipt, CreditCard, MapPin, Calculator, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { createSynchronizedMutation } from "@/lib/data-synchronization";
import { useToast } from "@/hooks/use-toast";

const combinedFuelPurchaseSchema = z.object({
  truckId: z.string().min(1, "Truck is required"),
  loadId: z.string().min(1, "Load is required"),
  
  // Diesel fuel section
  dieselGallons: z.number().min(0, "Diesel gallons must be 0 or greater"),
  dieselPricePerGallon: z.number().min(0, "Diesel price must be 0 or greater"),
  
  // DEF section (manual cost entry)
  defGallons: z.number().min(0, "DEF gallons must be 0 or greater"),
  defTotalCost: z.number().min(0, "DEF total cost must be 0 or greater"),
  
  // Shared details
  stationName: z.string().optional(),
  stationAddress: z.string().optional(),
  receiptNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  purchaseDate: z.date(),
}).refine(
  (data) => data.dieselGallons > 0 || data.defGallons > 0,
  {
    message: "Either diesel or DEF fuel must be purchased",
    path: ["dieselGallons"],
  }
);

type CombinedFuelPurchaseForm = z.infer<typeof combinedFuelPurchaseSchema>;

interface FuelPurchaseEntryProps {
  loadId?: string;
  truckId?: string;
  onSuccess?: () => void;
}

export function FuelPurchaseEntry({ loadId, truckId, onSuccess }: FuelPurchaseEntryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { useDemoQuery } = useDemoApi();

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

  // Fetch loads for selection
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

  // Fetch existing fuel purchases for the load
  const { data: existingPurchases = [] } = useDemoQuery(
    ["/api/fuel-purchases", { loadId }],
    `/api/fuel-purchases${loadId ? `?loadId=${loadId}` : ''}`,
    {
      enabled: !!loadId,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Calculate totals from existing purchases
  const totalFuelCost = (existingPurchases as any[]).reduce((sum: number, purchase: any) => sum + purchase.totalCost, 0);
  const totalGallons = (existingPurchases as any[]).reduce((sum: number, purchase: any) => sum + purchase.gallons, 0);

  const form = useForm<CombinedFuelPurchaseForm>({
    resolver: zodResolver(combinedFuelPurchaseSchema),
    defaultValues: {
      truckId: truckId || "",
      loadId: loadId || "",
      dieselGallons: 0,
      dieselPricePerGallon: 0,
      defGallons: 0,
      defTotalCost: 0,
      stationName: "",
      stationAddress: "",
      receiptNumber: "",
      paymentMethod: "Company Card",
      notes: "",
      purchaseDate: new Date(),
    },
  });

  const createFuelPurchase = useMutation({
    mutationFn: async (data: CombinedFuelPurchaseForm) => {
      const purchases = [];
      
      // Create diesel fuel purchase if gallons > 0
      if (data.dieselGallons > 0) {
        purchases.push(
          apiRequest("/api/fuel-purchases", "POST", {
            truckId: data.truckId,
            loadId: data.loadId,
            fuelType: "diesel",
            gallons: data.dieselGallons,
            pricePerGallon: data.dieselPricePerGallon,
            totalCost: data.dieselGallons * data.dieselPricePerGallon,
            stationName: data.stationName,
            stationAddress: data.stationAddress,
            receiptNumber: data.receiptNumber,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
            purchaseDate: data.purchaseDate.toISOString(),
          })
        );
      }
      
      // Create DEF purchase if gallons > 0
      if (data.defGallons > 0) {
        purchases.push(
          apiRequest("/api/fuel-purchases", "POST", {
            truckId: data.truckId,
            loadId: data.loadId,
            fuelType: "def",
            gallons: data.defGallons,
            pricePerGallon: data.defTotalCost / data.defGallons, // Calculate price per gallon from total cost
            totalCost: data.defTotalCost,
            stationName: data.stationName,
            stationAddress: data.stationAddress,
            receiptNumber: data.receiptNumber,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
            purchaseDate: data.purchaseDate.toISOString(),
          })
        );
      }
      
      // Execute all purchases
      return await Promise.all(purchases);
    },
    ...createSynchronizedMutation(queryClient, 'all'), // Comprehensive synchronization
    onSuccess: () => {
      const purchaseCount = (watchedDieselGallons > 0 ? 1 : 0) + (watchedDefGallons > 0 ? 1 : 0);
      toast({
        title: `${purchaseCount === 2 ? 'Combined Fuel' : 'Fuel'} Purchase Recorded & Synchronized`,
        description: `${purchaseCount === 2 ? 'Both diesel and DEF' : 'Fuel'} purchase${purchaseCount === 2 ? 's have' : ' has'} been successfully recorded and all fleet metrics updated.`,
      });
      
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record fuel purchase. Please try again.",
        variant: "destructive",
      });
      console.error("Fuel purchase error:", error);
    },
  });

  const onSubmit = async (data: CombinedFuelPurchaseForm) => {
    setIsSubmitting(true);
    try {
      await createFuelPurchase.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedDieselGallons = form.watch("dieselGallons");
  const watchedDieselPricePerGallon = form.watch("dieselPricePerGallon");
  const watchedDefGallons = form.watch("defGallons");
  const watchedDefTotalCost = form.watch("defTotalCost");
  
  const dieselTotalCost = watchedDieselGallons * watchedDieselPricePerGallon;
  const totalCombinedCost = dieselTotalCost + watchedDefTotalCost;

  // Calculate totals for existing purchases
  const totalExistingCost = (existingPurchases as any[]).reduce((sum: number, purchase: any) => sum + purchase.totalCost, 0);
  const totalExistingGallons = (existingPurchases as any[]).reduce((sum: number, purchase: any) => sum + purchase.gallons, 0);

  return (
    <div className="space-y-6">
      {/* Existing Purchases Summary */}
      {loadId && (existingPurchases as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Current Fuel Purchases
            </CardTitle>
            <CardDescription>
              Fuel purchases recorded for this load
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalExistingGallons.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Total Gallons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${totalExistingCost.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ${totalExistingGallons > 0 ? (totalExistingCost / totalExistingGallons).toFixed(3) : '0.000'}
                </div>
                <div className="text-sm text-muted-foreground">Avg Price/Gallon</div>
              </div>
            </div>
            
            <div className="space-y-2">
              {(existingPurchases as any[]).map((purchase: any, index: number) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Fuel className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {purchase.gallons} gal @ ${purchase.pricePerGallon.toFixed(3)}/gal
                        <Badge variant={purchase.fuelType === 'def' ? 'outline' : 'secondary'} className="text-xs">
                          {purchase.fuelType === 'def' ? 'DEF' : 'Diesel'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {purchase.stationName && `${purchase.stationName} • `}
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    ${purchase.totalCost.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load Details with Profitability Impact */}
      {loadId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Load Profitability Impact
            </CardTitle>
            <CardDescription>
              See how fuel purchases affect this load's profit margins
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedLoad = (loads as any[]).find((load: any) => load.id === loadId);
              if (!selectedLoad) return <div className="text-muted-foreground">Load not found</div>;
              
              const estimatedFuelCost = selectedLoad.estimatedFuelCost || 0;
              const actualFuelCost = totalFuelCost;
              const loadRevenue = selectedLoad.pay || 0;
              const loadMiles = selectedLoad.miles || 0;
              
              const estimatedProfit = loadRevenue - estimatedFuelCost;
              const actualProfit = loadRevenue - actualFuelCost;
              const profitDifference = actualProfit - estimatedProfit;
              
              return (
                <div className="space-y-4">
                  {/* Load Summary */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-semibold">{selectedLoad.originCity}, {selectedLoad.originState} → {selectedLoad.destinationCity}, {selectedLoad.destinationState}</div>
                      <div className="text-sm text-muted-foreground">{loadMiles} miles • ${loadRevenue.toLocaleString()} revenue</div>
                    </div>
                    <Badge variant={selectedLoad.status === 'delivered' ? 'default' : 'secondary'}>
                      {selectedLoad.status}
                    </Badge>
                  </div>
                  
                  {/* Profit Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">
                        ${estimatedProfit.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Estimated Profit</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        (${estimatedFuelCost.toFixed(2)} fuel cost)
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        ${actualProfit.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Actual Profit</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        (${actualFuelCost.toFixed(2)} fuel cost)
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className={`text-lg font-bold ${profitDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitDifference >= 0 ? '+' : ''}${profitDifference.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Difference</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {profitDifference >= 0 ? 'Better than expected' : 'Over budget'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Fuel Efficiency Metrics */}
                  {totalGallons > 0 && loadMiles > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-md font-bold text-purple-600">
                          {(loadMiles / totalGallons).toFixed(2)} MPG
                        </div>
                        <div className="text-sm text-muted-foreground">Actual Fuel Efficiency</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-md font-bold text-orange-600">
                          ${(actualFuelCost / loadMiles).toFixed(3)}/mi
                        </div>
                        <div className="text-sm text-muted-foreground">Actual Fuel CPM</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* New Fuel Purchase Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Add Combined Fuel Purchase
          </CardTitle>
          <CardDescription>
            Record diesel fuel and DEF (Diesel Exhaust Fluid) in the same transaction for accurate cost tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Truck Selection */}
              <div className="space-y-2">
                <Label htmlFor="truckId">Truck</Label>
                <Select
                  value={form.watch("truckId")}
                  onValueChange={(value) => form.setValue("truckId", value)}
                  disabled={!!truckId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {(trucks as any[]).map((truck: any) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.name} ({truck.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.truckId && (
                  <p className="text-sm text-destructive">{form.formState.errors.truckId.message}</p>
                )}
              </div>

              {/* Load Selection */}
              <div className="space-y-2">
                <Label htmlFor="loadId">Load</Label>
                <Select
                  value={form.watch("loadId")}
                  onValueChange={(value) => form.setValue("loadId", value)}
                  disabled={!!loadId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select load" />
                  </SelectTrigger>
                  <SelectContent>
                    {(loads as any[]).map((load: any) => (
                      <SelectItem key={load.id} value={load.id}>
                        {load.originState} → {load.destinationState} ({load.miles} mi)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.loadId && (
                  <p className="text-sm text-destructive">{form.formState.errors.loadId.message}</p>
                )}
              </div>
            </div>

            {/* Diesel Fuel Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 mb-3">
                <Fuel className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Diesel Fuel</h3>
                <Badge variant="secondary">Regular Fuel</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dieselGallons">Gallons</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register("dieselGallons", { valueAsNumber: true })}
                    placeholder="0.0"
                  />
                  {form.formState.errors.dieselGallons && (
                    <p className="text-sm text-destructive">{form.formState.errors.dieselGallons.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dieselPricePerGallon">Price per Gallon</Label>
                  <Input
                    type="number"
                    step="0.001"
                    {...form.register("dieselPricePerGallon", { valueAsNumber: true })}
                    placeholder="0.000"
                  />
                  {form.formState.errors.dieselPricePerGallon && (
                    <p className="text-sm text-destructive">{form.formState.errors.dieselPricePerGallon.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Diesel Total Cost
                  </Label>
                  <div className="h-9 px-3 py-2 bg-white dark:bg-slate-800 rounded-md flex items-center font-medium border">
                    ${dieselTotalCost.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* DEF Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">DEF (Diesel Exhaust Fluid)</h3>
                <Badge variant="outline" className="text-green-700 border-green-300">Cheaper Fluid</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defGallons">DEF Gallons</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register("defGallons", { valueAsNumber: true })}
                    placeholder="0.0"
                  />
                  {form.formState.errors.defGallons && (
                    <p className="text-sm text-destructive">{form.formState.errors.defGallons.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defTotalCost" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Total DEF Cost
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("defTotalCost", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {form.formState.errors.defTotalCost && (
                    <p className="text-sm text-destructive">{form.formState.errors.defTotalCost.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">DEF Price per Gallon</Label>
                  <div className="h-9 px-3 py-2 bg-white dark:bg-slate-800 rounded-md flex items-center font-medium border text-muted-foreground">
                    ${watchedDefGallons > 0 ? (watchedDefTotalCost / watchedDefGallons).toFixed(3) : '0.000'}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
                💡 <strong>Tip:</strong> DEF is typically much cheaper than diesel fuel. Enter the total amount you paid for DEF fluid, and we'll calculate the per-gallon cost automatically.
              </div>
            </div>

            {/* Combined Total Summary */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-slate-600" />
                  <span className="font-semibold text-lg">Combined Total Cost</span>
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  ${totalCombinedCost.toFixed(2)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Diesel: ${dieselTotalCost.toFixed(2)} + DEF: ${watchedDefTotalCost.toFixed(2)}
              </div>
            </div>

            {/* Station Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stationName">Station Name</Label>
                <Input
                  {...form.register("stationName")}
                  placeholder="e.g., Shell, BP, Flying J"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stationAddress" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Station Address
                </Label>
                <Input
                  {...form.register("stationAddress")}
                  placeholder="City, State"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  {...form.register("receiptNumber")}
                  placeholder="Optional receipt reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </Label>
                <Select
                  value={form.watch("paymentMethod")}
                  onValueChange={(value) => form.setValue("paymentMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Company Card">Company Card</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Personal Card">Personal Card</SelectItem>
                    <SelectItem value="Fleet Card">Fleet Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Additional notes about this purchase..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || createFuelPurchase.isPending || (watchedDieselGallons === 0 && watchedDefGallons === 0)}
            >
              {isSubmitting ? "Recording Purchase..." : "Record Combined Fuel Purchase"}
            </Button>
            
            {watchedDieselGallons === 0 && watchedDefGallons === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Enter diesel or DEF fuel amounts to continue
              </p>
            )}
          </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}