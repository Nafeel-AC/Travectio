import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Truck,
  Search,
  Filter,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Route,
  Fuel,
  Gauge,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Building,
} from "lucide-react";
import { FounderService } from "@/lib/supabase-client";
import { useFounderAccess } from "@/hooks/useFounderAccess";

interface DriverWithTruck {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  cdlNumber: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  isActive: boolean;
  currentTruckId: string;
  preferredLoadTypes: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  users?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    company: string;
  };
  trucks?: {
    id: string;
    name: string;
    equipmentType: string;
    licensePlate: string;
    vin: string;
    fixedCosts: number;
    variableCosts: number;
    totalMiles: number;
    isActive: boolean;
    loadBoardIntegration: string;
    elogsIntegration: string;
    preferredLoadBoard: string;
    elogsProvider: string;
    costPerMile: number;
  };
}

export default function FounderDriverOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState<DriverWithTruck | null>(null);
  const { isFounder } = useFounderAccess();

  // Fetch all drivers with their truck assignments across all users (founder access)
  const { data: driversWithTrucks = [], isLoading: driversLoading, error: driversError } = useQuery({
    queryKey: ['founder-all-drivers-with-trucks'],
    queryFn: async () => {
      console.log('Fetching all drivers with trucks for founder...');
      const drivers = await FounderService.getAllDriversWithTrucks();
      console.log('Found drivers:', drivers);
      return drivers;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isFounder,
  });

  // Fetch all trucks across all users for summary stats (founder access)
  const { data: allTrucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['founder-all-trucks'],
    queryFn: async () => {
      const trucks = await FounderService.getAllTrucks();
      return trucks;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isFounder,
  });

  // Filter drivers based on search and status
  const filteredDrivers = driversWithTrucks.filter(driver => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.cdlNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.trucks?.name && driver.trucks.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (driver.users?.company && driver.users.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && driver.isActive) ||
      (statusFilter === "inactive" && !driver.isActive) ||
      (statusFilter === "assigned" && driver.trucks) ||
      (statusFilter === "unassigned" && !driver.trucks);
    
    return matchesSearch && matchesStatus;
  });

  const activeDriversCount = driversWithTrucks.filter(d => d.isActive).length;
  const inactiveDriversCount = driversWithTrucks.length - activeDriversCount;
  const assignedDriversCount = driversWithTrucks.filter(d => d.trucks).length;
  const unassignedDriversCount = driversWithTrucks.length - assignedDriversCount;

  if (driversLoading || trucksLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (driversError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Drivers</h2>
              <p className="text-gray-600 mb-4">
                There was an error loading driver data. Please check the console for details.
              </p>
              <p className="text-sm text-gray-500">
                Error: {driversError.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Crown className="h-8 w-8 text-purple-600" />
            Founder Driver Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Complete view of all drivers and their truck assignments across the platform
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 border-purple-600 text-purple-600">
          <Shield className="h-4 w-4 mr-1" />
          Founder Access
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driversWithTrucks.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeDriversCount} active, {inactiveDriversCount} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Drivers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedDriversCount}</div>
            <p className="text-xs text-muted-foreground">
              {unassignedDriversCount} drivers without trucks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTrucks.length}</div>
            <p className="text-xs text-muted-foreground">
              {allTrucks.filter(t => t.isActive).length} active trucks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTrucks.length > 0 ? Math.round((assignedDriversCount / allTrucks.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Driver-truck assignment efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Search & Filter</CardTitle>
          <CardDescription>
            Search drivers by name, CDL number, email, or truck name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search drivers by name, CDL, email, or truck..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="assigned">With Trucks</SelectItem>
                <SelectItem value="unassigned">Without Trucks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Details ({filteredDrivers.length} drivers)</CardTitle>
          <CardDescription>
            Complete driver information with truck assignments and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>CDL & License</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Assigned Truck</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-sm text-gray-500">
                            ID: {driver.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{driver.cdlNumber}</div>
                        <div className="text-sm text-gray-500">
                          {driver.licenseState} • Exp: {driver.licenseExpiry}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {driver.phoneNumber}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {driver.email}
                        </div>
                      </div>
                    </TableCell>
                                         <TableCell>
                       {driver.trucks ? (
                         <div className="space-y-1">
                           <div className="flex items-center gap-1 font-medium">
                             <Truck className="h-4 w-4" />
                             {driver.trucks.name}
                           </div>
                           <div className="text-sm text-gray-500">
                             {driver.trucks.equipmentType} • {driver.trucks.licensePlate}
                           </div>
                           <div className="text-sm text-gray-500">
                             {driver.trucks.totalMiles.toLocaleString()} miles
                           </div>
                           {driver.users && (
                             <div className="text-xs text-blue-600">
                               Owner: {driver.users.company || driver.users.email}
                             </div>
                           )}
                         </div>
                       ) : (
                         <div className="flex items-center gap-1 text-gray-500">
                           <UserX className="h-4 w-4" />
                           No truck assigned
                         </div>
                       )}
                     </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant={driver.isActive ? "default" : "secondary"}
                          className={driver.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {driver.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                                                 {driver.trucks && (
                           <Badge variant="outline" className="text-blue-600 border-blue-200">
                             <UserCheck className="h-3 w-3 mr-1" />
                             Assigned
                           </Badge>
                         )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedDriver(driver)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Driver Details: {driver.name}
                            </DialogTitle>
                            <DialogDescription>
                              Complete driver information and truck assignment details
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                                                         {/* Driver Information */}
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <Card>
                                 <CardHeader>
                                   <CardTitle className="text-lg">Personal Information</CardTitle>
                                 </CardHeader>
                                 <CardContent className="space-y-3">
                                   <div className="flex items-center gap-2">
                                     <Users className="h-4 w-4 text-gray-500" />
                                     <span className="font-medium">Name:</span>
                                     <span>{driver.name}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <FileText className="h-4 w-4 text-gray-500" />
                                     <span className="font-medium">CDL Number:</span>
                                     <span>{driver.cdlNumber}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <MapPin className="h-4 w-4 text-gray-500" />
                                     <span className="font-medium">License State:</span>
                                     <span>{driver.licenseState}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Calendar className="h-4 w-4 text-gray-500" />
                                     <span className="font-medium">License Expiry:</span>
                                     <span>{driver.licenseExpiry}</span>
                                   </div>
                                 </CardContent>
                               </Card>

                               <Card>
                                 <CardHeader>
                                   <CardTitle className="text-lg">Contact Information</CardTitle>
                                 </CardHeader>
                                 <CardContent className="space-y-3">
                                   <div className="flex items-center gap-2">
                                     <Phone className="h-4 w-4 text-gray-500" />
                                     <span className="font-medium">Phone:</span>
                                     <span>{driver.phoneNumber}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Mail className="h-4 w-4 text-gray-500" />
                                     <span className="font-medium">Email:</span>
                                     <span>{driver.email}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Activity className="h-4 w-4 text-gray-500" />
                                     <span className="font-medium">Status:</span>
                                     <Badge variant={driver.isActive ? "default" : "secondary"}>
                                       {driver.isActive ? "Active" : "Inactive"}
                                     </Badge>
                                   </div>
                                 </CardContent>
                               </Card>

                               {driver.users && (
                                 <Card>
                                   <CardHeader>
                                     <CardTitle className="text-lg">Account Owner</CardTitle>
                                   </CardHeader>
                                   <CardContent className="space-y-3">
                                     <div className="flex items-center gap-2">
                                       <Building className="h-4 w-4 text-gray-500" />
                                       <span className="font-medium">Company:</span>
                                       <span>{driver.users.company || 'N/A'}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <Mail className="h-4 w-4 text-gray-500" />
                                       <span className="font-medium">Owner Email:</span>
                                       <span>{driver.users.email}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <Users className="h-4 w-4 text-gray-500" />
                                       <span className="font-medium">Owner Name:</span>
                                       <span>{driver.users.firstName} {driver.users.lastName}</span>
                                     </div>
                                   </CardContent>
                                 </Card>
                               )}
                             </div>

                                                         {/* Truck Assignment */}
                             {driver.trucks ? (
                               <Card>
                                 <CardHeader>
                                   <CardTitle className="text-lg flex items-center gap-2">
                                     <Truck className="h-5 w-5" />
                                     Assigned Truck: {driver.trucks.name}
                                   </CardTitle>
                                   {driver.users && (
                                     <CardDescription>
                                       Owned by: {driver.users.company || driver.users.email}
                                     </CardDescription>
                                   )}
                                 </CardHeader>
                                 <CardContent>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <Truck className="h-4 w-4 text-gray-500" />
                                         <span className="font-medium">Equipment Type:</span>
                                       </div>
                                       <p className="text-sm text-gray-600">{driver.trucks.equipmentType}</p>
                                     </div>
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <FileText className="h-4 w-4 text-gray-500" />
                                         <span className="font-medium">License Plate:</span>
                                       </div>
                                       <p className="text-sm text-gray-600">{driver.trucks.licensePlate}</p>
                                     </div>
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <Route className="h-4 w-4 text-gray-500" />
                                         <span className="font-medium">Total Miles:</span>
                                       </div>
                                       <p className="text-sm text-gray-600">{driver.trucks.totalMiles.toLocaleString()}</p>
                                     </div>
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <DollarSign className="h-4 w-4 text-gray-500" />
                                         <span className="font-medium">Fixed Costs:</span>
                                       </div>
                                       <p className="text-sm text-gray-600">${driver.trucks.fixedCosts.toLocaleString()}</p>
                                     </div>
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <Fuel className="h-4 w-4 text-gray-500" />
                                         <span className="font-medium">Variable Costs:</span>
                                       </div>
                                       <p className="text-sm text-gray-600">${driver.trucks.variableCosts.toLocaleString()}</p>
                                     </div>
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <Gauge className="h-4 w-4 text-gray-500" />
                                         <span className="font-medium">Cost per Mile:</span>
                                       </div>
                                       <p className="text-sm text-gray-600">${driver.trucks.costPerMile?.toFixed(2) || 'N/A'}</p>
                                     </div>
                                   </div>
                                   
                                   <Separator className="my-4" />
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <Activity className="h-4 w-4 text-gray-500" />
                                         <span className="font-medium">Load Board Integration:</span>
                                       </div>
                                       <Badge variant="outline">{driver.trucks.loadBoardIntegration}</Badge>
                                     </div>
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <Clock className="h-4 w-4 text-gray-500" />
                                         <span className="font-medium">ELD Integration:</span>
                                       </div>
                                       <Badge variant="outline">{driver.trucks.elogsIntegration}</Badge>
                                     </div>
                                   </div>
                                 </CardContent>
                               </Card>
                            ) : (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2 text-gray-500">
                                    <UserX className="h-5 w-5" />
                                    No Truck Assigned
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-gray-600">
                                    This driver is currently not assigned to any truck.
                                  </p>
                                </CardContent>
                              </Card>
                            )}

                            {/* Additional Information */}
                            {driver.preferredLoadTypes && driver.preferredLoadTypes.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Preferred Load Types</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex flex-wrap gap-2">
                                    {driver.preferredLoadTypes.map((type, index) => (
                                      <Badge key={index} variant="outline">
                                        {type}
                                      </Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {driver.notes && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-gray-600">{driver.notes}</p>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
