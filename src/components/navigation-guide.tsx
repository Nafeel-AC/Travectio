import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  HelpCircle, 
  Navigation, 
  Truck, 
  MapPin, 
  Calculator, 
  BarChart3, 
  Clock, 
  Package, 
  DollarSign,
  Fuel,
  Settings,
  User,
  ChevronRight,
  Play,
  CheckCircle,
  ArrowRight,
  Smartphone,
  MousePointer
} from "lucide-react";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  target: string;
  action: string;
  tips: string[];
}

const navigationSteps: GuideStep[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Your main hub showing fleet metrics, active loads, and key performance indicators",
    icon: BarChart3,
    target: "/dashboard",
    action: "View real-time metrics and fleet status",
    tips: [
      "Check daily profit margins and cost per mile",
      "Monitor active vs inactive trucks",
      "Review recent activities and alerts"
    ]
  },
  {
    id: "trucks",
    title: "Truck Management",
    description: "Add, edit, and manage your fleet vehicles with cost tracking",
    icon: Truck,
    target: "/guided-truck-addition",
    action: "Add or manage trucks",
    tips: [
      "Click edit icon on truck cards for quick changes",
      "Set accurate fixed and variable costs",
      "Update equipment types for better load matching"
    ]
  },
  {
    id: "loads",
    title: "Load Management",
    description: "Track and manage freight loads with profitability calculations",
    icon: Package,
    target: "/load-manager",
    action: "Add and track loads",
    tips: [
      "Enter pickup and delivery locations accurately",
      "System automatically calculates miles and costs",
      "Monitor load profitability in real-time"
    ]
  },
  {
    id: "calculator",
    title: "Load Profitability Calculator",
    description: "Calculate potential profits before accepting loads",
    icon: Calculator,
    target: "#load-calculator",
    action: "Calculate load profits",
    tips: [
      "Select your truck from the dropdown",
      "Enter rate, miles, and fuel details",
      "Review profit margin before accepting"
    ]
  },
  {
    id: "hos",
    title: "Hours of Service (HOS)",
    description: "Monitor driver hours and compliance with DOT regulations",
    icon: Clock,
    target: "/hos-dashboard",
    action: "Track driving hours",
    tips: [
      "Check remaining drive time daily",
      "Plan routes within HOS limits",
      "Log duty status changes promptly"
    ]
  },
  {
    id: "fuel",
    title: "Fuel Management",
    description: "Track fuel purchases and monitor efficiency metrics",
    icon: Fuel,
    target: "/fuel-manager",
    action: "Log fuel purchases",
    tips: [
      "Enter fuel purchases immediately",
      "Track MPG performance by truck",
      "Monitor fuel cost trends"
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    description: "View detailed performance reports and business insights",
    icon: BarChart3,
    target: "/analytics",
    action: "Review performance data",
    tips: [
      "Use time filters for specific periods",
      "Compare truck performance",
      "Export data for accounting"
    ]
  }
];

const mobileNavigationTips = [
  {
    title: "Touch Navigation",
    icon: Smartphone,
    tips: [
      "Tap cards to view details",
      "Swipe left/right on data tables",
      "Use hamburger menu (☰) for navigation",
      "Long press for additional options"
    ]
  },
  {
    title: "Quick Actions",
    icon: MousePointer,
    tips: [
      "Edit truck info with pencil icon",
      "Add loads with + button",
      "View profiles by tapping truck names",
      "Access help with ? icon"
    ]
  }
];

interface NavigationGuideProps {
  isFirstTime?: boolean;
}

export function NavigationGuide({ isFirstTime = false }: NavigationGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(isFirstTime);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if user has completed the tour
    const hasCompletedTour = localStorage.getItem('travectio-tour-completed');
    if (!hasCompletedTour && isFirstTime) {
      setIsOpen(true);
    }
  }, [isFirstTime]);

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const completeTour = () => {
    localStorage.setItem('travectio-tour-completed', 'true');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (currentStep < navigationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      {/* Help Button - Always visible */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Help
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-slate-800 border-slate-700 text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              System Navigation Guide
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Quick Start Tour */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => {
                    setCurrentStep(0);
                    setIsOpen(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Guided Tour
                </Button>
              </CardContent>
            </Card>

            {/* Feature Guide */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Features & Navigation</h3>
              {navigationSteps.map((step, index) => (
                <Card key={step.id} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <step.icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm">{step.title}</h4>
                        <p className="text-slate-300 text-xs mt-1">{step.description}</p>
                        <div className="mt-2">
                          <Badge variant="secondary" className="bg-slate-600 text-slate-200 text-xs">
                            {step.action}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mobile Tips */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Mobile Navigation Tips</h3>
              {mobileNavigationTips.map((tip, index) => (
                <Card key={index} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-600/20 rounded-lg">
                        <tip.icon className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{tip.title}</h4>
                        <ul className="text-slate-300 text-xs mt-2 space-y-1">
                          {tip.tips.map((t, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Support */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-4 text-center">
                <h4 className="text-white font-medium text-sm mb-2">Need Additional Help?</h4>
                <p className="text-slate-300 text-xs mb-3">
                  Contact Travectio Support for personalized assistance
                </p>
                <Button variant="outline" size="sm" className="border-slate-500 text-slate-300">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Guided Tour Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Fleet Management System Tour
              <Badge variant="secondary" className="bg-slate-700 text-slate-300 ml-auto">
                {currentStep + 1} of {navigationSteps.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {navigationSteps[currentStep] && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex p-4 bg-blue-600/20 rounded-full mb-4">
                  {React.createElement(navigationSteps[currentStep].icon, {
                    className: "w-8 h-8 text-blue-400"
                  })}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {navigationSteps[currentStep].title}
                </h3>
                <p className="text-slate-300 mb-4">
                  {navigationSteps[currentStep].description}
                </p>
              </div>

              <Card className="bg-slate-700 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    How to Use This Feature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
                    <p className="text-blue-200 text-sm font-medium">
                      {navigationSteps[currentStep].action}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-medium">Pro Tips:</h4>
                    <ul className="space-y-1">
                      {navigationSteps[currentStep].tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Progress</span>
                  <span>{Math.round(((currentStep + 1) / navigationSteps.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / navigationSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    className="text-slate-400"
                  >
                    Skip Tour
                  </Button>
                  
                  <Button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {currentStep === navigationSteps.length - 1 ? 'Complete Tour' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default NavigationGuide;