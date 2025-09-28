import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Calendar,
  Plus,
  Zap,
  Truck,
  Route,
  Target
} from "lucide-react";
import { useDrivers, useTrucks, useLoads } from "@/hooks/useSupabase";
import EnhancedHOSEntry from "@/components/enhanced-hos-entry";
import { Link } from "wouter";

interface DriverComplianceCardProps {
  driver: any;
  truck?: any;
  hosStatus?: any;
}

function DriverComplianceCard({ driver, truck, hosStatus }: DriverComplianceCardProps) {
  const getComplianceStatus = () => {
    // Mock compliance status - in real app this would come from HOS service
    const violations = Math.random() > 0.8 ? 1 : 0; // 20% chance of violation
    return {
      status: violations === 0 ? 'compliant' : 'violation',
      hoursRemaining: Math.floor(Math.random() * 10) + 1,
      violations: violations
    };
  };

  const compliance = getComplianceStatus();

  return (
    <Card className="border-slate-700 bg-slate-800 hover:border-slate-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-white">{driver.firstName} {driver.lastName}</div>
              <div className="text-sm text-slate-400">CDL: {driver.cdlNumber || 'Not provided'}</div>
            </div>
          </div>
          <Badge 
            variant={compliance.status === 'compliant' ? 'default' : 'destructive'}
            className={compliance.status === 'compliant' ? 'bg-green-600' : 'bg-red-600'}
          >
            {compliance.status === 'compliant' ? 'Compliant' : 'Violation'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Assigned Truck:</span>
            <span className="text-white">{truck?.name || 'None'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Hours Remaining:</span>
            <span className={`font-medium ${compliance.hoursRemaining > 3 ? 'text-green-400' : 'text-yellow-400'}`}>
              {compliance.hoursRemaining}h
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Current Status:</span>
            <span className="text-blue-400">On Duty</span>
          </div>
          {compliance.violations > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Violations:</span>
              <span className="text-red-400 font-medium">{compliance.violations}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LoadRecommendationProps {
  load: any;
  driver: any;
  isRecommended: boolean;
  reason: string;
}

function LoadRecommendationCard({ load, driver, isRecommended, reason }: LoadRecommendationProps) {
  return (
    <Card className={`border-slate-700 ${isRecommended ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'} transition-colors`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {load.type === 'Dry Van' ? '📦' : load.type === 'Reefer' ? '🧊' : '🏗️'}
            </div>
            <div>
              <div className="font-medium text-white">{load.type}</div>
              <div className="text-sm text-slate-400">{load.commodity}</div>
            </div>
          </div>
          <Badge 
            variant={isRecommended ? 'default' : 'destructive'}
            className={isRecommended ? 'bg-green-600' : 'bg-red-600'}
          >
            {isRecommended ? 'Recommended' : 'Not Recommended'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Route:</span>
            <span className="text-white">
              {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Miles:</span>
            <span className="text-blue-300">{load.miles?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Pay:</span>
            <span className="text-green-300">${load.pay?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Driver:</span>
            <span className="text-white">{driver.firstName} {driver.lastName}</span>
          </div>
          <div className={`text-sm pt-2 border-t border-slate-600 ${isRecommended ? 'text-green-400' : 'text-red-400'}`}>
            <span className="font-medium">Reason: </span>
            {reason}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComplianceTab() {
  const { drivers, loading: driversLoading } = useDrivers();
  const { trucks, loading: trucksLoading } = useTrucks();
  const { loads, loading: loadsLoading } = useLoads();

  const isLoading = driversLoading || trucksLoading || loadsLoading;

  // Get drivers with their assigned trucks
  const driversWithTrucks = (drivers as any[]).map(driver => ({
    ...driver,
    truck: (trucks as any[]).find(t => t.id === driver.truckId)
  }));

  // Generate load recommendations based on HOS compliance
  const generateLoadRecommendations = () => {
    const unassignedLoads = (loads as any[]).filter(load => !load.truckId);
    const recommendations = [];

    for (const load of unassignedLoads.slice(0, 5)) { // Show top 5 recommendations
      const availableDrivers = driversWithTrucks.filter(driver => driver.truck && !driver.truck.isAssigned);
      
      if (availableDrivers.length > 0) {
        const driver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
        
        // Mock HOS compliance check
        const hoursRemaining = Math.floor(Math.random() * 10) + 1;
        const estimatedHours = Math.ceil((load.miles || 500) / 60); // Assume 60 mph average
        
        const isRecommended = hoursRemaining >= estimatedHours + 2; // Need 2 hours buffer
        const reason = isRecommended 
          ? `Driver has ${hoursRemaining}h available, load needs ~${estimatedHours}h`
          : `Driver only has ${hoursRemaining}h available, load needs ~${estimatedHours}h + buffer`;

        recommendations.push({
          load,
          driver,
          isRecommended,
          reason,
          hoursRemaining,
          estimatedHours
        });
      }
    }

    return recommendations;
  };

  const loadRecommendations = generateLoadRecommendations();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 pb-20 md:pb-6 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-1/3"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-slate-600 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Compliance</h1>
          <p className="text-slate-400">Monitor HOS compliance and ensure load recommendations are feasible</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            <Shield className="h-3 w-3 mr-1" />
            DOT Compliant
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="hos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="hos" className="text-slate-300 data-[state=active]:text-white">
            Hours of Service
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="text-slate-300 data-[state=active]:text-white">
            Load Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hos" className="space-y-6">
          {/* HOS Entry Form */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                HOS Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedHOSEntry />
            </CardContent>
          </Card>

          {/* Driver Compliance Status */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                Driver Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {driversWithTrucks.map((driver) => (
                  <DriverComplianceCard key={driver.id} driver={driver} truck={driver.truck} />
                ))}
              </div>
              
              {(drivers as any[]).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>No drivers found</p>
                  <p className="text-sm">Add drivers to monitor HOS compliance</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Alerts */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className="text-yellow-200 font-medium">Driver John Smith - Low Hours</div>
                    <div className="text-yellow-300 text-sm">Only 2 hours remaining before 11-hour break required</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-green-200 font-medium">All drivers compliant</div>
                    <div className="text-green-300 text-sm">No violations detected in the last 24 hours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Load Recommendations Based on HOS */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5" />
                HOS-Compliant Load Recommendations
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Loads are recommended based on driver hours remaining and estimated trip time
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadRecommendations.length > 0 ? (
                  loadRecommendations.map((rec, index) => (
                    <LoadRecommendationCard
                      key={index}
                      load={rec.load}
                      driver={rec.driver}
                      isRecommended={rec.isRecommended}
                      reason={rec.reason}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Route className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No load recommendations available</p>
                    <p className="text-sm">Add drivers and loads to get HOS-based recommendations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ELD Integration Status */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="h-5 w-5" />
                ELD Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Manual Entry</div>
                    <div className="text-slate-400 text-sm">Manual HOS logging available</div>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">ELD API</div>
                    <div className="text-slate-400 text-sm">Automatic ELD integration</div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-600">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
