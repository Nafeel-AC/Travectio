import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Calculator, 
  TrendingUp, 
  Info,
  ChevronRight,
  ChevronDown,
  Truck,
  Fuel,
  Shield,
  Wrench,
  Phone,
  CreditCard,
  FileText,
  Target
} from 'lucide-react';

interface TruckCostGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

interface CostCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  items: {
    name: string;
    description: string;
    typicalRange: string;
    importance: 'critical' | 'high' | 'medium';
    example: string;
  }[];
}

const costCategories: CostCategory[] = [
  {
    id: 'vehicle-payments',
    title: 'Vehicle Payments',
    icon: <Truck className="h-5 w-5" />,
    description: 'Average weekly payments for truck and trailer financing or leasing',
    items: [
      {
        name: 'Truck Payment',
        description: 'Average weekly truck financing or lease payment',
        typicalRange: '$185 - $575',
        importance: 'critical',
        example: 'Used truck loan: $275/week, New truck lease: $460/week'
      },
      {
        name: 'Trailer Payment',
        description: 'Average weekly trailer financing or lease payment (if applicable)',
        typicalRange: '$45 - $185',
        importance: 'high',
        example: 'Dry van trailer lease: $90/week, Refrigerated trailer: $140/week'
      }
    ]
  },
  {
    id: 'insurance',
    title: 'Insurance Coverage',
    icon: <Shield className="h-5 w-5" />,
    description: 'Average weekly insurance premiums',
    items: [
      {
        name: 'Liability Insurance',
        description: 'Required commercial auto liability coverage',
        typicalRange: '$185 - $460',
        importance: 'critical',
        example: '$1M liability coverage: $275/week for new drivers'
      },
      {
        name: 'Physical Damage Insurance',
        description: 'Comprehensive and collision coverage for truck',
        typicalRange: '$70 - $185',
        importance: 'critical',
        example: '$500 deductible on $80K truck: $115/week'
      },
      {
        name: 'Cargo Insurance',
        description: 'Coverage for freight being transported',
        typicalRange: '$25 - $90',
        importance: 'high',
        example: '$100K cargo coverage: $45/week'
      },
      {
        name: 'Bobtail Insurance',
        description: 'Coverage when driving without trailer',
        typicalRange: '$7 - $25',
        importance: 'medium',
        example: 'Basic bobtail coverage: $12/week'
      },
      {
        name: 'Non-Trucking Liability',
        description: 'Personal use coverage when not under dispatch',
        typicalRange: '$10 - $30',
        importance: 'medium',
        example: 'Personal use coverage: $17/week'
      }
    ]
  },
  {
    id: 'technology',
    title: 'Technology & Communications',
    icon: <Phone className="h-5 w-5" />,
    description: 'Average weekly technology and communication costs',
    items: [
      {
        name: 'ELD Subscription',
        description: 'Electronic Logging Device weekly service cost',
        typicalRange: '$5 - $15',
        importance: 'critical',
        example: 'Basic ELD service: $8/week, Premium with fleet management: $12/week'
      },
      {
        name: 'Company Phone',
        description: 'Business phone line and data plan',
        typicalRange: '$12 - $35',
        importance: 'high',
        example: 'Unlimited business plan: $18/week'
      }
    ]
  },
  {
    id: 'regulatory',
    title: 'Regulatory & Permits',
    icon: <FileText className="h-5 w-5" />,
    description: 'Average weekly government fees and permits',
    items: [
      {
        name: 'Base Plate & IFTA',
        description: 'Registration and fuel tax reporting',
        typicalRange: '$12 - $45',
        importance: 'critical',
        example: 'Base plate registration: $25/week average'
      },
      {
        name: 'Trailer Interchange',
        description: 'Trailer rental or interchange fees',
        typicalRange: '$0 - $70',
        importance: 'medium',
        example: 'Trailer pool access: $35/week'
      }
    ]
  }
];

const variableCostCategories: CostCategory[] = [
  {
    id: 'fuel',
    title: 'Fuel Costs',
    icon: <Fuel className="h-5 w-5" />,
    description: 'Weekly fuel expenses - tracked separately through fuel purchases',
    items: [
      {
        name: 'Diesel Fuel',
        description: 'Primary fuel costs (tracked automatically through fuel purchases)',
        typicalRange: '$800 - $1,400 per week',
        importance: 'critical',
        example: 'At $3.50/gallon, 6.5 MPG, 2,500 miles/week: $1,350/week'
      }
    ]
  },
  {
    id: 'driver-compensation',
    title: 'Driver Compensation',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Weekly driver pay structure and compensation',
    items: [
      {
        name: 'Driver Pay',
        description: 'Per-mile pay calculated for weekly input (enter as cents per mile)',
        typicalRange: '35¢ - 65¢ per mile',
        importance: 'critical',
        example: 'Experienced driver: 50¢/mile, New driver: 40¢/mile (enter as cents: 50, 40)'
      }
    ]
  },
  {
    id: 'maintenance',
    title: 'Maintenance & Operations',
    icon: <Wrench className="h-5 w-5" />,
    description: 'Average weekly variable costs that increase with usage',
    items: [
      {
        name: 'Maintenance',
        description: 'Preventive maintenance, repairs, tires, oil changes',
        typicalRange: '$150 - $300 per week',
        importance: 'high',
        example: 'Preventive maintenance program: $200/week average'
      },
      {
        name: 'Tolls',
        description: 'Highway and bridge tolls',
        typicalRange: '$50 - $125 per week',
        importance: 'medium',
        example: 'Northeast corridor routes: $75/week average'
      },
      {
        name: 'Truck Parking',
        description: 'Paid parking at truck stops and facilities',
        typicalRange: '$70 - $105 per week',
        importance: 'medium',
        example: 'Truck stop parking: $85/week average'
      }
    ]
  }
];

