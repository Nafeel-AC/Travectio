import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TruckService } from "@/lib/supabase-client";
import { Link } from "wouter";
import { TruckManagementCard } from "./truck-management-card";

export function TruckListManager() {
  const { data: trucks, isLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => TruckService.getTrucks(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Fleet Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-700 h-24 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Fleet Management ({(trucks as any)?.length || 0} trucks)
          </CardTitle>
          <Link href="/guided-truck-addition">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Add Truck
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {trucks && (trucks as any[]).length > 0 ? (
          <div className="space-y-4">
            {(trucks as any[]).map((truck: any) => (
              <TruckManagementCard key={truck.id} truck={truck} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🚛</div>
            <h3 className="text-white text-lg font-medium mb-2">No trucks in fleet</h3>
            <p className="text-slate-400 mb-4">Add your first truck to get started with fleet management</p>
            <Link href="/guided-truck-addition">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Truck
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}