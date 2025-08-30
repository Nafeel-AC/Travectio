import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink, 
  Key, 
  Clock, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProviderInfo {
  name: string;
  description: string;
  website: string;
  apiDocsUrl: string;
  credentialsLocation: string;
  requirements: string[];
  approvalTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  credentials: {
    name: string;
    description: string;
    example: string;
  }[];
}

const loadBoardProviders: ProviderInfo[] = [
  {
    name: 'DAT Load Board',
    description: 'Market leader with highest load volume',
    website: 'https://www.dat.com',
    apiDocsUrl: 'https://developer.dat.com',
    credentialsLocation: 'Developer Portal → API Keys',
    requirements: [
      'Active DAT subscription',
      'Business verification',
      'API access request approval'
    ],
    approvalTime: '2-3 business days',
    difficulty: 'Medium',
    credentials: [
      { name: 'DAT_API_KEY', description: 'Your API authentication key', example: 'dat_api_abc123xyz' },
      { name: 'DAT_APP_ID', description: 'Application identifier', example: 'app_456def' },
      { name: 'DAT_USER_ID', description: 'Your user identifier', example: 'user_789ghi' }
    ]
  },
  {
    name: 'Truckstop.com',
    description: 'Nationwide load board with real-time data',
    website: 'https://www.truckstop.com',
    apiDocsUrl: 'https://developer.truckstop.com',
    credentialsLocation: 'Account Settings → Developer API',
    requirements: [
      'Truckstop subscription',
      'Developer account registration'
    ],
    approvalTime: '1-2 business days',
    difficulty: 'Easy',
    credentials: [
      { name: 'TRUCKSTOP_API_KEY', description: 'API authentication key', example: 'ts_key_abc123' },
      { name: 'TRUCKSTOP_USER_ID', description: 'Account user ID', example: 'ts_user_456' }
    ]
  },
  {
    name: '123Loadboard',
    description: 'Cost-effective load matching',
    website: 'https://www.123loadboard.com',
    apiDocsUrl: 'Contact support for API docs',
    credentialsLocation: 'Contact Customer Support',
    requirements: [
      'Active subscription',
      'Support ticket for API access'
    ],
    approvalTime: '3-5 business days',
    difficulty: 'Hard',
    credentials: [
      { name: 'LOADBOARD123_API_KEY', description: 'API key from support', example: 'lb123_xyz789' }
    ]
  }
];

const eldProviders: ProviderInfo[] = [
  {
    name: 'Samsara',
    description: 'Comprehensive fleet management platform',
    website: 'https://www.samsara.com',
    apiDocsUrl: 'https://developers.samsara.com',
    credentialsLocation: 'Admin Panel → Organization → API Tokens',
    requirements: [
      'Samsara fleet account',
      'Admin or API user permissions'
    ],
    approvalTime: 'Immediate',
    difficulty: 'Easy',
    credentials: [
      { name: 'SAMSARA_API_TOKEN', description: 'Bearer token for authentication', example: 'samsara_token_abc123' }
    ]
  },
  {
    name: 'Motive (KeepTruckin)',
    description: 'Driver-focused ELD and fleet management',
    website: 'https://www.motive.com',
    apiDocsUrl: 'https://developer.motive.com',
    credentialsLocation: 'Fleet Dashboard → Integrations → API',
    requirements: [
      'Motive ELD subscription',
      'Fleet admin access'
    ],
    approvalTime: '1 business day',
    difficulty: 'Medium',
    credentials: [
      { name: 'MOTIVE_API_KEY', description: 'API authentication key', example: 'motive_key_def456' },
      { name: 'MOTIVE_SECRET', description: 'API secret key', example: 'motive_secret_ghi789' }
    ]
  },
  {
    name: 'Geotab',
    description: 'Global telematics and fleet management',
    website: 'https://www.geotab.com',
    apiDocsUrl: 'https://developers.geotab.com',
    credentialsLocation: 'MyGeotab → Administration → System → API',
    requirements: [
      'Geotab GO device subscription',
      'MyGeotab admin access'
    ],
    approvalTime: 'Immediate',
    difficulty: 'Medium',
    credentials: [
      { name: 'GEOTAB_USERNAME', description: 'MyGeotab username', example: 'fleet@company.com' },
      { name: 'GEOTAB_PASSWORD', description: 'MyGeotab password', example: 'your_password' },
      { name: 'GEOTAB_DATABASE', description: 'Database name', example: 'company_database' }
    ]
  }
];

