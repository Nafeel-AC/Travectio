import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Fuel, 
  Receipt, 
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Calendar,
  Truck,
  BarChart3,
  Shield
} from "lucide-react";
import { useFuelPurchases, useTrucks, useLoads } from "@/hooks/useSupabase";
import { Link } from "wouter";

interface ExpenseCardProps {
  expense: any;
}

function ExpenseCard({ expense }: ExpenseCardProps) {
  const getExpenseIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fuel': return <Fuel className="w-5 h-5" />;
      case 'maintenance': return <Truck className="w-5 h-5" />;
      case 'insurance': return <Shield className="w-5 h-5" />;
      case 'tolls': return <CreditCard className="w-5 h-5" />;
      default: return <Receipt className="w-5 h-5" />;
    }
  };

  const getExpenseColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fuel': return 'bg-blue-600';
      case 'maintenance': return 'bg-orange-600';
      case 'insurance': return 'bg-purple-600';
      case 'tolls': return 'bg-green-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800 hover:border-slate-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${getExpenseColor(expense.category)} rounded-full flex items-center justify-center`}>
              {getExpenseIcon(expense.category)}
            </div>
            <div>
              <div className="font-medium text-white">{expense.description}</div>
              <div className="text-sm text-slate-400">{expense.category}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-white">${expense.amount.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{new Date(expense.date).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="space-y-2">
          {expense.truckId && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Truck:</span>
              <span className="text-white">{expense.truckName || 'Unknown'}</span>
            </div>
          )}
          {expense.loadId && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Load:</span>
              <span className="text-white">#{expense.loadId.substring(0, 8)}...</span>
            </div>
          )}
          {expense.notes && (
            <div className="text-sm text-slate-400 pt-2 border-t border-slate-600">
              {expense.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfitLossCardProps {
  title: string;
  revenue: number;
  expenses: number;
  profit: number;
  icon: any;
  color: string;
}

function ProfitLossCard({ title, revenue, expenses, profit, icon: Icon, color }: ProfitLossCardProps) {
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100) : 0;

  return (
    <Card className="border-slate-700 bg-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-400">Revenue</div>
            <div className="text-lg font-semibold text-green-400">${revenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Expenses</div>
            <div className="text-lg font-semibold text-red-400">${expenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">Net Profit</div>
            <div className={`font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${profit.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">Margin</div>
            <div className={`font-semibold ${profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinanceTab() {
  const { purchases: fuelPurchases, loading: fuelLoading } = useFuelPurchases();
  const { trucks, loading: trucksLoading } = useTrucks();
  const { loads, loading: loadsLoading } = useLoads();

  const isLoading = fuelLoading || trucksLoading || loadsLoading;

  // Mock expense data - in real app this would come from expenses service
  const mockExpenses = [
    {
      id: '1',
      description: 'Regular Maintenance - Truck #1',
      category: 'Maintenance',
      amount: 1250.00,
      date: new Date().toISOString(),
      truckId: (trucks as any[])[0]?.id,
      truckName: (trucks as any[])[0]?.name,
      notes: 'Oil change, brake inspection, tire rotation'
    },
    {
      id: '2',
      description: 'Commercial Insurance Premium',
      category: 'Insurance',
      amount: 3200.00,
      date: new Date(Date.now() - 86400000).toISOString(),
      notes: 'Quarterly premium payment'
    },
    {
      id: '3',
      description: 'Highway Tolls - I-95',
      category: 'Tolls',
      amount: 45.50,
      date: new Date(Date.now() - 172800000).toISOString(),
      loadId: (loads as any[])[0]?.id,
      notes: 'Toll charges for load delivery'
    },
    {
      id: '4',
      description: 'Emergency Repair - Transmission',
      category: 'Maintenance',
      amount: 2800.00,
      date: new Date(Date.now() - 259200000).toISOString(),
      truckId: (trucks as any[])[1]?.id,
      truckName: (trucks as any[])[1]?.name,
      notes: 'Transmission fluid leak repair'
    }
  ];

  // Calculate financial metrics
  const totalRevenue = (loads as any[]).reduce((sum, load) => sum + (load.pay || 0), 0);
  const totalFuelExpenses = (fuelPurchases as any[]).reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
  const totalOtherExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalExpenses = totalFuelExpenses + totalOtherExpenses;
  const netProfit = totalRevenue - totalExpenses;

  // Calculate per-truck metrics
  const truckMetrics = (trucks as any[]).map(truck => {
    const truckLoads = (loads as any[]).filter(load => load.truckId === truck.id);
    const truckRevenue = truckLoads.reduce((sum, load) => sum + (load.pay || 0), 0);
    const truckFuelExpenses = (fuelPurchases as any[]).filter(purchase => purchase.truckId === truck.id)
      .reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
    const truckOtherExpenses = mockExpenses.filter(expense => expense.truckId === truck.id)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const truckExpenses = truckFuelExpenses + truckOtherExpenses;
    const truckProfit = truckRevenue - truckExpenses;

    return {
      truck,
      revenue: truckRevenue,
      expenses: truckExpenses,
      profit: truckProfit
    };
  });

  const exportToCSV = () => {
    // Mock CSV export functionality
    const csvData = [
      ['Date', 'Category', 'Description', 'Amount', 'Truck', 'Load'],
      ...mockExpenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        expense.category,
        expense.description,
        expense.amount.toFixed(2),
        expense.truckName || '',
        expense.loadId ? expense.loadId.substring(0, 8) : ''
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 pb-20 md:pb-6 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-1/3"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-slate-600 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Finance</h1>
          <p className="text-slate-400">Track fuel, expenses, and profitability</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={exportToCSV}
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Link href="/fuel-management">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">${totalExpenses.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Net Profit</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${netProfit.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Profit Margin</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fuel" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-700">
          <TabsTrigger value="fuel" className="text-slate-300 data-[state=active]:text-white">
            Fuel Management
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-slate-300 data-[state=active]:text-white">
            Expense Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-slate-300 data-[state=active]:text-white">
            P&L Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fuel" className="space-y-6">
          {/* Fuel Purchases */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Fuel className="h-5 w-5" />
                Fuel Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(fuelPurchases as any[]).length > 0 ? (
                  (fuelPurchases as any[]).map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <Fuel className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {purchase.gallons?.toFixed(2) || 'N/A'} gallons @ ${purchase.pricePerGallon?.toFixed(2) || 'N/A'}/gal
                          </div>
                          <div className="text-sm text-slate-400">
                            {new Date(purchase.purchaseDate).toLocaleDateString()} • {purchase.location || 'Unknown location'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">${purchase.amount?.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-slate-400">{purchase.truckName || 'Unattached'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Fuel className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No fuel purchases recorded</p>
                    <p className="text-sm">Start tracking fuel expenses to analyze costs</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {/* Expense Categories */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Fuel</p>
                    <p className="text-2xl font-bold text-blue-400">${totalFuelExpenses.toLocaleString()}</p>
                  </div>
                  <Fuel className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Maintenance</p>
                    <p className="text-2xl font-bold text-orange-400">
                      ${mockExpenses.filter(e => e.category === 'Maintenance').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <Truck className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Insurance</p>
                    <p className="text-2xl font-bold text-purple-400">
                      ${mockExpenses.filter(e => e.category === 'Insurance').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Other</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${mockExpenses.filter(e => e.category === 'Tolls').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <Receipt className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Expenses */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Receipt className="h-5 w-5" />
                Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockExpenses.map((expense) => (
                  <ExpenseCard key={expense.id} expense={expense} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Overall P&L */}
          <ProfitLossCard
            title="Overall P&L"
            revenue={totalRevenue}
            expenses={totalExpenses}
            profit={netProfit}
            icon={BarChart3}
            color="bg-blue-600"
          />

          {/* Per-Truck P&L */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {truckMetrics.map((metric) => (
              <ProfitLossCard
                key={metric.truck.id}
                title={metric.truck.name}
                revenue={metric.revenue}
                expenses={metric.expenses}
                profit={metric.profit}
                icon={Truck}
                color="bg-green-600"
              />
            ))}
          </div>

          {/* Export Options */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Download className="h-5 w-5" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button 
                  onClick={exportToCSV}
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  disabled
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  disabled
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
