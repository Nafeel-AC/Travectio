import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Truck, DollarSign, Activity, BarChart3, PieChart, Target, UserX, UserCheck, Shield, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

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
  const { useDemoQuery } = useDemoApi();

  const { data: dashboardData, isLoading, error } = useDemoQuery(
    ["/api/owner/dashboard"],
    "/api/owner/dashboard",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const terminateUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string, reason: string }) => {
      const response = await fetch(`/api/owner/users/${userId}/terminate`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session authentication
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to terminate user');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "User Access Terminated",
        description: `Successfully terminated access for ${selectedUser?.userInfo.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/dashboard"] });
      setShowTerminateDialog(false);
      setTerminationReason("");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Termination Failed",
        description: error.message || "Failed to terminate user access",
        variant: "destructive",
      });
    },
  });

  const reactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/owner/users/${userId}/reactivate`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate user');
      }
      
      return response.json();
    },
    onSuccess: (data, userId) => {
      const user = dashboardData?.dashboardData.userMetrics.find(u => u.userId === userId);
      toast({
        title: "User Access Reactivated",
        description: `Successfully reactivated access for ${user?.userInfo.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Reactivation Failed",
        description: error.message || "Failed to reactivate user access",
        variant: "destructive",
      });
    },
  });

  const handleTerminateUser = (user: UserMetrics) => {
    setSelectedUser(user);
    setShowTerminateDialog(true);
  };

  const confirmTermination = () => {
    if (selectedUser) {
      terminateUserMutation.mutate({
        userId: selectedUser.userId,
        reason: terminationReason
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading owner dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <Activity className="h-5 w-5" />
              <span className="font-medium">Access Error</span>
            </div>
            <p className="text-red-700 mt-2">
              Unable to load owner dashboard. You may need founder-level privileges to access this data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const { systemTotals, marketIntelligence, userMetrics, scalabilityStatus } = dashboardData.dashboardData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete system oversight and business intelligence</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Activity className="h-4 w-4 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${systemTotals.totalRevenue.toLocaleString()}</div>
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
              {scalabilityStatus.utilizationPercentage.toFixed(1)}% system capacity
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

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Top Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemTotals.topPerformers.byRevenue.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.userInfo.name}</p>
                  <p className="text-sm text-gray-600">{user.fleetMetrics.totalTrucks} trucks</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ${user.operationalMetrics.totalRevenue.toLocaleString()}
                  </p>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Most Efficient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemTotals.topPerformers.byEfficiency.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.userInfo.name}</p>
                  <p className="text-sm text-gray-600">{user.operationalMetrics.totalMiles.toLocaleString()} miles</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">
                    ${user.operationalMetrics.avgRevenuePerMile}/mi
                  </p>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-600" />
              Best Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemTotals.topPerformers.byUtilization.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.userInfo.name}</p>
                  <p className="text-sm text-gray-600">{user.operationalMetrics.activeLoads} active loads</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">
                    {user.operationalMetrics.truckUtilization}%
                  </p>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              </div>
            ))}
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
            <CardDescription>Load board and ELD integration trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Load Boards</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(marketIntelligence.loadBoardAdoption).map(([board, count]) => (
                  <Badge key={board} variant="outline">
                    {board}: {count}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">ELD Providers</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(marketIntelligence.eldProviderAdoption).map(([provider, count]) => (
                  <Badge key={provider} variant="outline">
                    {provider}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Distribution</CardTitle>
            <CardDescription>Fleet composition across all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(marketIntelligence.equipmentTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="font-medium">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-200 rounded-full h-2 w-16 relative">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / systemTotals.totalTrucks) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            User Access Management
          </CardTitle>
          <CardDescription>Control user access and monitor fleet operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fleet Owner</th>
                  <th className="text-left p-2">Fleet Size</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">Efficiency</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userMetrics.map((user) => (
                  <tr key={user.userId} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{user.userInfo.name}</p>
                        <p className="text-sm text-gray-600">{user.userInfo.email}</p>
                        <p className="text-xs text-gray-500">{user.userInfo.company}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{user.fleetMetrics.totalTrucks} trucks</p>
                        <p className="text-sm text-gray-600">{user.fleetMetrics.totalDrivers} drivers</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">${user.operationalMetrics.totalRevenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{user.operationalMetrics.totalLoads} loads</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">${user.operationalMetrics.avgRevenuePerMile}/mi</p>
                        <p className="text-sm text-gray-600">{user.operationalMetrics.totalMiles.toLocaleString()} miles</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={user.userInfo.isActive ? "default" : "destructive"} 
                             className={user.userInfo.isActive ? "bg-green-100 text-green-800" : ""}>
                        {user.userInfo.isActive ? "Active" : "Terminated"}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        {user.userInfo.isActive ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleTerminateUser(user)}
                            disabled={terminateUserMutation.isPending}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Terminate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reactivateUserMutation.mutate(user.userId)}
                            disabled={reactivateUserMutation.isPending}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Termination Confirmation Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Terminate User Access
            </DialogTitle>
            <DialogDescription>
              You are about to terminate access for <strong>{selectedUser?.userInfo.email}</strong>. 
              This action will immediately revoke their system access and prevent them from logging in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Termination</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for terminating this user's access..."
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Warning</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This will immediately terminate the user's access to the system. Their data will be preserved 
                    but they will not be able to log in or access any fleet management features.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerminateDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmTermination}
              disabled={terminateUserMutation.isPending}
            >
              {terminateUserMutation.isPending ? "Terminating..." : "Terminate Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Scalability Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Usage</p>
              <p className="text-2xl font-bold">{scalabilityStatus.currentUsers}/{scalabilityStatus.maxCapacity} users</p>
            </div>
            <div className="w-64">
              <div className="bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="bg-green-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${scalabilityStatus.utilizationPercentage}%` }}
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