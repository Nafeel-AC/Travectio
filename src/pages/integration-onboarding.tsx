import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useDemoApi } from '@/hooks/useDemoApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Truck, Activity, Loader2, Package, Globe, Settings, AlertTriangle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLoadBoard } from '@/hooks/useSupabase';
import { IntegrationService } from '@/lib/supabase-client';

// Schema for integration setup form
const IntegrationSetupSchema = z.object({
  truckId: z.string().min(1, 'Please select a truck'),
  eldEnabled: z.boolean().default(false),
  eldProvider: z.string().optional(),
  eldApiKey: z.string().optional(),
  loadBoardEnabled: z.boolean().default(false),
  loadBoardProvider: z.string().optional(),
  loadBoardApiKey: z.string().optional(),
  loadBoardUsername: z.string().optional(),
  loadBoardPassword: z.string().optional(),
});

type IntegrationSetupData = z.infer<typeof IntegrationSetupSchema>;

interface IntegrationProvider {
  name: string;
  displayName: string;
  features: string[];
}

interface IntegrationProviders {
  eld: IntegrationProvider[];
  loadBoard: IntegrationProvider[];
}

interface SetupResult {
  success: boolean;
  eldConnected: boolean;
  loadBoardConnected: boolean;
  eldProvider?: string;
  loadBoardProvider?: string;
  capabilities: {
    eld: string[];
    loadBoard: string[];
  };
  testData: {
    eld?: any;
    loadBoard?: any;
  };
  errors: string[];
  nextSteps: string[];
}

