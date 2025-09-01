import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

export default function CostChart() {
  // TODO: Implement proper cost trend service
  const { data: trendData = [], isLoading } = useQuery({
    queryKey: ['cost-trend'],
    queryFn: () => Promise.resolve([
      { month: 'Jan', costPerMile: 2.1 },
      { month: 'Feb', costPerMile: 2.3 },
      { month: 'Mar', costPerMile: 2.0 },
      { month: 'Apr', costPerMile: 2.2 },
      { month: 'May', costPerMile: 2.4 },
      { month: 'Jun', costPerMile: 2.1 }
    ]), // Placeholder data
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  if (isLoading) {
    return (
      <Card className="bg-[var(--dark-card)] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Cost Per Mile Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--dark-card)] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Cost Per Mile Trend</CardTitle>
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="bg-[var(--primary-blue)] text-white hover:bg-[var(--blue-accent)]"
            >
              7D
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-[var(--dark-elevated)]"
            >
              30D
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-[var(--dark-elevated)]"
            >
              90D
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
              />
              <Line
                type="monotone"
                dataKey="costPerMile"
                stroke="hsl(221, 83%, 60%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(221, 83%, 60%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(221, 83%, 60%)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
