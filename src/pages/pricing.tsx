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
    id: "starter",
    name: "starter",
    displayName: "Starter Plan",
    minTrucks: 1,
    maxTrucks: 5,
    basePrice: 99,
    pricePerTruck: null,
    isActive: true,
  },
  {
    id: "growth",
    name: "growth",
    displayName: "Growth Plan",
    minTrucks: 6,
    maxTrucks: 15,
    basePrice: 199,
    pricePerTruck: null,
    isActive: true,
  },
  {
    id: "enterprise",
    name: "enterprise",
    displayName: "Enterprise Plan",
    minTrucks: 16,
    maxTrucks: null,
    basePrice: null,
    pricePerTruck: 12,
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
    const commonFeatures = [
      "Real-time fleet tracking",
      "Load management",
      "Fuel cost tracking",
      "Driver management",
      "Basic reporting",
      "Mobile app access",
      "Email support",
    ];

    switch (planName) {
      case "starter":
        return [
          ...commonFeatures,
          "Up to 5 trucks",
          "Standard integrations",
          "Basic analytics",
        ];
      case "growth":
        return [
          ...commonFeatures,
          "Up to 15 trucks",
          "Advanced integrations",
          "Enhanced analytics",
          "Priority support",
          "Custom reporting",
        ];
      case "enterprise":
        return [
          ...commonFeatures,
          "Unlimited trucks",
          "Enterprise integrations",
          "Advanced analytics",
          "Dedicated support",
          "Custom reporting",
          "API access",
          "White-label options",
        ];
      default:
        return commonFeatures;
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "starter":
        return <Truck className="h-8 w-8" />;
      case "growth":
        return <Users className="h-8 w-8" />;
      case "enterprise":
        return <Crown className="h-8 w-8" />;
      default:
        return <Truck className="h-8 w-8" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "starter":
        return "text-blue-400";
      case "growth":
        return "text-green-400";
      case "enterprise":
        return "text-purple-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Scale your fleet management with plans designed for every business
            size. From solo owner-operators to enterprise fleets.
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
                      ${calculatePlanPriceLocal(recommendedPlan, truckCount)}
                      /month
                    </div>
                    <div className="text-slate-300 text-sm">
                      Recommended: {recommendedPlan.displayName}
                      {recommendedPlan.basePrice ? (
                        <span className="text-slate-400 block">
                          ($
                          {(
                            calculatePlanPriceLocal(
                              recommendedPlan,
                              truckCount
                            ) / truckCount
                          ).toFixed(2)}{" "}
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

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const isRecommended = plan.id === recommendedPlan?.id;
            const canSelectThisPlan = canSelectPlan(plan, truckCount);
            const planPrice = calculatePlanPriceLocal(plan, truckCount);

            return (
              <Card
                key={plan.id}
                className={`relative bg-slate-800/50 border-2 transition-all duration-300 ${
                  isRecommended
                    ? "border-green-500 shadow-lg shadow-green-500/20 scale-105"
                    : canSelectThisPlan
                    ? "border-slate-600 hover:border-slate-500"
                    : "border-slate-700 opacity-60"
                }`}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      RECOMMENDED
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div
                    className={`${getPlanColor(
                      plan.name
                    )} mb-4 flex justify-center`}
                  >
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-white text-2xl">
                    {plan.displayName}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {plan.minTrucks} - {plan.maxTrucks || "∞"} trucks
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    <div
                      className={`text-4xl font-bold ${
                        canSelectThisPlan ? "text-white" : "text-slate-500"
                      }`}
                    >
                      $
                      {canSelectThisPlan
                        ? planPrice
                        : plan.basePrice || `${plan.pricePerTruck} × trucks`}
                      <span className="text-lg text-slate-400">/month</span>
                    </div>
                    {plan.basePrice && canSelectThisPlan && (
                      <div className="text-slate-400 text-sm mt-1">
                        ${(planPrice / truckCount).toFixed(2)} per truck
                      </div>
                    )}
                    {!canSelectThisPlan && (
                      <div className="text-slate-400 text-sm mt-2">
                        {truckCount < plan.minTrucks
                          ? `Minimum ${plan.minTrucks} trucks required`
                          : `Maximum ${plan.maxTrucks} trucks exceeded`}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {getPlanFeatures(plan.name).map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-slate-300"
                      >
                        <Check
                          className={`h-4 w-4 ${
                            canSelectThisPlan
                              ? "text-green-400"
                              : "text-slate-500"
                          }`}
                        />
                        <span
                          className={canSelectThisPlan ? "" : "text-slate-500"}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  <Button
                    className={`w-full ${
                      isRecommended
                        ? "bg-green-600 hover:bg-green-700"
                        : canSelectThisPlan
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-slate-600 cursor-not-allowed"
                    }`}
                    disabled={
                      !canSelectThisPlan || createCheckoutMutation.isPending
                    }
                    onClick={() =>
                      canSelectThisPlan && handleSubscribe(plan.id)
                    }
                  >
                    {!canSelectThisPlan
                      ? "Not Available"
                      : createCheckoutMutation.isPending
                      ? "Processing..."
                      : isRecommended
                      ? "Get Started - Best Value"
                      : "Choose Plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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
                  Can I change plans later?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Yes! You can upgrade or downgrade your plan at any time.
                  Changes take effect immediately, and we'll prorate the billing
                  accordingly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  What happens if I exceed my truck limit?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  We'll automatically suggest an upgrade to the next tier. You
                  can continue using all features while deciding whether to
                  upgrade or remove excess trucks.
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
                  Yes! All plans come with a 14-day free trial. No credit card
                  required to start. Cancel anytime during the trial period.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Do you offer annual billing?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Yes! Annual billing is available with a 20% discount. Contact
                  us for enterprise pricing and custom billing arrangements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
