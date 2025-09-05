import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Check,
  Truck,
  DollarSign,
  Users,
  Zap,
  Crown,
  Star,
  Calculator,
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";
import { useToast } from "@/hooks/use-toast";
import {
  usePricingPlans,
  useCreateCheckoutSession,
  PricingPlan as PricingPlanType,
  calculatePlanPrice,
  getRecommendedPlan,
  canSelectPlan,
} from "@/hooks/useSubscription";

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  minTrucks: number;
  maxTrucks: number | null;
  basePrice: number | null;
  pricePerTruck: number | null;
  isActive: boolean;
}

const defaultPlans: PricingPlan[] = [
  {
    id: "per-truck",
    name: "per-truck",
    displayName: "Per Truck Plan",
    minTrucks: 1,
    maxTrucks: null,
    basePrice: null,
    pricePerTruck: 24.99,
    isActive: true,
  },
];

export default function PricingPage() {
  const [truckCount, setTruckCount] = useState(5);
  const [customTruckCount, setCustomTruckCount] = useState("5");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch pricing plans from API, fallback to default plans
  const {
    data: apiPlans,
    isLoading: plansLoading,
    error: plansError,
  } = usePricingPlans();
  const createCheckoutMutation = useCreateCheckoutSession();

  // Use API plans if available, otherwise fallback to default
  const plans = apiPlans || defaultPlans;

  // Calculate the recommended plan and pricing
  const getRecommendedPlanLocal = (trucks: number): PricingPlan | null => {
    return getRecommendedPlan(plans, trucks);
  };

  const calculatePlanPriceLocal = (
    plan: PricingPlan,
    trucks: number
  ): number => {
    return calculatePlanPrice(plan, trucks);
  };

  const recommendedPlan = getRecommendedPlanLocal(truckCount);

  useEffect(() => {
    if (recommendedPlan) {
      setSelectedPlan(recommendedPlan.id);
    }
  }, [recommendedPlan]);

  const handleTruckCountChange = (value: number) => {
    setTruckCount(value);
    setCustomTruckCount(value.toString());
  };

  const handleCustomTruckCountChange = (value: string) => {
    setCustomTruckCount(value);
    const numValue = parseInt(value) || 1;
    if (numValue > 0 && numValue <= 200) {
      setTruckCount(numValue);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCheckoutMutation.mutateAsync({ planId, truckCount });
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const getPlanFeatures = (planName: string) => {
    return [
      "Real-time fleet tracking",
      "Load management",
      "Fuel cost tracking",
      "Driver management",
      "Advanced reporting",
      "Mobile app access",
      "Priority support",
      "API access",
      "Unlimited trucks",
      "Advanced analytics",
      "Custom integrations",
      "24/7 customer support",
    ];
  };

  const getPlanIcon = (planName: string) => {
    return <Truck className="h-8 w-8" />;
  };

  const getPlanColor = (planName: string) => {
    return "text-blue-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Pay only for what you use. $24.99 per truck per month. 
            Scale up or down anytime with no hidden fees.
          </p>
        </div>

        {/* Truck Count Selector */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                How many trucks do you want to manage?
              </CardTitle>
              <CardDescription>
                Adjust to see the best plan for your fleet size
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slider */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>1 truck</span>
                  <span className="text-white font-medium">
                    {truckCount} trucks
                  </span>
                  <span>50+ trucks</span>
                </div>
                <Slider
                  value={[truckCount]}
                  onValueChange={([value]) => handleTruckCountChange(value)}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-4">
                <Label htmlFor="custom-trucks" className="text-slate-300">
                  Or enter exact number:
                </Label>
                <div className="flex-1 max-w-32">
                  <Input
                    id="custom-trucks"
                    type="number"
                    min="1"
                    max="200"
                    value={customTruckCount}
                    onChange={(e) =>
                      handleCustomTruckCountChange(e.target.value)
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Current Calculation */}
              {recommendedPlan && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      ${calculatePlanPriceLocal(recommendedPlan, truckCount).toFixed(2)}
                      /month
                    </div>
                    <div className="text-slate-300 text-sm">
                      Recommended: {recommendedPlan.displayName}
                      {recommendedPlan.basePrice ? (
                        <span className="text-slate-400 block">
                          ($
                          {(calculatePlanPriceLocal(recommendedPlan, truckCount) / truckCount).toFixed(2)}{" "}
                          per truck)
                        </span>
                      ) : (
                        <span className="text-slate-400 block">
                          (${recommendedPlan.pricePerTruck} per truck)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plan */}
        <div className="max-w-md mx-auto mb-16">
          <Card className="relative bg-slate-800/50 border-2 border-blue-500 shadow-lg shadow-blue-500/20">
            <CardHeader className="text-center">
              <div className="text-blue-400 mb-4 flex justify-center">
                {getPlanIcon("per-truck")}
              </div>
              <CardTitle className="text-white text-2xl">
                Travectio Subscription
              </CardTitle>
              <CardDescription className="text-slate-400">
                Pay per truck • Scale anytime
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Pricing */}
              <div className="text-center">
                <div className="text-4xl font-bold text-white">
                  $24.99
                  <span className="text-lg text-slate-400">/truck/month</span>
                </div>
                <div className="text-slate-400 text-sm mt-1">
                  Total: ${(24.99 * truckCount).toFixed(2)}/month for {truckCount} truck{truckCount > 1 ? 's' : ''}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {getPlanFeatures("per-truck").map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-slate-300"
                  >
                    <Check className="h-4 w-4 text-green-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createCheckoutMutation.isPending}
                onClick={() => handleSubscribe("per-truck")}
              >
                {createCheckoutMutation.isPending
                  ? "Processing..."
                  : `Subscribe for ${truckCount} truck${truckCount > 1 ? 's' : ''}`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  How does per-truck pricing work?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  You pay $24.99 for each truck in your fleet every month. 
                  Add or remove trucks anytime and your billing adjusts automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Can I change my truck count?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Yes! You can add or remove trucks from your subscription at any time. 
                  Changes take effect immediately with prorated billing.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Is there a free trial?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Yes! Start with a 14-day free trial. No credit card required. 
                  Cancel anytime during the trial period with no charges.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  What if I have 0 trucks?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  You need at least 1 truck to subscribe. If you temporarily have no trucks, 
                  you can pause your subscription and reactivate when needed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
