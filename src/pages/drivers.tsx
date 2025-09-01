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
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Driver Management</h1>
                  <p className="text-slate-400">Manage your fleet drivers, track their status, and handle assignments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowOnboarding(true)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Driver Guide
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
              </div>
            </div>

            {/* Driver Management Section */}
            <div className="space-y-6">
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