export default function IntegrationOnboarding() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const { useDemoQuery } = useDemoApi();
  // const { setupIntegration } = useLoadBoard(); // Removed - property doesn't exist

  // Get available trucks
  const { data: trucks = [] } = useDemoQuery(
    ['/api/trucks'],
    '/api/trucks',
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Get available integration providers
  const [providers, setProviders] = useState<IntegrationProviders | null>(null);
  
  // Fetch providers on component mount
  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providersData = await IntegrationService.getIntegrationProviders();
        // Transform the data to match our interface
        const transformedProviders: IntegrationProviders = {
          eld: providersData.filter(p => p.type === 'eld').map(p => ({
            name: p.name,
            displayName: p.displayName || p.name,
            features: p.features || []
          })),
          loadBoard: providersData.filter(p => p.type === 'loadBoard').map(p => ({
            name: p.name,
            displayName: p.displayName || p.name,
            features: p.features || []
          }))
        };
        setProviders(transformedProviders);
      } catch (error) {
        console.error('Failed to fetch integration providers:', error);
        // Fallback to default providers
        setProviders({
          eld: [
            { name: 'samsara', displayName: 'Samsara', features: ['HOS', 'GPS', 'Maintenance'] },
            { name: 'geotab', displayName: 'Geotab', features: ['HOS', 'GPS', 'Maintenance'] }
          ],
          loadBoard: [
            { name: 'dat', displayName: 'DAT Load Board', features: ['Load Matching', 'Rate Analysis'] },
            { name: 'truckstop', displayName: 'Truckstop', features: ['Load Matching', 'Rate Analysis'] }
          ]
        });
      }
    };
    
    fetchProviders();
  }, []);

  // Setup integrations mutation
  const setupMutation = useMutation({
    mutationFn: async (data: IntegrationSetupData): Promise<SetupResult> => {
      const payload = {
        truckId: data.truckId,
        integrations: {
          ...(data.eldEnabled && {
            eld: {
              provider: data.eldProvider!,
              apiKey: data.eldApiKey!,
            },
          }),
          ...(data.loadBoardEnabled && {
            loadBoard: {
              provider: data.loadBoardProvider!,
              apiKey: data.loadBoardApiKey!,
              username: data.loadBoardUsername,
              password: data.loadBoardPassword,
            },
          }),
        },
      };
      // Test each integration connection
      const results = [];
      const errors = [];
      
      if (data.eldEnabled && data.eldProvider && data.eldApiKey) {
        try {
          const eldResult = await IntegrationService.testIntegration(
            data.eldProvider,
            data.eldApiKey,
            'eld'
          );
          results.push({ integrationType: 'eld', ...eldResult });
        } catch (error) {
          errors.push(`ELD connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      if (data.loadBoardEnabled && data.loadBoardProvider && data.loadBoardApiKey) {
        try {
          const loadBoardResult = await IntegrationService.testIntegration(
            data.loadBoardProvider,
            data.loadBoardApiKey,
            'loadBoard'
          );
          results.push({ integrationType: 'loadBoard', ...loadBoardResult });
        } catch (error) {
          errors.push(`Load Board connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Save integration configuration
      if (results.length > 0) {
        await IntegrationService.setupIntegrations(data.truckId, {
          eld: data.eldEnabled ? { provider: data.eldProvider, enabled: true } : { enabled: false },
          loadBoard: data.loadBoardEnabled ? { provider: data.loadBoardProvider, enabled: true } : { enabled: false }
        });
      }
      
      // Return setup result
      return {
        success: errors.length === 0,
        eldConnected: results.some(r => r.integrationType === 'eld' && r.connected),
        loadBoardConnected: results.some(r => r.integrationType === 'loadBoard' && r.connected),
        eldProvider: data.eldEnabled ? data.eldProvider : undefined,
        loadBoardProvider: data.loadBoardEnabled ? data.loadBoardProvider : undefined,
        capabilities: {
          eld: results.filter(r => r.integrationType === 'eld').map(r => r.provider),
          loadBoard: results.filter(r => r.integrationType === 'loadBoard').map(r => r.provider)
        },
        testData: {
          eld: results.find(r => r.integrationType === 'eld')?.testData,
          loadBoard: results.find(r => r.integrationType === 'loadBoard')?.testData
        },
        errors,
        nextSteps: errors.length === 0 ? 
          ['Integrations configured successfully', 'Data sync will begin automatically'] :
          ['Please check your API credentials', 'Verify provider settings']
      };
    },
    onSuccess: (result: SetupResult) => {
      setSetupResult(result);
      setCurrentStep(3);
      
      if (result.success) {
        toast({
          title: 'Integration Setup Complete',
          description: `Successfully connected ${[
            result.eldConnected ? result.eldProvider : null,
            result.loadBoardConnected ? result.loadBoardProvider : null
          ].filter(Boolean).join(' and ')}`,
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/trucks'] });
      } else {
        toast({
          title: 'Integration Setup Issues',
          description: 'Some integrations failed to connect. Check the details below.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup integrations',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<IntegrationSetupData>({
    resolver: zodResolver(IntegrationSetupSchema),
    defaultValues: {
      eldEnabled: false,
      loadBoardEnabled: false,
    },
  });

  const watchedValues = form.watch();

  const onSubmit = (data: IntegrationSetupData) => {
    // Validation
    if (data.eldEnabled && (!data.eldProvider || !data.eldApiKey)) {
      toast({
        title: 'Missing ELD Information',
        description: 'Please select an ELD provider and enter your API key',
        variant: 'destructive',
      });
      return;
    }

    if (data.loadBoardEnabled && (!data.loadBoardProvider || !data.loadBoardApiKey)) {
      toast({
        title: 'Missing Load Board Information',
        description: 'Please select a load board provider and enter your API key',
        variant: 'destructive',
      });
      return;
    }

    if (!data.eldEnabled && !data.loadBoardEnabled) {
      toast({
        title: 'No Integrations Selected',
        description: 'Please enable at least one integration to continue',
        variant: 'destructive',
      });
      return;
    }

    setupMutation.mutate(data);
  };

  const handleSkipIntegrations = () => {
    setCurrentStep(3);
    setSetupResult({
      success: true,
      eldConnected: false,
      loadBoardConnected: false,
      capabilities: { eld: [], loadBoard: [] },
      testData: {},
      errors: [],
      nextSteps: ['You can set up integrations later from the truck management page'],
    });
  };

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to Travectio Fleet Management
            </h1>
            <p className="text-xl text-slate-300">
              Let's connect your existing systems for automatic data sync
            </p>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Integration Benefits
              </CardTitle>
              <CardDescription className="text-slate-300">
                Connecting your ELD and load board systems will automatically sync your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">ELD Integration</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      Automatic HOS compliance tracking
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      Real-time driver status monitoring
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      Vehicle location tracking
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Load Board Integration</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      Automatic load matching
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      Market rate analysis
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      Profit optimization suggestions
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Set Up Integrations
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkipIntegrations}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Skip for Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Connect Your Systems
            </h1>
            <p className="text-lg text-slate-300">
              Enter your API credentials to automatically sync your data
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Integration Setup</CardTitle>
                <CardDescription className="text-slate-300">
                  Configure your ELD and load board connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Truck Selection */}
                <div className="space-y-2">
                  <Label htmlFor="truckId" className="text-white">Select Truck</Label>
                  <Select
                    value={watchedValues.truckId}
                    onValueChange={(value) => form.setValue('truckId', value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Choose a truck for integration" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {(trucks as any[]).map((truck: any) => (
                        <SelectItem key={truck.id} value={truck.id} className="text-white">
                          {truck.name} - {truck.equipmentType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="eld" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                    <TabsTrigger value="eld" className="text-slate-300 data-[state=active]:text-white">
                      ELD System
                    </TabsTrigger>
                    <TabsTrigger value="loadboard" className="text-slate-300 data-[state=active]:text-white">
                      Load Board
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="eld" className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="eldEnabled"
                        checked={watchedValues.eldEnabled}
                        onCheckedChange={(checked) => form.setValue('eldEnabled', !!checked)}
                        className="border-slate-600"
                      />
                      <Label htmlFor="eldEnabled" className="text-white">
                        Enable ELD Integration
                      </Label>
                    </div>

                    {watchedValues.eldEnabled && (
                      <div className="space-y-4 ml-6">
                        <div className="space-y-2">
                          <Label className="text-white">ELD Provider</Label>
                          <Select
                            value={watchedValues.eldProvider}
                            onValueChange={(value) => form.setValue('eldProvider', value)}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select your ELD provider" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              {providers?.eld?.map((provider: IntegrationProvider) => (
                                <SelectItem key={provider.name} value={provider.name} className="text-white">
                                  {provider.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">API Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter your ELD API key"
                            value={watchedValues.eldApiKey || ''}
                            onChange={(e) => form.setValue('eldApiKey', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="loadboard" className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="loadBoardEnabled"
                        checked={watchedValues.loadBoardEnabled}
                        onCheckedChange={(checked) => form.setValue('loadBoardEnabled', !!checked)}
                        className="border-slate-600"
                      />
                      <Label htmlFor="loadBoardEnabled" className="text-white">
                        Enable Load Board Integration
                      </Label>
                    </div>

                    {watchedValues.loadBoardEnabled && (
                      <div className="space-y-4 ml-6">
                        <div className="space-y-2">
                          <Label className="text-white">Load Board Provider</Label>
                          <Select
                            value={watchedValues.loadBoardProvider}
                            onValueChange={(value) => form.setValue('loadBoardProvider', value)}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select your load board" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              {providers?.loadBoard?.map((provider: IntegrationProvider) => (
                                <SelectItem key={provider.name} value={provider.name} className="text-white">
                                  {provider.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">API Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter your load board API key"
                            value={watchedValues.loadBoardApiKey || ''}
                            onChange={(e) => form.setValue('loadBoardApiKey', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          />
                        </div>

                        {watchedValues.loadBoardProvider && ['truckstop'].includes(watchedValues.loadBoardProvider) && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-white">Username (Optional)</Label>
                              <Input
                                placeholder="Enter username if required"
                                value={watchedValues.loadBoardUsername || ''}
                                onChange={(e) => form.setValue('loadBoardUsername', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Password (Optional)</Label>
                              <Input
                                type="password"
                                placeholder="Enter password if required"
                                value={watchedValues.loadBoardPassword || ''}
                                onChange={(e) => form.setValue('loadBoardPassword', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={setupMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {setupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing Connections...
                      </>
                    ) : (
                      'Connect & Test'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipIntegrations}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Skip for Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Results
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Integration Setup {setupResult?.success ? 'Complete' : 'Summary'}
          </h1>
          <p className="text-lg text-slate-300">
            {setupResult?.success ? 'Your systems are now connected' : 'Review the setup results below'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Connection Status */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700">
                  <div>
                    <h3 className="font-semibold text-white">ELD System</h3>
                    <p className="text-sm text-slate-300">
                      {setupResult?.eldProvider || 'Not configured'}
                    </p>
                  </div>
                  <Badge
                    variant={setupResult?.eldConnected ? 'default' : 'secondary'}
                    className={setupResult?.eldConnected ? 'bg-green-600' : 'bg-slate-600'}
                  >
                    {setupResult?.eldConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700">
                  <div>
                    <h3 className="font-semibold text-white">Load Board</h3>
                    <p className="text-sm text-slate-300">
                      {setupResult?.loadBoardProvider || 'Not configured'}
                    </p>
                  </div>
                  <Badge
                    variant={setupResult?.loadBoardConnected ? 'default' : 'secondary'}
                    className={setupResult?.loadBoardConnected ? 'bg-green-600' : 'bg-slate-600'}
                  >
                    {setupResult?.loadBoardConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {setupResult?.errors && setupResult.errors.length > 0 && (
            <Alert className="bg-red-900/20 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                <div className="space-y-1">
                  {setupResult.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Test Data */}
          {setupResult?.testData && (setupResult.testData.eld || setupResult.testData.loadBoard) && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Test Results</CardTitle>
                <CardDescription className="text-slate-300">
                  Sample data retrieved from your connected systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {setupResult.testData.eld && (
                  <div className="p-4 rounded-lg bg-slate-700">
                    <h3 className="font-semibold text-white mb-2">ELD Data Sample</h3>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(setupResult.testData.eld, null, 2)}
                    </pre>
                  </div>
                )}

                {setupResult.testData.loadBoard && (
                  <div className="p-4 rounded-lg bg-slate-700">
                    <h3 className="font-semibold text-white mb-2">Load Board Data Sample</h3>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(setupResult.testData.loadBoard, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {setupResult?.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="text-center pt-6">
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}