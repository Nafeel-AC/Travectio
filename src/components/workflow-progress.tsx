import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TruckService } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  current?: boolean;
}

export default function WorkflowProgress() {
  // Check fleet setup status
  const { data: trucks = [] } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // TODO: Implement proper services for loads and fuel purchases
  const { data: loads = [] } = useQuery({
    queryKey: ['loads'],
    queryFn: () => Promise.resolve([]), // Placeholder
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: fuelPurchases = [] } = useQuery({
    queryKey: ['fuel-purchases'],
    queryFn: () => Promise.resolve([]), // Placeholder
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const hasTrucks = Array.isArray(trucks) && trucks.length > 0;
  const hasLoads = Array.isArray(loads) && loads.length > 0;
  const hasFuel = Array.isArray(fuelPurchases) && fuelPurchases.length > 0;

  const steps: WorkflowStep[] = [
    {
      id: "setup",
      title: "Set Up Fleet",
      description: "Add your trucks and drivers",
      href: "/add-truck",
      completed: hasTrucks
    },
    {
      id: "loads",
      title: "Plan Loads",
      description: "Find and assign profitable loads",
      href: "/load-management",
      completed: hasLoads
    },
    {
      id: "operations",
      title: "Track Operations",
      description: "Monitor HOS and log fuel",
      href: "/hos-management",
      completed: hasFuel
    },
    {
      id: "analytics",
      title: "Review Performance",
      description: "Analyze profitability and trends",
      href: "/fleet-analytics",
      completed: hasTrucks && hasLoads
    }
  ];

  // Find current step (first incomplete step)
  const currentStepIndex = steps.findIndex(step => !step.completed);
  if (currentStepIndex >= 0) {
    steps[currentStepIndex].current = true;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Fleet Setup Progress
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {steps.filter(s => s.completed).length} of {steps.length} complete
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : step.current ? (
                <Circle className="w-5 h-5 text-blue-500 animate-pulse" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <a 
                href={step.href}
                className={cn(
                  "block transition-colors",
                  step.current 
                    ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    : step.completed
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                <div className="font-medium">{step.title}</div>
                <div className="text-sm opacity-75">{step.description}</div>
              </a>
            </div>
            
            {step.current && (
              <ArrowRight className="w-4 h-4 text-blue-500 mt-1 animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {steps.every(s => s.completed) && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm font-medium text-green-800 dark:text-green-200">
            🎉 Fleet setup complete! Your system is ready for operations.
          </div>
        </div>
      )}
    </div>
  );
}