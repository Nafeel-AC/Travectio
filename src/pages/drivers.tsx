import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Plus, Search, Filter } from "lucide-react";
import { DriverListManager } from "@/components/driver-list-manager";
import { DriverOnboarding } from "@/components/driver-onboarding";

export default function DriversPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="text-slate-400 hover:text-white p-2 sm:p-3"
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Driver Management</h1>
                  <p className="text-slate-400 text-sm sm:text-base">Manage your fleet drivers, track their status, and handle assignments</p>
                </div>
              </div>
              {/* Right-side header actions removed per request (Driver Guide, Add Driver) */}
            </div>

            {/* Driver Management Section */}
            <div className="space-y-4 sm:space-y-6">
              <DriverListManager />
            </div>
          </div>
        </main>
      </div>

      {/* Driver Onboarding */}
      <DriverOnboarding 
        isNew={showOnboarding} 
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
}
