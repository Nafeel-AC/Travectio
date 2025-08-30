import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, CheckCircle } from "lucide-react";
import { useDemoApi } from "@/hooks/useDemoApi";
import { Link } from "wouter";

export default function NextStepGuide() {
  const { useDemoQuery } = useDemoApi();
  // Check current status to determine next step
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

  const { data: fuelPurchases = [] } = useDemoQuery(
    ["/api/fuel-purchases"],
    "/api/fuel-purchases",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const hasTrucks = Array.isArray(trucks) && trucks.length > 0;
  const hasLoads = Array.isArray(loads) && loads.length > 0;
  const hasFuel = Array.isArray(fuelPurchases) && fuelPurchases.length > 0;

  // Determine what the user should do next
  const getNextStep = () => {
    if (!hasTrucks) {
      return {
        title: "Add Your First Truck",
        description: "Set up your fleet by adding trucks and drivers to get started",
        action: "Add Truck",
        href: "/add-truck",
        priority: "high",
        timeEstimate: "5 minutes"
      };
    }
    
    if (!hasLoads) {
      return {
        title: "Plan Your First Load",
        description: "Find and assign profitable loads to start generating revenue",
        action: "Find Loads",
        href: "/load-management",
        priority: "high",
        timeEstimate: "10 minutes"
      };
    }
    
    if (!hasFuel) {
      return {
        title: "Log Fuel Purchases",
        description: "Track fuel to calculate accurate cost per mile and profitability",
        action: "Log Fuel",
        href: "/fuel-management",
        priority: "medium",
        timeEstimate: "3 minutes"
      };
    }
    
    return {
      title: "Review Performance",
      description: "Analyze your fleet's profitability and identify optimization opportunities",
      action: "View Analytics",
      href: "/fleet-analytics",
      priority: "low",
      timeEstimate: "5 minutes"
    };
  };

  const nextStep = getNextStep();
  
  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowRight className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">Next Step</CardTitle>
          </div>
          <Badge variant="outline" className={priorityColors[nextStep.priority]}>
            {nextStep.priority} priority
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {nextStep.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {nextStep.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{nextStep.timeEstimate}</span>
          </div>
          
          <Link href={nextStep.href}>
            <Button className="flex items-center space-x-2">
              <span>{nextStep.action}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        {/* Progress indicators */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t">
          <div className="flex items-center space-x-1 text-xs">
            {hasTrucks ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={hasTrucks ? "text-green-600" : "text-gray-400"}>Trucks</span>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            {hasLoads ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={hasLoads ? "text-green-600" : "text-gray-400"}>Loads</span>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            {hasFuel ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={hasFuel ? "text-green-600" : "text-gray-400"}>Fuel</span>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            {hasTrucks && hasLoads ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={hasTrucks && hasLoads ? "text-green-600" : "text-gray-400"}>Analytics</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}