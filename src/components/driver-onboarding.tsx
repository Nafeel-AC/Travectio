import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Circle, 
  Truck, 
  MapPin, 
  Calculator, 
  Clock, 
  Smartphone,
  ArrowRight,
  Play,
  User,
  Settings
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  tasks: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    action?: string;
    link?: string;
  }[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Set up your driver profile and account preferences",
    icon: User,
    tasks: [
      {
        id: "basic-info",
        title: "Add Basic Information",
        description: "Name, CDL number, contact details",
        completed: false,
        action: "Edit Profile",
        link: "/profile"
      },
      {
        id: "preferences",
        title: "Set Preferences",
        description: "Notification settings, preferred routes",
        completed: false,
        action: "Update Settings",
        link: "/settings"
      }
    ]
  },
  {
    id: "truck-setup",
    title: "Add Your First Truck",
    description: "Register and configure your truck with accurate cost information",
    icon: Truck,
    tasks: [
      {
        id: "add-truck",
        title: "Add Truck Details",
        description: "Name, VIN, equipment type, and basic info",
        completed: false,
        action: "Add Truck",
        link: "/guided-truck-addition"
      },
      {
        id: "cost-breakdown",
        title: "Set Cost Breakdown",
        description: "Fixed and variable costs for accurate profitability",
        completed: false,
        action: "Configure Costs",
        link: "/guided-truck-addition"
      }
    ]
  },
  {
    id: "first-load",
    title: "Log Your First Load",
    description: "Learn to add and track loads for profitability analysis",
    icon: MapPin,
    tasks: [
      {
        id: "add-load",
        title: "Add Load Information",
        description: "Origin, destination, rate, and load details",
        completed: false,
        action: "Add Load",
        link: "/load-manager"
      },
      {
        id: "review-profit",
        title: "Review Profitability",
        description: "Check profit margins and cost analysis",
        completed: false,
        action: "Use Calculator",
        link: "/dashboard"
      }
    ]
  },
  {
    id: "hos-setup",
    title: "Set Up Hours of Service",
    description: "Configure HOS tracking for DOT compliance",
    icon: Clock,
    tasks: [
      {
        id: "connect-eld",
        title: "Connect ELD Device",
        description: "Link your Electronic Logging Device",
        completed: false,
        action: "Connect ELD",
        link: "/hos-dashboard"
      },
      {
        id: "log-duty",
        title: "Log Duty Status",
        description: "Record your current duty status",
        completed: false,
        action: "Update Status",
        link: "/hos-dashboard"
      }
    ]
  },
  {
    id: "mobile-setup",
    title: "Mobile Navigation",
    description: "Learn mobile features and shortcuts for on-the-road use",
    icon: Smartphone,
    tasks: [
      {
        id: "mobile-tour",
        title: "Take Mobile Tour",
        description: "Learn touch navigation and mobile features",
        completed: false,
        action: "Start Tour"
      },
      {
        id: "shortcuts",
        title: "Learn Quick Actions",
        description: "Master mobile shortcuts and gestures",
        completed: false,
        action: "Practice"
      }
    ]
  }
];

interface DriverOnboardingProps {
  isNew?: boolean;
  onComplete?: () => void;
}

export function DriverOnboarding({ isNew = false, onComplete }: DriverOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(isNew);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Load completed tasks from localStorage
    const saved = localStorage.getItem('travectio-onboarding-progress');
    if (saved) {
      const parsedTasks: string[] = JSON.parse(saved);
      setCompletedTasks(new Set(parsedTasks));
    }
  }, []);

  useEffect(() => {
    // Calculate progress
    const totalTasks = onboardingSteps.reduce((sum, step) => sum + step.tasks.length, 0);
    const completed = completedTasks.size;
    setProgress((completed / totalTasks) * 100);

    // Save progress
    localStorage.setItem('travectio-onboarding-progress', JSON.stringify(Array.from(completedTasks)));
  }, [completedTasks]);

  const markTaskCompleted = (taskId: string) => {
    setCompletedTasks(prev => new Set([...prev, taskId]));
  };

  const isStepCompleted = (step: OnboardingStep) => {
    return step.tasks.every(task => completedTasks.has(task.id));
  };

  const getCompletedStepsCount = () => {
    return onboardingSteps.filter(step => isStepCompleted(step)).length;
  };

  const completeOnboarding = () => {
    localStorage.setItem('travectio-onboarding-completed', 'true');
    setIsOpen(false);
    onComplete?.();
  };

  return (
    <>
      {/* Onboarding Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Driver Onboarding
              <Badge variant="secondary" className="bg-slate-700 text-slate-300 ml-auto">
                {getCompletedStepsCount()} of {onboardingSteps.length} Complete
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Overall Progress</span>
                <span className="text-white font-medium">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {onboardingSteps.map((step, index) => {
                const stepCompleted = isStepCompleted(step);
                const stepActive = index === currentStep;
                
                return (
                  <Card 
                    key={step.id} 
                    className={`bg-slate-700 border-slate-600 ${stepActive ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stepCompleted ? 'bg-green-600/20' : 'bg-blue-600/20'}`}>
                          {stepCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <step.icon className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-white text-sm flex items-center gap-2">
                            {step.title}
                            {stepCompleted && (
                              <Badge className="bg-green-600/20 text-green-200 border-green-600/30 text-xs">
                                Complete
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-slate-300 text-xs mt-1">{step.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {step.tasks.map((task) => {
                        const taskCompleted = completedTasks.has(task.id);
                        
                        return (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              {taskCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400" />
                              )}
                              <div>
                                <p className="text-white text-sm font-medium">{task.title}</p>
                                <p className="text-slate-400 text-xs">{task.description}</p>
                              </div>
                            </div>
                            {!taskCompleted && task.action && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (task.link) {
                                    window.location.href = task.link;
                                  }
                                  markTaskCompleted(task.id);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-xs"
                              >
                                {task.action}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-600">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentStep(Math.min(onboardingSteps.length - 1, currentStep + 1))}
                  disabled={currentStep === onboardingSteps.length - 1}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300"
                >
                  Next
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400"
                >
                  Skip for Now
                </Button>
                
                {progress >= 80 && (
                  <Button
                    onClick={completeOnboarding}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Complete Setup
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}

export default DriverOnboarding;