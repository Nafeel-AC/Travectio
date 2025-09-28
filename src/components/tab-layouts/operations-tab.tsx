import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Users, 
  Truck,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Fuel,
  Settings
} from "lucide-react";
import { Link } from "wouter";
import { useTrucks, useLoads, useDrivers } from "@/hooks/useSupabase";

interface LoadCardProps {
  load: any;
  truck?: any;
}

function LoadCard({ load, truck }: LoadCardProps) {
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

  return (
    <Card className="border-slate-700 bg-slate-800 hover:border-slate-600 transition-colors">
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
          <Badge className={`${statusColors[load.status as keyof typeof statusColors] || 'bg-slate-600'} text-white`}>
            {statusLabels[load.status as keyof typeof statusLabels] || load.status}
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
            <span className="text-blue-300 font-medium">{load.miles?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Pay:</span>
            <span className="text-green-300 font-semibold">${load.pay?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Truck:</span>
            <span className="text-white">{truck?.name || 'Unassigned'}</span>
          </div>
          {load.profit !== undefined && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-600">
              <span className="text-slate-400">Profit:</span>
              <span className={`font-medium ${load.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${load.profit.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface DriverCardProps {
  driver: any;
  truck?: any;
}

function DriverCard({ driver, truck }: DriverCardProps) {
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
          <Badge variant={driver.isActive ? 'default' : 'secondary'} className={driver.isActive ? 'bg-green-600' : 'bg-slate-600'}>
            {driver.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Phone:</span>
            <span className="text-white">{driver.phoneNumber || 'Not provided'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Assigned Truck:</span>
            <span className="text-white">{truck?.name || 'None'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Compliance:</span>
            <span className="text-green-400">✓ Current</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TruckCardProps {
  truck: any;
  driver?: any;
}

function TruckCard({ truck, driver }: TruckCardProps) {
  return (
    <Card className="border-slate-700 bg-slate-800 hover:border-slate-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-white">{truck.name}</div>
              <div className="text-sm text-slate-400">{truck.equipmentType}</div>
            </div>
          </div>
          <Badge variant={truck.isActive ? 'default' : 'secondary'} className={truck.isActive ? 'bg-green-600' : 'bg-slate-600'}>
            {truck.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">VIN:</span>
            <span className="text-white font-mono text-xs">{truck.vin || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">License:</span>
            <span className="text-white">{truck.licensePlate || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Cost/Mile:</span>
            <span className="text-white font-medium">${(truck.costPerMile || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Driver:</span>
            <span className="text-white">{driver ? `${driver.firstName} ${driver.lastName}` : 'Unassigned'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Total Miles:</span>
            <span className="text-blue-300">{(truck.totalMiles || 0).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OperationsTab() {
  const { trucks, loading: trucksLoading } = useTrucks();
  const { loads, loading: loadsLoading } = useLoads();
  const { drivers, loading: driversLoading } = useDrivers();

  const isLoading = trucksLoading || loadsLoading || driversLoading;

  // Filter loads by status
  const pendingLoads = (loads as any[]).filter(l => l.status === 'pending');
  const inTransitLoads = (loads as any[]).filter(l => l.status === 'in_transit');
  const deliveredLoads = (loads as any[]).filter(l => l.status === 'delivered');

  // Get trucks with their assigned drivers
  const trucksWithDrivers = (trucks as any[]).map(truck => ({
    ...truck,
    driver: (drivers as any[]).find(d => d.truckId === truck.id)
  }));

  // Get drivers with their assigned trucks
  const driversWithTrucks = (drivers as any[]).map(driver => ({
    ...driver,
    truck: (trucks as any[]).find(t => t.id === driver.truckId)
  }));

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
          <h1 className="text-3xl font-bold tracking-tight text-white">Operations</h1>
          <p className="text-slate-400">Manage loads, drivers, and fleet operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/operations?action=add-load">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Load
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="loads" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-700">
          <TabsTrigger value="loads" className="text-slate-300 data-[state=active]:text-white">
            Loads
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-slate-300 data-[state=active]:text-white">
            Drivers
          </TabsTrigger>
          <TabsTrigger value="fleet" className="text-slate-300 data-[state=active]:text-white">
            Fleet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loads" className="space-y-6">
          {/* Load Status Buckets */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending ({pendingLoads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingLoads.length > 0 ? (
                  pendingLoads.slice(0, 3).map((load) => {
                    const truck = (trucks as any[]).find(t => t.id === load.truckId);
                    return <LoadCard key={load.id} load={load} truck={truck} />;
                  })
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p>No pending loads</p>
                  </div>
                )}
                {pendingLoads.length > 3 && (
                  <Link href="/load-management?status=pending">
                    <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300">
                      View All ({pendingLoads.length})
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Truck className="h-5 w-5 text-blue-500" />
                  In Transit ({inTransitLoads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inTransitLoads.length > 0 ? (
                  inTransitLoads.slice(0, 3).map((load) => {
                    const truck = (trucks as any[]).find(t => t.id === load.truckId);
                    return <LoadCard key={load.id} load={load} truck={truck} />;
                  })
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p>No loads in transit</p>
                  </div>
                )}
                {inTransitLoads.length > 3 && (
                  <Link href="/load-management?status=in_transit">
                    <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300">
                      View All ({inTransitLoads.length})
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Delivered ({deliveredLoads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deliveredLoads.length > 0 ? (
                  deliveredLoads.slice(0, 3).map((load) => {
                    const truck = (trucks as any[]).find(t => t.id === load.truckId);
                    return <LoadCard key={load.id} load={load} truck={truck} />;
                  })
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p>No delivered loads</p>
                  </div>
                )}
                {deliveredLoads.length > 3 && (
                  <Link href="/load-management?status=delivered">
                    <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300">
                      View All ({deliveredLoads.length})
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Loads */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>All Loads ({(loads as any[]).length})</span>
                <Link href="/load-management">
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    Manage All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(loads as any[]).slice(0, 6).map((load) => {
                  const truck = (trucks as any[]).find(t => t.id === load.truckId);
                  return <LoadCard key={load.id} load={load} truck={truck} />;
                })}
              </div>
              {(loads as any[]).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>No loads found</p>
                  <p className="text-sm">Create your first load to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(drivers as any[]).map((driver) => {
              const truck = (trucks as any[]).find(t => t.id === driver.truckId);
              return <DriverCard key={driver.id} driver={driver} truck={truck} />;
            })}
          </div>
          
          {(drivers as any[]).length === 0 && (
            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 mb-2">No drivers found</p>
                <p className="text-sm text-slate-500 mb-4">Add drivers to manage your fleet operations</p>
                <Link href="/drivers">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Driver
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fleet" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(trucks as any[]).map((truck) => {
              const driver = (drivers as any[]).find(d => d.truckId === truck.id);
              return <TruckCard key={truck.id} truck={truck} driver={driver} />;
            })}
          </div>
          
          {(trucks as any[]).length === 0 && (
            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="text-center py-8">
                <Truck className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 mb-2">No trucks in fleet</p>
                <p className="text-sm text-slate-500 mb-4">Add trucks to start managing your fleet</p>
                <Link href="/add-truck">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Truck
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
