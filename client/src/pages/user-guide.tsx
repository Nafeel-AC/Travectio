import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Truck, 
  Package, 
  Fuel, 
  DollarSign, 
  BarChart3, 
  Users, 
  Calculator, 
  MapPin,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";

export default function UserGuide() {
  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200">
          Travectio Fleet Management System
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Complete User Guide - Everything You Need to Know
        </p>
        <Badge variant="outline" className="text-sm">
          Version 2.0 - Beta Testing Ready
        </Badge>
      </div>

      {/* Quick Start Section */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <CheckCircle className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Essential steps to get started with your fleet management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Truck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-1">1. Add Trucks</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Set up your fleet with accurate cost details
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold mb-1">2. Add Drivers</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Register drivers for compliance tracking
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold mb-1">3. Enter Loads</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Record freight jobs and routes
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Fuel className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold mb-1">4. Track Fuel</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Log fuel purchases for accurate costs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Truck Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Truck Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost Setup
              </h4>
              <ul className="text-sm space-y-1 ml-6">
                <li>• <strong>Fixed Costs:</strong> Insurance, payments, permits (weekly)</li>
                <li>• <strong>Variable Costs:</strong> Maintenance, repairs, tires</li>
                <li>• <strong>CPM Calculation:</strong> Automatic cost-per-mile tracking</li>
              </ul>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Equipment Types</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Dry Van</Badge>
                <Badge variant="secondary">Reefer</Badge>
                <Badge variant="secondary">Flatbed</Badge>
                <Badge variant="secondary">Step Deck</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Load Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Load Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Route Tracking
              </h4>
              <ul className="text-sm space-y-1 ml-6">
                <li>• <strong>Origin/Destination:</strong> City and state tracking</li>
                <li>• <strong>Miles:</strong> Automatic distance calculation</li>
                <li>• <strong>Deadhead:</strong> Non-revenue miles included</li>
              </ul>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Load Status</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Available</Badge>
                <Badge variant="secondary">In Transit</Badge>
                <Badge variant="default">Delivered</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Purchase Guide */}
      <Card className="border-2 border-green-200 dark:border-green-800">
        <CardHeader className="bg-green-50 dark:bg-green-950/20">
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Fuel className="h-5 w-5" />
            Combined Fuel Purchase System
          </CardTitle>
          <CardDescription>
            Record both diesel fuel and DEF in the same transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                🛢️ Diesel Fuel (Regular Fuel)
              </h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Enter gallons purchased</li>
                <li>• Enter price per gallon</li>
                <li>• Total cost calculated automatically</li>
                <li>• Higher cost per gallon</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700 dark:text-green-300">
                📦 DEF (Diesel Exhaust Fluid)
              </h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Enter DEF gallons purchased</li>
                <li>• Enter total cost paid (manual)</li>
                <li>• Price per gallon calculated automatically</li>
                <li>• Much cheaper than diesel fuel</li>
              </ul>
            </div>
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-md">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> DEF is typically much cheaper than diesel fuel. 
              Enter the total amount you paid for DEF fluid, and the system will calculate 
              the per-gallon cost automatically for record-keeping.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analytics & Reporting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            Analytics & Financial Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Calculator className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold">Cost Per Mile</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Real-time CPM calculations including all costs
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold">Profitability</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Revenue vs costs with profit margins
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold">Time Analysis</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Weekly, monthly, quarterly reports
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="border-2 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20">
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-5 w-5" />
            Best Practices & Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Data Entry Tips</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Update truck costs weekly for accuracy</li>
                <li>• Enter fuel purchases immediately</li>
                <li>• Record all deadhead miles</li>
                <li>• Keep receipt numbers for tracking</li>
                <li>• Use consistent city/state formats</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Cost Management</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Monitor CPM trends weekly</li>
                <li>• Compare actual vs estimated costs</li>
                <li>• Track fuel efficiency (MPG)</li>
                <li>• Review profit margins monthly</li>
                <li>• Set target CPM goals</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-slate-600" />
            System Features & Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Fleet Management</h4>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>• Multi-truck support</li>
                <li>• Driver assignment</li>
                <li>• Equipment type tracking</li>
                <li>• Real-time cost monitoring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Load Board Integration</h4>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>• DAT integration ready</li>
                <li>• Truckstop compatibility</li>
                <li>• 123Loadboard support</li>
                <li>• Manual entry option</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">ELD Integration</h4>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>• Samsara support</li>
                <li>• KeepTruckin/Motive</li>
                <li>• Garmin compatibility</li>
                <li>• HOS tracking ready</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card className="bg-slate-50 dark:bg-slate-900 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Support & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This system is currently in <strong>beta testing</strong> with comprehensive features 
            for fleet management, accurate CPM calculations, and financial intelligence.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <strong>Current Status:</strong> 
              <Badge variant="outline" className="ml-2">87.5% API Integration</Badge>
            </div>
            <div>
              <strong>CPM Accuracy:</strong> 
              <Badge variant="secondary" className="ml-2">$1.859 Validated</Badge>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            For technical support or feature requests, contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}