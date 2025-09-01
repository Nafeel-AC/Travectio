import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Users,
  Truck,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Target,
  UserX,
  UserCheck,
  Shield,
  AlertTriangle,
  Crown,
  CheckCircle,
  X,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { useOwnerDashboard, useUserManagement } from "@/hooks/useSupabase";
import { useFounderAccess } from "@/hooks/useFounderAccess";

interface UserMetrics {
  userId: string;
  userInfo: {
    name: string;
    email: string;
    company: string;
    joinDate: string;
    isAdmin: boolean;
    isFounder: boolean;
    isActive: boolean;
  };
  fleetMetrics: {
    totalTrucks: number;
    activeTrucks: number;
    totalDrivers: number;
    equipmentTypes: string[];
  };
  operationalMetrics: {
    totalLoads: number;
    activeLoads: number;
    completedLoads: number;
    totalRevenue: number;
    totalMiles: number;
    avgRevenuePerMile: number;
    avgRevenuePerLoad: number;
    truckUtilization: number;
  };
  integrationMetrics: {
    loadBoards: string[];
    eldProviders: string[];
    integrationRate: number;
    integratedTrucks: number;
    manualTrucks: number;
  };
  recentActivity: Array<{
    loadId: string;
    route: string;
    revenue: number;
    status: string;
    date: string;
  }>;
}

interface OwnerDashboardData {
  systemTotals: {
    totalUsers: number;
    totalRevenue: number;
    totalMiles: number;
    totalTrucks: number;
    totalLoads: number;
    avgSystemRevenuePerMile: number;
    topPerformers: {
      byRevenue: UserMetrics[];
      byEfficiency: UserMetrics[];
      byUtilization: UserMetrics[];
    };
  };
  marketIntelligence: {
    loadBoardAdoption: Record<string, number>;
    eldProviderAdoption: Record<string, number>;
    equipmentTypeDistribution: Record<string, number>;
    integrationTrends: {
      fullyIntegrated: number;
      partiallyIntegrated: number;
      notIntegrated: number;
    };
  };
  userMetrics: UserMetrics[];
  scalabilityStatus: {
    currentUsers: number;
    maxCapacity: number;
    utilizationPercentage: number;
    growthCapacity: number;
  };
}

export default function OwnerDashboard() {
  const [terminationReason, setTerminationReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserMetrics | null>(null);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { terminateUser, reactivateUser } = useUserManagement();
  const { isFounder, isAdmin } = useFounderAccess();

  // Mock data for now since we're migrating from Express to Supabase
  const dashboardData = {
    success: true,
    dashboardData: {
      systemTotals: {
        totalUsers: 25,
        totalRevenue: 1250000,
        totalMiles: 500000,
        totalTrucks: 150,
        totalLoads: 800,
        avgSystemRevenuePerMile: 2.5,
        topPerformers: {
          byRevenue: [],
          byEfficiency: [],
          byUtilization: [],
        },
      },
      marketIntelligence: {
        loadBoardAdoption: { DAT: 15, Truckstop: 8, LoadBoard: 2 },
        eldProviderAdoption: { Samsara: 12, Geotab: 8, Omnitracs: 5 },
        equipmentTypeDistribution: { "Dry Van": 80, Reefer: 45, Flatbed: 25 },
      },
      userMetrics: [],
      scalabilityStatus: {
        currentUsers: 25,
        maxCapacity: 100,
        utilizationPercentage: 25,
        growthCapacity: 75,
      },
    },
  };

  const handleTerminateUser = async (userId: string) => {
    try {
      await terminateUser(userId);
      toast({
        title: "User Terminated",
        description: "The user has been successfully terminated.",
      });
      // Refresh the users list
      // The hook should handle this automatically
    } catch (error: any) {
      toast({
        title: "Failed to Terminate User",
        description:
          error.message || "There was an error terminating the user.",
        variant: "destructive",
      });
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      await reactivateUser(userId);
      toast({
        title: "User Reactivated",
        description: "The user has been successfully reactivated.",
      });
      // Refresh the users list
      // The hook should handle this automatically
    } catch (error: any) {
      toast({
        title: "Failed to Reactivate User",
        description:
          error.message || "There was an error reactivating the user.",
        variant: "destructive",
      });
    }
  };

  const confirmTermination = () => {
    if (selectedUser) {
      handleTerminateUser(selectedUser.userId);
    }
  };

  if (!dashboardData?.success) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">No dashboard data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { systemTotals, marketIntelligence, userMetrics, scalabilityStatus } =
    dashboardData.dashboardData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Complete system oversight and business intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`px-3 py-1 ${
              isFounder
                ? "border-purple-600 text-purple-600"
                : "border-amber-600 text-amber-600"
            }`}
          >
            {isFounder ? (
              <>
                <Crown className="h-4 w-4 mr-1" />
                Founder Access
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-1" />
                Admin Access
              </>
            )}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="h-4 w-4 mr-1" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${systemTotals.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${systemTotals.avgSystemRevenuePerMile}/mile system average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemTotals.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {scalabilityStatus.utilizationPercentage.toFixed(1)}% system
              capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Size</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemTotals.totalTrucks}</div>
            <p className="text-xs text-muted-foreground">
              {systemTotals.totalMiles.toLocaleString()} total miles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemTotals.totalLoads}</div>
            <p className="text-xs text-muted-foreground">
              Across all fleet operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Integration Adoption
            </CardTitle>
            <CardDescription>
              Load board and ELD integration trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Load Boards</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(marketIntelligence.loadBoardAdoption).map(
                  ([board, count]) => (
                    <Badge key={board} variant="outline">
                      {board}: {count}
                    </Badge>
                  )
                )}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">ELD Providers</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(marketIntelligence.eldProviderAdoption).map(
                  ([provider, count]) => (
                    <Badge key={provider} variant="outline">
                      {provider}: {count}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Distribution</CardTitle>
            <CardDescription>
              Fleet composition across all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(marketIntelligence.equipmentTypeDistribution).map(
                ([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium">{type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-200 rounded-full h-2 w-16 relative">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              ((count as number) / systemTotals.totalTrucks) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Scalability Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Usage</p>
              <p className="text-2xl font-bold">
                {scalabilityStatus.currentUsers}/{scalabilityStatus.maxCapacity}{" "}
                users
              </p>
            </div>
            <div className="w-64">
              <div className="bg-gray-200 rounded-full h-4 relative">
                <div
                  className="bg-green-600 h-4 rounded-full transition-all duration-300"
                  style={{
                    width: `${scalabilityStatus.utilizationPercentage}%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {scalabilityStatus.growthCapacity} users available for growth
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
