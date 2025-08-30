import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, BarChart3, TrendingUp, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { createSynchronizedMutation } from "@/lib/data-synchronization";

export type TimePeriod = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'bi-annually' | 'yearly';

interface TimePeriodFilterProps {
  onPeriodChange: (period: TimePeriod, startDate: Date, endDate: Date) => void;
  currentPeriod: TimePeriod;
}

export function TimePeriodFilter({ onPeriodChange, currentPeriod }: TimePeriodFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(currentPeriod);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });
  const queryClient = useQueryClient();

  const periodOptions = [
    { value: 'weekly', label: 'Weekly', days: 7 },
    { value: 'bi-weekly', label: 'Bi-Weekly', days: 14 },
    { value: 'monthly', label: 'Monthly', days: 30 },
    { value: 'quarterly', label: 'Quarterly', days: 90 },
    { value: 'bi-annually', label: 'Bi-Annually', days: 180 },
    { value: 'yearly', label: 'Yearly', days: 365 }
  ];

  const calculateDateRange = (period: TimePeriod): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'weekly':
        start.setDate(end.getDate() - 7);
        break;
      case 'bi-weekly':
        start.setDate(end.getDate() - 14);
        break;
      case 'monthly':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'bi-annually':
        start.setMonth(end.getMonth() - 6);
        break;
      case 'yearly':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { start, end };
  };

  useEffect(() => {
    const range = calculateDateRange(selectedPeriod);
    setDateRange(range);
    onPeriodChange(selectedPeriod, range.start, range.end);
  }, [selectedPeriod, onPeriodChange]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    
    // Don't invalidate queries here - let the context handle it
    // The useEffect above will trigger the onPeriodChange callback
  };

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: selectedPeriod === 'yearly' || selectedPeriod === 'bi-annually' ? 'numeric' : undefined
    };
    
    return `${dateRange.start.toLocaleDateString('en-US', options)} - ${dateRange.end.toLocaleDateString('en-US', options)}`;
  };

  const getCurrentPeriodInfo = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option || periodOptions[0];
  };

  return (
    <Card className="border-slate-700 bg-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <span>Time Period Analytics</span>
          <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-600/40">
            Cross-Tab Synchronized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Analysis Period
              </label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
                  <SelectValue className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {periodOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        <span className="text-slate-400 text-xs ml-2">({option.days}d)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Date Range
              </label>
              <div className="bg-slate-800 border border-slate-600 rounded-md p-3 text-white text-sm">
                {formatDateRange()}
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Active Analysis Period</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePeriodChange(selectedPeriod)}
                className="border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh Data
              </Button>
            </div>
            <div className="text-xs text-slate-400">
              All fleet data across all tabs will be filtered to show {getCurrentPeriodInfo().label.toLowerCase()} metrics 
              from {formatDateRange()}. Changes sync automatically across:
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {[
                'Dashboard Overview', 'Load Matcher', 'Fleet Summary', 'Cost Breakdown', 
                'Multi-Leg Planning', 'Fuel Calculator', 'HOS Dashboard', 'Load Board'
              ].map((tab) => (
                <Badge 
                  key={tab} 
                  variant="secondary" 
                  className="text-xs bg-blue-600/20 text-blue-400 border-0 hover:bg-blue-600/30"
                >
                  {tab}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-700 transition-colors">
              <div className="text-lg font-bold text-white">{getCurrentPeriodInfo().days}</div>
              <div className="text-xs text-slate-400">Days Coverage</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-700 transition-colors">
              <div className="text-lg font-bold text-green-400">
                {Math.ceil(getCurrentPeriodInfo().days / 7)}
              </div>
              <div className="text-xs text-slate-400">Weeks Analyzed</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-700 transition-colors">
              <div className="text-lg font-bold text-blue-400">100%</div>
              <div className="text-xs text-slate-400">Tab Sync</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}