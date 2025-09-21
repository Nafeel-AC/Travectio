import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, BarChart3, Shield, Zap, Globe, Mail } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        // Check if email is in beta_testers allowlist
        const { data: betaTester, error: betaError } = await supabase
          .from('beta_testers')
          .select('email, is_active, expires_at')
          .eq('email', email.toLowerCase())
          .single();

        if (betaError && betaError.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw betaError;
        }

        if (!betaTester) {
          throw new Error("You are not invited to the beta. Please contact an administrator.");
        }

        if (!betaTester.is_active) {
          throw new Error("Your beta access has been deactivated. Please contact an administrator.");
        }

        if (betaTester.expires_at && new Date(betaTester.expires_at) < new Date()) {
          throw new Error("Your beta access has expired. Please contact an administrator.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Redirect will be handled by auth state change
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4 md:mb-6">
              <div className="bg-blue-600 p-2 md:p-3 rounded-xl">
                <Truck className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Travectio</h1>
            </div>
            <p className="text-lg md:text-xl text-slate-300 mb-2">
              Fleet Management Solutions
            </p>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base px-4">
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
                                 {/* Auth Form */}
                 <form onSubmit={handleAuth} className="space-y-4">
                   <div className="flex justify-center">
                     <div className="w-full max-w-sm">
                                               <input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500 bg-white"
                          required
                        />
                     </div>
                   </div>
                   <div className="flex justify-center">
                     <div className="w-full max-w-sm">
                                               <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500 bg-white"
                          required
                        />
                     </div>
                   </div>
                  
                                     {error && (
                     <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg mx-auto max-w-sm">
                       {error}
                     </div>
                   )}
                   
                   <div className="flex justify-center">
                     <Button
                       type="submit"
                       disabled={isLoading}
                       className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50"
                     >
                       <Shield className="h-5 w-5 mr-2" />
                       {isLoading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
                     </Button>
                   </div>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                                 {/* Google OAuth Button */}
                 <div className="flex justify-center">
                   <Button
                     onClick={handleGoogleLogin}
                     disabled={isLoading}
                     variant="outline"
                     className="w-full max-w-sm border-slate-300 text-slate-700 hover:bg-slate-50 py-3"
                   >
                     <Mail className="h-5 w-5 mr-2" />
                     Continue with Google
                   </Button>
                 </div>

                 {/* Toggle Sign Up/In */}
                 <div className="text-center">
                   <button
                     type="button"
                     onClick={() => setIsSignUp(!isSignUp)}
                     className="text-blue-600 hover:text-blue-700 text-sm"
                   >
                     {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                   </button>
                 </div>

               
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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