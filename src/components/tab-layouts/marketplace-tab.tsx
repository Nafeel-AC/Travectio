import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Target, 
  Package, 
  Zap,
  ExternalLink,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Truck,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { useLoads, useTrucks, useDrivers } from "@/hooks/useSupabase";
import IntelligentLoadMatcher from "@/components/intelligent-load-matcher";
import LoadBoard from "@/components/load-board";
import { Link } from "wouter";

interface LoadBoardCardProps {
  load: any;
  onImport: () => void;
}

function LoadBoardCard({ load, onImport }: LoadBoardCardProps) {
  const getEquipmentIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'dry van': return '📦';
      case 'reefer': return '🧊';
      case 'flatbed': return '🏗️';
      default: return '📦';
    }
  };

  const getProfitabilityColor = (ratePerMile: number) => {
    if (ratePerMile >= 2.50) return 'text-green-400';
    if (ratePerMile >= 2.00) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="border-slate-700 bg-slate-800 hover:border-slate-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getEquipmentIcon(load.equipmentType)}</div>
            <div>
              <div className="font-medium text-white">{load.equipmentType}</div>
              <div className="text-sm text-slate-400">{load.commodity || 'General Freight'}</div>
            </div>
          </div>
          <Badge className="bg-blue-600 text-white">Available</Badge>
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
            <span className="text-slate-400">Rate:</span>
            <span className="text-green-300 font-semibold">${load.rate?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Rate/Mile:</span>
            <span className={`font-medium ${getProfitabilityColor(load.ratePerMile || 0)}`}>
              ${(load.ratePerMile || 0).toFixed(2)}/mi
            </span>
          </div>
          {(load.pickupDate || load.deliveryDate) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Schedule:</span>
              <span className="text-white">
                {load.pickupDate && new Date(load.pickupDate).toLocaleDateString()}
                {load.pickupDate && load.deliveryDate && ' - '}
                {load.deliveryDate && new Date(load.deliveryDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-600">
          <Button 
            onClick={onImport}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Import Load
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface IntegrationCardProps {
  name: string;
  description: string;
  status: 'connected' | 'available' | 'coming-soon';
  icon: any;
  color: string;
  onConnect?: () => void;
}

function IntegrationCard({ name, description, status, icon: Icon, color, onConnect }: IntegrationCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-600 text-white">Connected</Badge>;
      case 'available':
        return <Badge variant="secondary" className="bg-blue-600 text-white">Available</Badge>;
      case 'coming-soon':
        return <Badge variant="outline" className="border-yellow-600 text-yellow-400">Coming Soon</Badge>;
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800 hover:border-slate-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-white">{name}</div>
              <div className="text-sm text-slate-400">{description}</div>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {status === 'available' && onConnect && (
          <Button 
            onClick={onConnect}
            variant="outline"
            size="sm"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect
          </Button>
        )}

        {status === 'connected' && (
          <Button 
            variant="outline"
            size="sm"
            className="w-full border-green-600 text-green-400 hover:bg-green-900/20"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Manage
          </Button>
        )}

        {status === 'coming-soon' && (
          <Button 
            variant="outline"
            size="sm"
            className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
            disabled
          >
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function MarketplaceTab() {
  const { loads, loading: loadsLoading } = useLoads();
  const { trucks, loading: trucksLoading } = useTrucks();
  const { drivers, loading: driversLoading } = useDrivers();

  const isLoading = loadsLoading || trucksLoading || driversLoading;

  // Mock load board data
  const mockLoadBoardData = [
    {
      id: '1',
      originCity: 'Atlanta',
      originState: 'GA',
      destinationCity: 'Dallas',
      destinationState: 'TX',
      miles: 875,
      rate: 2450,
      ratePerMile: 2.80,
      equipmentType: 'Dry Van',
      commodity: 'Electronics',
      pickupDate: new Date(Date.now() + 86400000).toISOString(),
      deliveryDate: new Date(Date.now() + 172800000).toISOString()
    },
    {
      id: '2',
      originCity: 'Chicago',
      originState: 'IL',
      destinationCity: 'Los Angeles',
      destinationState: 'CA',
      miles: 2090,
      rate: 4800,
      ratePerMile: 2.30,
      equipmentType: 'Reefer',
      commodity: 'Food Products',
      pickupDate: new Date(Date.now() + 172800000).toISOString(),
      deliveryDate: new Date(Date.now() + 432000000).toISOString()
    },
    {
      id: '3',
      originCity: 'Houston',
      originState: 'TX',
      destinationCity: 'Denver',
      destinationState: 'CO',
      miles: 925,
      rate: 1850,
      ratePerMile: 2.00,
      equipmentType: 'Flatbed',
      commodity: 'Construction Materials',
      pickupDate: new Date(Date.now() + 259200000).toISOString(),
      deliveryDate: new Date(Date.now() + 345600000).toISOString()
    }
  ];

  const handleImportLoad = (loadId: string) => {
    // Mock import functionality
    console.log(`Importing load ${loadId}`);
    // In real app, this would call the load import service
  };

  const handleConnectIntegration = (integrationName: string) => {
    // Mock connection functionality
    console.log(`Connecting to ${integrationName}`);
    // In real app, this would initiate OAuth flow or API setup
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-white">Marketplace</h1>
          <p className="text-slate-400">Find profitable loads and connect with major load boards</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-orange-600 text-white">
            <Globe className="h-3 w-3 mr-1" />
            Beta
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="load-matcher" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-700">
          <TabsTrigger value="load-matcher" className="text-slate-300 data-[state=active]:text-white">
            Load Matcher
          </TabsTrigger>
          <TabsTrigger value="load-boards" className="text-slate-300 data-[state=active]:text-white">
            Load Boards
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-slate-300 data-[state=active]:text-white">
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="load-matcher" className="space-y-6">
          {/* AI-Powered Load Matcher */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5" />
                AI-Powered Load Matcher
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Get intelligent load recommendations based on your fleet's cost per mile and driver availability
              </p>
            </CardHeader>
            <CardContent>
              <IntelligentLoadMatcher />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Recommendations</p>
                    <p className="text-2xl font-bold text-blue-400">12</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Profit/Mile</p>
                    <p className="text-2xl font-bold text-green-400">$0.85</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-400">87%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="load-boards" className="space-y-6">
          {/* Available Loads */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Package className="h-5 w-5" />
                Available Loads
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Browse and import loads from integrated load boards
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockLoadBoardData.map((load) => (
                  <LoadBoardCard
                    key={load.id}
                    load={load}
                    onImport={() => handleImportLoad(load.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Load Board Status */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5" />
                Load Board Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-green-200 font-medium">Mock 123Loadboard</div>
                      <div className="text-green-300 text-sm">Connected • {mockLoadBoardData.length} loads available</div>
                    </div>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="text-slate-200 font-medium">DAT Load Board</div>
                      <div className="text-slate-300 text-sm">Integration in progress</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-600">Pending</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-500" />
                    <div>
                      <div className="text-slate-200 font-medium">Truckstop.com</div>
                      <div className="text-slate-300 text-sm">Not connected</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">Available</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Load Board Integrations */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ExternalLink className="h-5 w-5" />
                Load Board Integrations
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Connect with major load boards for seamless load importing
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <IntegrationCard
                  name="DAT Load Board"
                  description="Access to DAT's comprehensive load database"
                  status="available"
                  icon={Globe}
                  color="bg-blue-600"
                  onConnect={() => handleConnectIntegration('DAT')}
                />
                <IntegrationCard
                  name="Truckstop.com"
                  description="Connect with Truckstop's load network"
                  status="available"
                  icon={Truck}
                  color="bg-green-600"
                  onConnect={() => handleConnectIntegration('Truckstop')}
                />
                <IntegrationCard
                  name="Uber Freight"
                  description="Access Uber's digital freight marketplace"
                  status="coming-soon"
                  icon={Zap}
                  color="bg-purple-600"
                />
                <IntegrationCard
                  name="Convoy"
                  description="Connect with Convoy's trucking network"
                  status="coming-soon"
                  icon={Package}
                  color="bg-orange-600"
                />
                <IntegrationCard
                  name="Loadsmart"
                  description="AI-powered freight marketplace"
                  status="coming-soon"
                  icon={Target}
                  color="bg-indigo-600"
                />
                <IntegrationCard
                  name="Transfix"
                  description="Digital freight platform"
                  status="coming-soon"
                  icon={TrendingUp}
                  color="bg-pink-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Integration Benefits */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="h-5 w-5" />
                Integration Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-300">One-click load importing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-300">Real-time load availability</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-300">Automated profitability analysis</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-300">HOS compliance checking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-300">Route optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-300">Centralized load management</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
