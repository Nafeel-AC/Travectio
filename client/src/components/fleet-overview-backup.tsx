import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Truck, DollarSign, Clock } from "lucide-react";
import { useDemoApi } from "@/hooks/useDemoApi";
import AddTruckDialog from "./add-truck-dialog";

export default function FleetOverview() {
  const { useDemoQuery } = useDemoApi();
  const { data: trucks = [], isLoading } = useDemoQuery(
    ["/api/trucks"],
    "/api/trucks",
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const getColorByIndex = (index: number) => {
    const colors = [
      'bg-[var(--primary-blue)]',
      'bg-[var(--blue-accent)]', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500'
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--dark-card)] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Fleet Overview</CardTitle>
          <AddTruckDialog 
            trigger={
              <Button
                size="sm"
                className="text-[var(--primary-blue)] hover:text-[var(--blue-light)] bg-transparent hover:bg-[var(--dark-elevated)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Truck
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Truck</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">CPM</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Fixed</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Variable</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-300">Miles</th>
              </tr>
            </thead>
            <tbody>
              {!trucks || trucks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Truck className="h-12 w-12 text-gray-500" />
                      <div className="text-gray-400">
                        <p className="text-lg font-medium">No trucks in your fleet yet</p>
                        <p className="text-sm">Add your first truck to start managing costs and loads</p>
                      </div>
                      <AddTruckDialog 
                        trigger={
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Truck
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                trucks.map((truck: any, index: number) => (
                  <tr
                    key={truck.id}
                    className="border-b border-gray-700 hover:bg-[var(--dark-elevated)] transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${getColorByIndex(index)} rounded-full flex items-center justify-center text-sm font-semibold text-white`}>
                          {getInitials(truck.name)}
                        </div>
                        <span className="text-white font-medium">{truck.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-white font-medium">
                      ${truck.costPerMile || '0.00'}
                    </td>
                    <td className="py-3 px-2 text-gray-300">
                      ${truck.fixedCosts?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-2 text-gray-300">
                      ${truck.variableCosts?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-2 text-gray-300">
                      {truck.totalMiles?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