interface CredentialDisplayProps {
  credential: { name: string; description: string; example: string };
}

function CredentialDisplay({ credential }: CredentialDisplayProps) {
  const [showExample, setShowExample] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-3 bg-slate-100 border-2 border-slate-300 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <code className="text-sm font-mono text-slate-900 font-semibold">{credential.name}</code>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => copyToClipboard(credential.name)}
          className="h-6 px-2"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-slate-800 font-medium mb-2">{credential.description}</p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowExample(!showExample)}
          className="h-6 px-2 text-xs font-medium"
        >
          {showExample ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
          {showExample ? 'Hide' : 'Show'} Example
        </Button>
        {showExample && (
          <code className="text-xs font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded font-semibold">
            {credential.example}
          </code>
        )}
      </div>
    </div>
  );
}

interface ProviderCardProps {
  provider: ProviderInfo;
  type: 'loadboard' | 'eld';
}

function ProviderCard({ provider, type }: ProviderCardProps) {
  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800'
  };

  const cardColors = {
    loadboard: 'bg-blue-50 border-blue-200',
    eld: 'bg-green-50 border-green-200'
  };

  return (
    <Card className={`h-full ${cardColors[type]} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            {type === 'loadboard' ? <Truck className="h-5 w-5 text-blue-700" /> : <Clock className="h-5 w-5 text-green-700" />}
            {provider.name}
          </CardTitle>
          <Badge className={difficultyColors[provider.difficulty]}>
            {provider.difficulty}
          </Badge>
        </div>
        <CardDescription className="text-slate-800 font-semibold text-sm">{provider.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className={`font-semibold ${type === 'loadboard' ? 'text-blue-800' : 'text-green-800'}`}>Approval Time</p>
            <p className="text-slate-900 font-medium">{provider.approvalTime}</p>
          </div>
          <div>
            <p className={`font-semibold ${type === 'loadboard' ? 'text-blue-800' : 'text-green-800'}`}>Credentials Location</p>
            <p className="text-slate-900 font-medium text-xs">{provider.credentialsLocation}</p>
          </div>
        </div>

        {/* Requirements */}
        <div>
          <p className={`font-semibold mb-2 ${type === 'loadboard' ? 'text-blue-800' : 'text-green-800'}`}>Requirements</p>
          <ul className="space-y-1">
            {provider.requirements.map((req, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className={`h-3 w-3 flex-shrink-0 ${type === 'loadboard' ? 'text-blue-600' : 'text-green-600'}`} />
                <span className="text-slate-900 font-medium">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Credentials */}
        <div>
          <p className={`font-semibold mb-2 ${type === 'loadboard' ? 'text-blue-800' : 'text-green-800'}`}>Required Credentials</p>
          <div className="space-y-2">
            {provider.credentials.map((credential, index) => (
              <CredentialDisplay key={index} credential={credential} />
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" asChild>
            <a href={provider.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Website
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={provider.apiDocsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              API Docs
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function APICredentialsGuide() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">API Credentials Setup Guide</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Complete guide to obtaining and configuring API credentials for your load board and ELD integrations.
          Follow the provider-specific instructions below.
        </p>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Note:</strong> API credentials are sensitive. Always add them to Replit Secrets (🔑 icon) 
          rather than hardcoding them in your project files. This ensures they remain encrypted and secure.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="loadboards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="loadboards" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Load Board APIs
          </TabsTrigger>
          <TabsTrigger value="eld" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            ELD/HOS APIs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loadboards" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Load Board Integrations</h2>
            <p className="text-slate-600">
              Connect to major load boards for automatic load matching and market rate analysis.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {loadBoardProviders.map((provider, index) => (
              <ProviderCard key={index} provider={provider} type="loadboard" />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="eld" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">ELD/HOS Integrations</h2>
            <p className="text-slate-600">
              Connect to your ELD system for automatic HOS compliance tracking and driver monitoring.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {eldProviders.map((provider, index) => (
              <ProviderCard key={index} provider={provider} type="eld" />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Next Steps After Getting Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 text-base">1. Add to Secrets</h4>
              <p className="text-blue-800 font-medium">Click the 🔑 Secrets icon in Replit sidebar and add your credentials</p>
            </div>
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 text-base">2. Test Connection</h4>
              <p className="text-green-800 font-medium">Use the "Test Connection" buttons in Integration Management</p>
            </div>
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2 text-base">3. Start Syncing</h4>
              <p className="text-purple-800 font-medium">Once connected, data will automatically sync with your fleet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}