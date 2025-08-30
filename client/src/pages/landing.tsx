import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, BarChart3, DollarSign, Clock, Shield, Zap, BookOpen } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Truck className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Travectio Fleet Management
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Transform your trucking operations with intelligent fleet management. 
            Track costs, optimize loads, ensure compliance, and maximize profitability 
            from solo operations to enterprise fleets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Get Started - Log In
            </Button>
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
              onClick={() => window.location.href = '/add-truck'}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Add Your First Truck
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="bg-green-600 p-3 rounded-lg w-fit">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">Cost Optimization</CardTitle>
              <CardDescription className="text-slate-300">
                Track detailed cost breakdowns, fuel efficiency, and calculate accurate cost-per-mile metrics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="bg-purple-600 p-3 rounded-lg w-fit">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">Load Intelligence</CardTitle>
              <CardDescription className="text-slate-300">
                AI-powered load matching with profitability analysis and multi-leg planning capabilities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="bg-orange-600 p-3 rounded-lg w-fit">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">HOS Compliance</CardTitle>
              <CardDescription className="text-slate-300">
                Electronic logging device integration for DOT compliance and driver safety monitoring
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Built for Every Fleet Size
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="text-white font-semibold">Enterprise Security</h3>
                  <p className="text-slate-300">Secure authentication and data protection for your fleet operations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="text-white font-semibold">Real-Time Sync</h3>
                  <p className="text-slate-300">Cross-tab synchronization ensures all your data stays up-to-date across all dashboards</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="text-white font-semibold">Time-Based Analytics</h3>
                  <p className="text-slate-300">Comprehensive reporting across weekly, monthly, quarterly, and yearly timeframes</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/30 p-8 rounded-2xl border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to optimize your fleet?</h3>
            <p className="text-slate-300 mb-6">
              Join fleet managers who have reduced operational costs by up to 15% 
              while improving driver satisfaction and compliance.
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.href = '/api/login'}
              >
                Sign In to Continue
              </Button>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-white border-slate-600 hover:bg-slate-700"
                  onClick={() => window.open('mailto:rrivera@travectiosolutions.com?subject=Fleet Management Solutions Demo Request&body=Hello,%0A%0AI would like to schedule a demo of Travectio Fleet Management Solutions.%0A%0APlease contact me to arrange a convenient time.%0A%0AThanks!', '_blank')}
                >
                  Schedule Demo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-white border-slate-600 hover:bg-slate-700"
                  onClick={() => window.open('mailto:rrivera@travectiosolutions.com?subject=Sales Inquiry - Fleet Management Solutions', '_blank')}
                >
                  Contact Sales
                </Button>
              </div>
              <div className="text-center text-xs text-slate-400">
                Questions? Email us at{' '}
                <a 
                  href="mailto:rrivera@travectiosolutions.com" 
                  className="text-blue-400 hover:underline"
                >
                  rrivera@travectiosolutions.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}