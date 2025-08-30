import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoApi } from "@/hooks/useDemoApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, 
  Zap, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Key
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface IntegrationStatus {
  // Legacy compatibility
  dat: {
    connected: boolean;
    error?: string;
  };
  eld: {
    connected: boolean;
    provider: string;
    error?: string;
  };
  // Comprehensive multi-provider status
  loadBoards: Record<string, {
    connected: boolean;
    error?: string;
  }>;
  eldProviders: Record<string, {
    connected: boolean;
    error?: string;
  }>;
  summary: {
    totalLoadBoards: number;
    connectedLoadBoards: number;
    totalELDProviders: number;
    connectedELDProviders: number;
    lastChecked: string;
  };
}

interface DATLoad {
  loadId: string;
  origin: {
    city: string;
    state: string;
  };
  destination: {
    city: string;
    state: string;
  };
  equipmentType: string;
  rate: number;
  miles: number;
  pickupDate: string;
  broker: {
    name: string;
    phone?: string;
  };
}

interface HOSStatus {
  driverId: string;
  driverName: string;
  currentDutyStatus: string;
  availableDriveTime: number;
  availableOnDutyTime: number;
  violations?: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
}

export default function IntegrationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDemoQuery } = useDemoApi();
  
  // State for DAT load search
  const [datSearchParams, setDatSearchParams] = useState({
    originCity: "",
    originState: "",
    originRadius: "50",
    equipmentType: "Van",
    minRate: "",
    limit: "25"
  });
  
  // State for ELD provider selection
  const [eldProvider, setEldProvider] = useState("samsara");
  
  // Query integration status
  const { data: integrationStatus, isLoading: statusLoading } = useDemoQuery(
    ['/api/integrations/status'],
    '/api/integrations/status',
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  
  // DAT load search mutation
  const datLoadSearch = useMutation({
    mutationFn: async (params: typeof datSearchParams) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      return await apiRequest(`/api/integrations/dat/loads/search?${queryParams.toString()}`);
    },
    onSuccess: () => {
      toast({
        title: "Load Search Complete",
        description: "Found available loads from DAT load board",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "DAT Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Test connection mutations
  const testDATConnection = useMutation({
    mutationFn: () => apiRequest('/api/integrations/dat/test-connection'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/status'] });
      toast({
        title: "DAT Connection Successful",
        description: "Successfully connected to DAT load board API",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "DAT Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const testELDConnection = useMutation({
    mutationFn: () => apiRequest('/api/integrations/eld/test-connection'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/status'] });
      toast({
        title: "ELD Connection Successful",
        description: "Successfully connected to ELD provider API",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ELD Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDATSearch = () => {
    datLoadSearch.mutate(datSearchParams);
  };

  const getStatusIcon = (connected: boolean, loading: boolean = false) => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
    return connected ? 
      <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (connected: boolean, loading: boolean = false) => {
    if (loading) return <Badge variant="secondary">Testing...</Badge>;
    return connected ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge> : 
      <Badge variant="destructive">Disconnected</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integration Management</h1>
          <p className="text-muted-foreground">
            Configure and manage your DAT load board and ELD/HOS integrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/api-credentials-guide'}>
            <Key className="h-4 w-4 mr-2" />
            API Setup Guide
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Settings className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Integration Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integration Status
          </CardTitle>
          <CardDescription>
            Current connection status for your external integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Integration Summary */}
          {integrationStatus?.summary && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Integration Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Load Boards:</span>
                  <p className="text-blue-800">{integrationStatus.summary.connectedLoadBoards} of {integrationStatus.summary.totalLoadBoards} connected</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">ELD Providers:</span>
                  <p className="text-blue-800">{integrationStatus.summary.connectedELDProviders} of {integrationStatus.summary.totalELDProviders} connected</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Last Checked:</span>
                  <p className="text-blue-800">{new Date(integrationStatus.summary.lastChecked).toLocaleTimeString()}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Status:</span>
                  <p className="text-blue-800">
                    {integrationStatus.summary.connectedLoadBoards > 0 || integrationStatus.summary.connectedELDProviders > 0 
                      ? 'Active' : 'Setup Required'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Load Board Providers */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Load Board Providers
            </h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {integrationStatus?.loadBoards && Object.entries(integrationStatus.loadBoards).map(([provider, status]) => (
                <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium">{provider}</h5>
                    <p className="text-xs text-muted-foreground">
                      {provider === 'DAT' && 'Market leader'}
                      {provider === 'Truckstop' && 'Nationwide'}
                      {provider === '123Loadboard' && 'Cost effective'}
                      {provider === 'SuperDispatch' && 'Auto hauling'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusIcon(status.connected, statusLoading)}
                    {status.error && (
                      <div className="text-xs text-red-600 max-w-20 truncate" title={status.error}>
                        {status.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ELD Providers */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              ELD/HOS Providers
            </h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {integrationStatus?.eldProviders && Object.entries(integrationStatus.eldProviders).map(([provider, status]) => (
                <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium">{provider}</h5>
                    <p className="text-xs text-muted-foreground">
                      {provider === 'Samsara' && 'Fleet management'}
                      {provider === 'KeepTruckin' && 'Driver focused'}
                      {provider === 'Garmin' && 'GPS + ELD'}
                      {provider === 'BigRoad' && 'Comprehensive'}
                      {provider === 'FleetUp' && 'Real-time tracking'}
                      {provider === 'VDO' && 'European standard'}
                      {provider === 'Omnitracs' && 'Enterprise grade'}
                      {provider === 'Geotab' && 'Telematics leader'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusIcon(status.connected, statusLoading)}
                    {status.error && (
                      <div className="text-xs text-red-600 max-w-20 truncate" title={status.error}>
                        {status.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Setup Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">API Credentials Required</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              To connect your external systems, you'll need API credentials from each provider. 
              These are obtained directly from the service providers and are required for secure data access.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Load Board Providers:</p>
                <div className="space-y-1 text-yellow-700">
                  <p>• <strong>DAT:</strong> developer.dat.com → API Access Request</p>
                  <p>• <strong>Truckstop:</strong> developer.truckstop.com → Developer Portal</p>
                  <p>• <strong>123Loadboard:</strong> Contact support for API access</p>
                  <p>• <strong>SuperDispatch:</strong> app.superdispatch.com → Integrations</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-yellow-800 mb-1">ELD Providers:</p>
                <div className="space-y-1 text-yellow-700">
                  <p>• <strong>Samsara:</strong> Account Manager → API Keys</p>
                  <p>• <strong>Motive:</strong> Support → Developer Access</p>
                  <p>• <strong>Garmin:</strong> Fleet Portal → API Settings</p>
                  <p>• <strong>Geotab:</strong> MyGeotab → Add-Ins → API</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* DAT Load Board Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              DAT Load Board
            </CardTitle>
            <CardDescription>
              Search for loads and manage your DAT integration settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Test */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Connection Status</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => testDATConnection.mutate()}
                disabled={testDATConnection.isPending}
              >
                {testDATConnection.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>

            <Separator />

            {/* Load Search Form */}
            <div className="space-y-3">
              <h4 className="font-medium">Search Available Loads</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="originCity">Origin City</Label>
                  <Input
                    id="originCity"
                    placeholder="Chicago"
                    value={datSearchParams.originCity}
                    onChange={(e) => setDatSearchParams(prev => ({
                      ...prev,
                      originCity: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="originState">Origin State</Label>
                  <Input
                    id="originState"
                    placeholder="IL"
                    value={datSearchParams.originState}
                    onChange={(e) => setDatSearchParams(prev => ({
                      ...prev,
                      originState: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="equipmentType">Equipment Type</Label>
                  <Select
                    value={datSearchParams.equipmentType}
                    onValueChange={(value) => setDatSearchParams(prev => ({
                      ...prev,
                      equipmentType: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Van">Dry Van</SelectItem>
                      <SelectItem value="Reefer">Refrigerated</SelectItem>
                      <SelectItem value="Flatbed">Flatbed</SelectItem>
                      <SelectItem value="StepDeck">Step Deck</SelectItem>
                      <SelectItem value="Lowboy">Lowboy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="minRate">Minimum Rate ($)</Label>
                  <Input
                    id="minRate"
                    type="number"
                    placeholder="1500"
                    value={datSearchParams.minRate}
                    onChange={(e) => setDatSearchParams(prev => ({
                      ...prev,
                      minRate: e.target.value
                    }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleDATSearch}
                disabled={datLoadSearch.isPending || !datSearchParams.originCity || !datSearchParams.originState}
                className="w-full"
              >
                {datLoadSearch.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search Loads
              </Button>
            </div>

            {/* Search Results */}
            {datLoadSearch.data && (
              <div className="space-y-2">
                <h4 className="font-medium">Search Results ({datLoadSearch.data.count})</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {datLoadSearch.data.loads.map((load: DATLoad) => (
                    <div key={load.loadId} className="p-3 border rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">
                            {load.origin.city}, {load.origin.state} → {load.destination.city}, {load.destination.state}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">${load.rate.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{load.equipmentType} • {load.miles} miles</span>
                        <span>{load.broker.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ELD/HOS Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              ELD/HOS Integration
            </CardTitle>
            <CardDescription>
              Configure your electronic logging device and HOS compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Test */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Connection Status</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => testELDConnection.mutate()}
                disabled={testELDConnection.isPending}
              >
                {testELDConnection.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>

            <Separator />

            {/* Provider Selection */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="eldProvider">ELD Provider</Label>
                <Select value={eldProvider} onValueChange={setEldProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="samsara">Samsara</SelectItem>
                    <SelectItem value="omnitracs">Omnitracs</SelectItem>
                    <SelectItem value="geotab">Geotab</SelectItem>
                    <SelectItem value="fleetcomplete">Fleet Complete</SelectItem>
                    <SelectItem value="custom">Custom Provider</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select your ELD provider for HOS data integration
                </p>
              </div>

              {/* Configuration Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Setup Instructions</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>1. Contact your ELD provider to obtain API credentials</p>
                  <p>2. Add the credentials to your environment variables</p>
                  <p>3. Test the connection using the button above</p>
                  <p>4. HOS data will sync automatically once connected</p>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                <h4 className="font-medium">Available Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Real-time HOS status monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Automated duty status logging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Violation alerts and reporting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Vehicle location tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Compliance audit reports</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Setup Help</CardTitle>
          <CardDescription>
            Need help configuring your integrations? Follow these guides.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* DAT Setup */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                DAT Load Board Setup
              </h3>
              <div className="text-sm space-y-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="font-medium text-blue-800 mb-1">Getting DAT API Credentials:</p>
                  <div className="text-blue-700 space-y-1">
                    <p>1. Go to <strong>developer.dat.com</strong> and create a developer account</p>
                    <p>2. Submit an API access request (requires business verification)</p>
                    <p>3. Once approved, you'll receive your API credentials via email</p>
                    <p>4. Your credentials will include: API Key, App ID, and User ID</p>
                  </div>
                </div>
                <p><strong>Step 1:</strong> Obtain your DAT API credentials (see above)</p>
                <p><strong>Step 2:</strong> Add credentials to Replit Secrets (🔑 icon in sidebar):</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs font-mono bg-gray-100 p-2 rounded text-gray-800">
                  <li>Key: DAT_API_KEY → Value: your_actual_api_key</li>
                  <li>Key: DAT_APP_ID → Value: your_actual_app_id</li>
                  <li>Key: DAT_USER_ID → Value: your_actual_user_id</li>
                </ul>
                <p><strong>Step 3:</strong> Test the connection using the button above</p>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-700">
                  <p className="text-xs"><strong>Note:</strong> DAT API access requires a business account and may take 2-3 business days for approval.</p>
                </div>
              </div>
            </div>

            {/* ELD Setup */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                ELD/HOS Integration Setup
              </h3>
              <div className="text-sm space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="font-medium text-green-800 mb-1">Getting ELD API Credentials:</p>
                  <div className="text-green-700 space-y-1 text-xs">
                    <p><strong>Samsara:</strong> Contact your account manager or support → API access</p>
                    <p><strong>Motive (KeepTruckin):</strong> Fleet Portal → Integrations → API Keys</p>
                    <p><strong>Garmin:</strong> Fleet Management Portal → Settings → API</p>
                    <p><strong>Geotab:</strong> MyGeotab → Administration → System → API</p>
                    <p><strong>Others:</strong> Contact your ELD provider's support team</p>
                  </div>
                </div>
                <p><strong>Step 1:</strong> Contact your ELD provider for API access (see above)</p>
                <p><strong>Step 2:</strong> Add credentials to Replit Secrets (🔑 icon in sidebar):</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs font-mono bg-gray-100 p-2 rounded text-gray-800">
                  <li>Key: ELD_PROVIDER → Value: samsara (or your provider)</li>
                  <li>Key: ELD_API_KEY → Value: your_actual_api_key</li>
                  <li>Key: ELD_API_SECRET → Value: your_secret (if required)</li>
                </ul>
                <p><strong>Step 3:</strong> Test the connection and start receiving HOS data</p>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-700">
                  <p className="text-xs"><strong>Important:</strong> ELD API access often requires admin permissions on your fleet account.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}