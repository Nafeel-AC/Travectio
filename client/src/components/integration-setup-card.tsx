import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

interface IntegrationSetupCardProps {
  userHasTrucks: boolean;
}

export default function IntegrationSetupCard({ userHasTrucks }: IntegrationSetupCardProps) {
  if (!userHasTrucks) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Auto-Connect Your Systems
          </CardTitle>
          <CardDescription className="text-slate-300">
            Connect your ELD and load board systems for automatic data sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Add a truck first to enable integrations</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <h3 className="font-medium text-white mb-2">ELD Integration</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Automatic HOS tracking</li>
                <li>• Real-time driver status</li>
                <li>• Vehicle location data</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <h3 className="font-medium text-white mb-2">Load Board Sync</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Automatic load matching</li>
                <li>• Market rate analysis</li>
                <li>• Profit optimization</li>
              </ul>
            </div>
          </div>

          <Link href="/add-truck">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Add Your First Truck
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-500" />
          Auto-Connect Your Systems
          <Badge variant="secondary" className="bg-green-600 text-white">
            Ready
          </Badge>
        </CardTitle>
        <CardDescription className="text-slate-300">
          Connect your ELD and load board systems for automatic data sync
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
            <h3 className="font-medium text-white mb-2">ELD Integration</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Samsara, Motive, Garmin</li>
              <li>• Automatic HOS tracking</li>
              <li>• Real-time driver status</li>
            </ul>
          </div>
          
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
            <h3 className="font-medium text-white mb-2">Load Board Sync</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• DAT, Truckstop.com</li>
              <li>• Automatic load matching</li>
              <li>• Market rate analysis</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/integration-onboarding">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Connect Systems
            </Button>
          </Link>
          
          <Link href="/integration-management">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}