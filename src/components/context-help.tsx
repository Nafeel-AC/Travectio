import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Info, 
  AlertTriangle, 
  ArrowRight,
  X 
} from "lucide-react";
import { useState } from "react";

interface ContextHelpProps {
  context: 'truck-management' | 'load-calculator' | 'hos-tracking' | 'fuel-management' | 'analytics';
  visible: boolean;
  onClose: () => void;
}

const helpContent = {
  'truck-management': {
    title: "Truck Management Help",
    icon: Info,
    color: "blue",
    tips: [
      {
        title: "Quick Edit",
        description: "Click the pencil icon on truck cards to edit details directly from the dashboard",
        type: "tip"
      },
      {
        title: "Cost Accuracy",
        description: "Keep fixed and variable costs updated for accurate profitability calculations",
        type: "warning"
      },
      {
        title: "Equipment Types",
        description: "Select the correct equipment type to get matched with appropriate loads",
        type: "info"
      }
    ]
  },
  'load-calculator': {
    title: "Load Profitability Calculator",
    icon: Lightbulb,
    color: "yellow",
    tips: [
      {
        title: "Select Your Truck",
        description: "Choose the truck from the dropdown to use its actual cost data for calculations",
        type: "tip"
      },
      {
        title: "Include All Costs",
        description: "Enter total miles including deadhead to get accurate profit margins",
        type: "warning"
      },
      {
        title: "Green = Good",
        description: "Aim for 20%+ profit margins (green) for sustainable operations",
        type: "info"
      }
    ]
  },
  'hos-tracking': {
    title: "Hours of Service Tracking",
    icon: AlertTriangle,
    color: "orange",
    tips: [
      {
        title: "Daily Limits",
        description: "Maximum 11 hours driving, 14 hours on-duty, then mandatory 10-hour break",
        type: "warning"
      },
      {
        title: "Log Changes Promptly",
        description: "Update duty status immediately when switching between driving, on-duty, and off-duty",
        type: "tip"
      },
      {
        title: "Plan Ahead",
        description: "Check remaining hours before accepting loads to avoid violations",
        type: "info"
      }
    ]
  },
  'fuel-management': {
    title: "Fuel Management",
    icon: Info,
    color: "blue",
    tips: [
      {
        title: "Log Immediately",
        description: "Enter fuel purchases right after filling up to maintain accurate records",
        type: "tip"
      },
      {
        title: "Track MPG",
        description: "Monitor fuel efficiency by truck to identify maintenance needs",
        type: "info"
      },
      {
        title: "Include All Costs",
        description: "Record fuel, DEF, and any additives for complete cost tracking",
        type: "warning"
      }
    ]
  },
  'analytics': {
    title: "Analytics & Performance",
    icon: Info,
    color: "purple",
    tips: [
      {
        title: "Use Time Filters",
        description: "Select different time periods to analyze trends and patterns",
        type: "tip"
      },
      {
        title: "Compare Performance",
        description: "Compare different trucks and time periods to identify top performers",
        type: "info"
      },
      {
        title: "Export Data",
        description: "Download reports for accounting and tax preparation",
        type: "warning"
      }
    ]
  }
};

export function ContextHelp({ context, visible, onClose }: ContextHelpProps) {
  const help = helpContent[context];
  
  if (!visible || !help) return null;

  const getIconColor = (type: string) => {
    switch (type) {
      case 'tip': return 'text-yellow-400';
      case 'warning': return 'text-orange-400';
      default: return 'text-blue-400';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'tip': return 'bg-yellow-600/20 text-yellow-200 border-yellow-600/30';
      case 'warning': return 'bg-orange-600/20 text-orange-200 border-orange-600/30';
      default: return 'bg-blue-600/20 text-blue-200 border-blue-600/30';
    }
  };

  return (
    <Card className="fixed bottom-20 right-4 z-40 bg-slate-800 border-slate-700 w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <help.icon className={`w-4 h-4 ${getIconColor(help.color)}`} />
            {help.title}
          </CardTitle>
          <Button
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {help.tips.map((tip, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
            <div className="flex-shrink-0">
              {tip.type === 'tip' && <Lightbulb className="w-4 h-4 text-yellow-400" />}
              {tip.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
              {tip.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-sm font-medium">{tip.title}</span>
                <Badge className={`text-xs ${getBadgeColor(tip.type)}`}>
                  {tip.type}
                </Badge>
              </div>
              <p className="text-slate-300 text-xs">{tip.description}</p>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t border-slate-600">
          <Button
            onClick={onClose}
            size="sm"
            variant="outline"
            className="w-full border-slate-600 text-slate-300 text-xs"
          >
            Got It
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContextHelp;