import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Truck, FileText, Fuel, Calculator, TrendingUp, Users, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function WelcomeOnboarding() {
  const { user } = useAuth();
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([
    {
      id: 'add-truck',
      title: 'Add Truck to Fleet',
      description: 'Set up your fleet with detailed cost breakdown and driver assignment',
      icon: Truck,
      href: '/add-truck',
      completed: false,
      priority: 'high'
    },
    {
      id: 'create-load',
      title: 'Manage Your First Load',
      description: 'Create loads and track profitability with automatic calculations',
      icon: FileText,
      href: '/load-management',
      completed: false,
      priority: 'high'
    },
    {
      id: 'fuel-tracking',
      title: 'Track Fuel Purchases',
      description: 'Monitor fuel costs and calculate accurate MPG for your operations',
      icon: Fuel,
      href: '/fuel-management',
      completed: false,
      priority: 'medium'
    },
    {
      id: 'load-calculator',
      title: 'Use Profitability Calculator',
      description: 'Calculate load profitability with real-time operational data',
      icon: Calculator,
      href: '/?tab=calculator',
      completed: false,
      priority: 'medium'
    },
    {
      id: 'analytics',
      title: 'Review Fleet Analytics',
      description: 'Monitor performance metrics and operational insights',
      icon: TrendingUp,
      href: '/enhanced-dashboard',
      completed: false,
      priority: 'low'
    }
  ]);

  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const totalSteps = onboardingSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  const priorityLabels = {
    high: 'Essential',
    medium: 'Recommended',
    low: 'Optional'
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800/50">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl sm:text-2xl">Welcome to Travectio!</CardTitle>
              <CardDescription className="text-base sm:text-lg mt-1">
                {(user as any)?.firstName ? `Hi ${(user as any).firstName}! ` : "Hi! "}
                Let's get your fleet management system set up for maximum efficiency.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Setup Progress</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{completedSteps} of {totalSteps} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Complete these steps to unlock the full potential of your fleet management platform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Steps */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {onboardingSteps.map((step, index) => {
          const IconComponent = step.icon;
          const isCompleted = step.completed;
          
          return (
            <Card 
              key={step.id} 
              className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${
                isCompleted ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700' : 'hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-green-100 dark:bg-green-800/50' : 'bg-blue-100 dark:bg-blue-900/50'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">
                      Step {index + 1}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${priorityColors[step.priority]} text-white text-xs flex-shrink-0`}
                  >
                    {priorityLabels[step.priority]}
                  </Badge>
                </div>
                <CardTitle className={`text-base sm:text-lg mt-2 ${isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {step.title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">{step.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={step.href}>
                  <Button 
                    variant={isCompleted ? "outline" : "default"} 
                    className="w-full group h-9 sm:h-10"
                    disabled={isCompleted}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Completed</span>
                        <span className="sm:hidden">Done</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Get Started</span>
                        <span className="sm:hidden">Start</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Overview */}
      <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5" />
            <span>Platform Overview</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Key benefits you'll unlock with Travectio fleet management
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">Real-time</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Cost Tracking</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">Automated</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Calculations</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">Smart</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Load Matching</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
              <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">Complete</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Fleet Insights</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100 text-base sm:text-lg">Need Help Getting Started?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Our support team is here to help you maximize your fleet's potential.
              </p>
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Contact Support</span>
              <span className="sm:hidden">Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}