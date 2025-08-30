import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Info, Lightbulb, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureTooltipProps {
  children: React.ReactNode;
  title: string;
  description: string;
  tips?: string[];
  type?: "info" | "tip" | "warning" | "feature";
  placement?: "top" | "bottom" | "left" | "right";
}

export function FeatureTooltip({ 
  children, 
  title, 
  description, 
  tips = [], 
  type = "info",
  placement = "top" 
}: FeatureTooltipProps) {
  const getIcon = () => {
    switch (type) {
      case "tip":
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case "warning":
        return <HelpCircle className="w-4 h-4 text-orange-400" />;
      case "feature":
        return <Zap className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (type) {
      case "tip":
        return "bg-yellow-600/20 text-yellow-200 border-yellow-600/30";
      case "warning":
        return "bg-orange-600/20 text-orange-200 border-orange-600/30";
      case "feature":
        return "bg-blue-600/20 text-blue-200 border-blue-600/30";
      default:
        return "bg-slate-600/20 text-slate-200 border-slate-600/30";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={placement as any}
          className="bg-slate-800 border-slate-600 text-white p-4 max-w-xs"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getIcon()}
              <span className="font-medium text-sm">{title}</span>
              <Badge className={cn("text-xs", getBadgeColor())}>
                {type}
              </Badge>
            </div>
            <p className="text-sm text-slate-300">{description}</p>
            {tips.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-200">Tips:</p>
                <ul className="space-y-1">
                  {tips.map((tip, index) => (
                    <li key={index} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Contextual help for specific features
export const trucksTooltips = {
  equipment: {
    title: "Equipment Type",
    description: "Select the type of trailer your truck pulls. This affects load matching and rate calculations.",
    tips: [
      "Dry Van: Most common, standard freight",
      "Reefer: Temperature-controlled loads",
      "Flatbed: Construction materials, machinery"
    ],
    type: "feature" as const
  },
  costPerMile: {
    title: "Cost Per Mile",
    description: "Total operating cost per mile including fuel, maintenance, insurance, and other expenses.",
    tips: [
      "Industry average is $1.50-$2.50 per mile",
      "Update regularly for accurate profitability",
      "Includes both fixed and variable costs"
    ],
    type: "info" as const
  },
  fixedCosts: {
    title: "Fixed Costs",
    description: "Weekly expenses that don't change with miles driven (insurance, truck payments, permits).",
    tips: [
      "Insurance: $200-$400/week",
      "Truck payment: $800-$1200/week",
      "Permits & licenses: $50-$100/week"
    ],
    type: "tip" as const
  },
  variableCosts: {
    title: "Variable Costs",
    description: "Costs that increase with miles driven (fuel, maintenance, tires, driver pay).",
    tips: [
      "Fuel: $0.40-$0.60 per mile",
      "Maintenance: $0.15-$0.25 per mile", 
      "Driver pay: $0.45-$0.65 per mile"
    ],
    type: "tip" as const
  }
};

export const loadTooltips = {
  deadheadMiles: {
    title: "Deadhead Miles",
    description: "Non-revenue miles driven to pick up or position for the next load.",
    tips: [
      "Try to keep under 10% of total miles",
      "Plan backhauls to minimize deadhead",
      "Factor into total cost calculations"
    ],
    type: "warning" as const
  },
  loadRate: {
    title: "Load Rate",
    description: "Total payment for hauling this load, including fuel surcharge and accessories.",
    tips: [
      "Confirm rate includes all charges",
      "Get rate confirmation in writing",
      "Factor in detention time pay"
    ],
    type: "feature" as const
  },
  profitMargin: {
    title: "Profit Margin",
    description: "Percentage of revenue remaining after all costs. Aim for 20-30% margins.",
    tips: [
      "Green: 20%+ (Good)",
      "Yellow: 10-20% (Acceptable)",
      "Red: <10% (Consider rejecting)"
    ],
    type: "info" as const
  }
};

export const hosTooltips = {
  driveTime: {
    title: "Drive Time",
    description: "Hours available for driving under DOT Hours of Service regulations.",
    tips: [
      "Maximum 11 hours driving per day",
      "Cannot drive after 14 hours on duty",
      "Must take 10-hour break between shifts"
    ],
    type: "warning" as const
  },
  dutyStatus: {
    title: "Duty Status",
    description: "Current regulatory status as required by DOT.",
    tips: [
      "Off Duty: Not working, resting",
      "Sleeper: Resting in sleeper berth",
      "Driving: Operating the vehicle",
      "On Duty: Working but not driving"
    ],
    type: "info" as const
  }
};