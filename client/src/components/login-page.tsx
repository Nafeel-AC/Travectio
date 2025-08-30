import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, BarChart3, Shield, Zap, Globe } from "lucide-react";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Travectio</h1>
            </div>
            <p className="text-xl text-slate-300 mb-2">
              Fleet Management Solutions
            </p>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Comprehensive trucking operations management platform for real-time decision-making and maximum profitability
            </p>
          </div>

          {/* Main Login Card */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl mb-8">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-slate-800">
                Welcome to Travectio
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Sign in to access your fleet management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-6">
                {/* Login Button */}
                <Button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Sign In with Replit
                </Button>

                {/* Features Grid */}
                <div className="pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-600 text-center mb-4">
                    What you'll get access to:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 text-sm text-slate-700">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Fleet Management</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-slate-700">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Analytics Dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-slate-700">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>Driver Management</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-slate-700">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Zap className="h-4 w-4 text-orange-600" />
                      </div>
                      <span>Load Optimization</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Truck className="h-5 w-5 text-blue-300" />
                  </div>
                  <h3 className="font-semibold">Fleet Oversight</h3>
                </div>
                <p className="text-sm text-slate-300">
                  Real-time tracking and management of your entire fleet operations
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-300" />
                  </div>
                  <h3 className="font-semibold">Profit Analytics</h3>
                </div>
                <p className="text-sm text-slate-300">
                  Detailed cost analysis and profitability tracking for informed decisions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-300" />
                  </div>
                  <h3 className="font-semibold">Multi-Platform</h3>
                </div>
                <p className="text-sm text-slate-300">
                  Access your fleet data anywhere with mobile-responsive design
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm">
              © 2025 Travectio Solutions. Secure fleet management platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}