export function TruckCostGuide({ isOpen, onClose, onProceed }: TruckCostGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['vehicle-payments']);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const totalSteps = 4;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Reset step when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleItem = (itemName: string) => {
    setCheckedItems(prev => 
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Accurate Cost Setup is Critical
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
                  The value and accuracy of Travectio depends entirely on precise cost data
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm sm:text-base">
                    Why Accurate Costs Matter
                  </h3>
                  <ul className="mt-2 text-xs sm:text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    <li>• <strong>Profitability Analysis:</strong> Know if loads are actually profitable</li>
                    <li>• <strong>Accurate CPM:</strong> True cost per mile for better decision making</li>
                    <li>• <strong>Load Pricing:</strong> Price loads correctly to ensure profit margins</li>
                    <li>• <strong>Financial Planning:</strong> Understand your real operating costs</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm sm:text-base">Cost Per Mile</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Calculate true operational costs
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm sm:text-base">Profit Margins</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Identify profitable vs losing loads
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4 text-center">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm sm:text-base">Load Pricing</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Price loads to guarantee profit
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Fixed Costs (Monthly)
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                These costs remain the same regardless of miles driven
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {costCategories.map((category) => (
                <Card key={category.id} className="border-2">
                  <CardHeader 
                    className="cursor-pointer p-3 sm:p-6"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">{category.icon}</div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg">{category.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{category.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {expandedCategories.includes(category.id) ? 
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" /> : 
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedCategories.includes(category.id) && (
                    <CardContent className="pt-0 p-3 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {category.items.map((item) => (
                          <div key={item.name} className="border rounded-lg p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                  <h4 className="font-semibold text-sm sm:text-base">{item.name}</h4>
                                  <Badge 
                                    variant={
                                      item.importance === 'critical' ? 'destructive' :
                                      item.importance === 'high' ? 'default' : 'secondary'
                                    }
                                    className="text-xs flex-shrink-0"
                                  >
                                    {item.importance}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {item.description}
                                </p>
                                <div className="text-xs sm:text-sm">
                                  <div className="font-medium text-green-600 dark:text-green-400">
                                    Typical Range: {item.typicalRange}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                                    <strong>Example:</strong> {item.example}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleItem(item.name)}
                                className={`flex-shrink-0 ${checkedItems.includes(item.name) ? 'text-green-600' : ''}`}
                              >
                                <CheckCircle className={`h-4 w-4 ${
                                  checkedItems.includes(item.name) 
                                    ? 'text-green-600 fill-current' 
                                    : 'text-gray-400'
                                }`} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Variable Costs (Per Mile)
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                These costs increase with miles driven and load activity
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {variableCostCategories.map((category) => (
                <Card key={category.id} className="border-2">
                  <CardHeader 
                    className="cursor-pointer p-3 sm:p-6"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">{category.icon}</div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg">{category.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{category.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {expandedCategories.includes(category.id) ? 
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" /> : 
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedCategories.includes(category.id) && (
                    <CardContent className="pt-0 p-3 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {category.items.map((item) => (
                          <div key={item.name} className="border rounded-lg p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                  <h4 className="font-semibold text-sm sm:text-base">{item.name}</h4>
                                  <Badge 
                                    variant={
                                      item.importance === 'critical' ? 'destructive' :
                                      item.importance === 'high' ? 'default' : 'secondary'
                                    }
                                    className="text-xs flex-shrink-0"
                                  >
                                    {item.importance}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {item.description}
                                </p>
                                <div className="text-xs sm:text-sm">
                                  <div className="font-medium text-green-600 dark:text-green-400">
                                    Typical Range: {item.typicalRange}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                                    <strong>Example:</strong> {item.example}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleItem(item.name)}
                                className={`flex-shrink-0 ${checkedItems.includes(item.name) ? 'text-green-600' : ''}`}
                              >
                                <CheckCircle className={`h-4 w-4 ${
                                  checkedItems.includes(item.name) 
                                    ? 'text-green-600 fill-current' 
                                    : 'text-gray-400'
                                }`} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm sm:text-base">
                    Fuel Cost Tracking
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                    Fuel costs are tracked separately through fuel purchase entries. The system will automatically calculate your actual fuel costs per mile and MPG based on your fuel purchases and miles driven.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Ready to Add Your Truck
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                You now understand the importance of accurate cost data
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 sm:p-6">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 text-base sm:text-lg">
                    Cost Setup Checklist Complete
                  </h3>
                  <div className="mt-3 space-y-2 text-xs sm:text-sm text-green-700 dark:text-green-400">
                    <div>✓ Understand fixed vs variable costs</div>
                    <div>✓ Know typical cost ranges for your operation</div>
                    <div>✓ Ready to enter accurate monthly expenses</div>
                    <div>✓ Understand fuel cost tracking system</div>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  <span>What Happens Next</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                    <span>Enter your truck's basic information (name, VIN, etc.)</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                    <span>Input accurate monthly fixed costs based on this guide</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <span>Set up weekly cost breakdowns for precise tracking</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                    <span>Begin tracking loads and fuel purchases for accurate profitability</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm sm:text-base">
                    Remember: Garbage In, Garbage Out
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                    The accuracy of Travectio's profitability analysis, cost per mile calculations, and load recommendations depends entirely on the accuracy of the cost data you enter. Take time to gather your actual monthly expenses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 p-2 sm:p-4">
      {/* Center using translate to avoid parent layout influence and keep theme context */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] h-[90vh] sm:h-auto max-h-[90vh] flex flex-col shadow-xl">
        <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              <span className="hidden sm:inline">Truck Setup Cost Guide</span>
              <span className="sm:hidden">Cost Guide</span>
            </h1>
            <Button variant="ghost" onClick={onClose} className="p-1 sm:p-2">
              ×
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {renderStep()}
        </div>

        <div className="p-3 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
              {currentStep < totalSteps - 1 ? (
                <Button 
                  onClick={() => setCurrentStep(currentStep + 1)} 
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                >
                  <span className="hidden sm:inline">Next Step</span>
                  <span className="sm:hidden">Next</span>
                </Button>
              ) : (
                <Button onClick={onProceed} className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                  <span className="hidden sm:inline">I Understand - Add Truck</span>
                  <span className="sm:hidden">Add Truck</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}