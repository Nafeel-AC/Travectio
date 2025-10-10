import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, MapPin, Calendar, DollarSign, Truck, Clock, Route, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useOrgLoads, useUpdateOrgLoad, useRoleAccess } from "@/hooks/useOrgData";
import { useOrgRole } from "@/lib/org-role-context";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  "pending": "bg-yellow-600",
  "in_transit": "bg-blue-600", 
  "delivered": "bg-green-600",
  "cancelled": "bg-red-600"
};

const statusLabels = {
  "pending": "Pending",
  "in_transit": "In Transit",
  "delivered": "Delivered",
  "cancelled": "Cancelled"
};

export default function MyLoads() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { role } = useOrgRole();
  const roleAccess = useRoleAccess();
  const { toast } = useToast();
  
  // Use organization-aware hooks - this will automatically filter for driver's assigned loads
  const { data: loads = [], isLoading: loadsLoading } = useOrgLoads();
  const updateLoadMutation = useUpdateOrgLoad();

  // Redirect if not a driver
  if (role !== 'driver') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-red-300 mb-2">Access Restricted</h2>
            <p className="text-red-400">
              This page is only available for drivers. Please use the Load Management page instead.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = (loadId: string, newStatus: string) => {
    // Drivers can only update certain statuses
    const allowedStatuses = ['in_transit', 'delivered'];
    if (!allowedStatuses.includes(newStatus)) {
      toast({
        title: "Status Update Restricted",
        description: "You can only mark loads as 'In Transit' or 'Delivered'.",
        variant: "destructive",
      });
      return;
    }

    updateLoadMutation.mutate({ 
      loadId, 
      updates: { 
        status: newStatus,
        actualDeliveryDate: newStatus === 'delivered' ? new Date().toISOString() : undefined
      }
    });
  };

  // Filter loads based on selected status
  const filteredLoads = loads.filter(load => {
    if (selectedStatus === "all") return true;
    return load.status === selectedStatus;
  });

  // Calculate stats
  const stats = {
    total: loads.length,
    pending: loads.filter(l => l.status === "pending").length,
    inTransit: loads.filter(l => l.status === "in_transit").length,
    delivered: loads.filter(l => l.status === "delivered").length,
    totalPay: loads.reduce((sum, l) => sum + (l.pay || 0), 0),
    totalMiles: loads.reduce((sum, l) => sum + (l.miles || 0), 0)
  };

  if (loadsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading your loads...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Loads</h1>
            <p className="text-slate-400">View and manage your assigned loads</p>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-slate-300 text-sm">Filter by status:</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">All Loads</SelectItem>
                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                <SelectItem value="in_transit" className="text-white">In Transit</SelectItem>
                <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-400" />
                <span className="text-slate-300 text-sm">Total Loads</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-slate-300 text-sm">In Transit</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.inTransit}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-slate-300 text-sm">Total Pay</span>
              </div>
              <div className="text-2xl font-bold text-white">${stats.totalPay.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-4 w-4 text-purple-400" />
                <span className="text-slate-300 text-sm">Total Miles</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalMiles.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Loads List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Your Assigned Loads ({filteredLoads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLoads.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedStatus === "all" ? "No loads assigned" : `No ${selectedStatus} loads`}
                </h3>
                <p className="text-slate-400">
                  {selectedStatus === "all" 
                    ? "You don't have any loads assigned yet. Contact your dispatcher for load assignments."
                    : `You don't have any ${selectedStatus} loads at the moment.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLoads.map((load) => (
                  <div
                    key={load.id}
                    className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Load Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={`${statusColors[load.status as keyof typeof statusColors]} text-white`}>
                            {statusLabels[load.status as keyof typeof statusLabels]}
                          </Badge>
                          <span className="text-slate-300 text-sm">
                            Load #{load.id?.slice(-8) || 'Unknown'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-200">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>
                            {load.originCity}, {load.originState} → {load.destinationCity}, {load.destinationState}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Pay:</span>
                            <div className="text-green-400 font-semibold">${load.pay?.toLocaleString() || '0'}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Miles:</span>
                            <div className="text-white">{load.miles?.toLocaleString() || '0'}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Pickup:</span>
                            <div className="text-white">
                              {load.pickupDate ? format(new Date(load.pickupDate), 'MMM dd, yyyy') : 'TBD'}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Delivery:</span>
                            <div className="text-white">
                              {load.deliveryDate ? format(new Date(load.deliveryDate), 'MMM dd, yyyy') : 'TBD'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Update */}
                      <div className="flex items-center gap-3">
                        <Select
                          value={load.status}
                          onValueChange={(newStatus) => handleStatusUpdate(load.id, newStatus)}
                          disabled={updateLoadMutation.isPending}
                        >
                          <SelectTrigger className={`w-32 ${statusColors[load.status as keyof typeof statusColors]} text-white border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="pending" className="text-white hover:bg-yellow-600/20" disabled>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                Pending
                              </div>
                            </SelectItem>
                            <SelectItem value="in_transit" className="text-white hover:bg-blue-600/20">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                In Transit
                              </div>
                            </SelectItem>
                            <SelectItem value="delivered" className="text-white hover:bg-green-600/20">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Delivered
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
