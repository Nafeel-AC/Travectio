import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  CreditCard, 
  Users, 
  User, 
  Bell,
  Shield,
  DollarSign,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Crown,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabase";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Link } from "wouter";

interface UserCardProps {
  user: any;
  role: string;
  isCurrentUser?: boolean;
}

function UserCard({ user, role, isCurrentUser = false }: UserCardProps) {
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner': return 'bg-purple-600';
      case 'admin': return 'bg-blue-600';
      case 'manager': return 'bg-green-600';
      case 'driver': return 'bg-orange-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <Card className={`border-slate-700 ${isCurrentUser ? 'bg-blue-900/20' : 'bg-slate-800'} hover:border-slate-600 transition-colors`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-white">
                {user.firstName} {user.lastName}
                {isCurrentUser && <span className="text-blue-400 ml-2">(You)</span>}
              </div>
              <div className="text-sm text-slate-400">{user.email}</div>
            </div>
          </div>
          <Badge className={`${getRoleColor(role)} text-white`}>
            {role}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Status:</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Last Active:</span>
            <span className="text-white">2 hours ago</span>
          </div>
          {user.phoneNumber && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Phone:</span>
              <span className="text-white">{user.phoneNumber}</span>
            </div>
          )}
        </div>

        {!isCurrentUser && (
          <div className="mt-4 pt-3 border-t border-slate-600 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="border-red-600 text-red-400">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SubscriptionCardProps {
  plan: string;
  price: number;
  trucks: number;
  features: string[];
  isCurrent?: boolean;
  onUpgrade?: () => void;
}

function SubscriptionCard({ plan, price, trucks, features, isCurrent = false, onUpgrade }: SubscriptionCardProps) {
  return (
    <Card className={`border-slate-700 ${isCurrent ? 'bg-blue-900/20 border-blue-600' : 'bg-slate-800'} hover:border-slate-600 transition-colors`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>{plan}</span>
          {isCurrent && <Badge className="bg-green-600">Current</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">${price}</div>
          <div className="text-slate-400">per truck/month</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Trucks:</span>
            <span className="text-white">{trucks}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Users:</span>
            <span className="text-white">{plan === 'Starter' ? '1' : 'Unlimited'}</span>
          </div>
        </div>

        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-slate-300">{feature}</span>
            </div>
          ))}
        </div>

        {!isCurrent && (
          <Button 
            onClick={onUpgrade}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            {plan === 'Starter' ? 'Upgrade to Pro' : 'Upgrade to Enterprise'}
          </Button>
        )}

        {isCurrent && (
          <Button 
            variant="outline"
            className="w-full border-slate-600 text-slate-300"
            disabled
          >
            Current Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsTab() {
  const { user, isFounder, isAdmin } = useAuth();
  const { isSubscribed } = useSubscriptionLimits();

  // Mock users data
  const mockUsers = [
    {
      id: '1',
      firstName: (user as any)?.firstName || 'John',
      lastName: (user as any)?.lastName || 'Doe',
      email: (user as any)?.email || 'john@example.com',
      phoneNumber: '+1 (555) 123-4567',
      role: 'owner'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phoneNumber: '+1 (555) 234-5678',
      role: 'admin'
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike@example.com',
      role: 'manager'
    }
  ];

  const subscriptionPlans = [
    {
      plan: 'Starter',
      price: 24.99,
      trucks: 1,
      features: [
        'Basic load management',
        'Single truck tracking',
        'Basic reporting',
        'Email support'
      ]
    },
    {
      plan: 'Pro',
      price: 24.99,
      trucks: 5,
      features: [
        'Advanced load management',
        'Multi-truck fleet tracking',
        'Advanced analytics',
        'HOS compliance',
        'Priority support',
        'API access'
      ]
    },
    {
      plan: 'Enterprise',
      price: 49.99,
      trucks: 20,
      features: [
        'Unlimited trucks',
        'Custom integrations',
        'White-label options',
        'Dedicated support',
        'Custom reporting',
        'SLA guarantees'
      ]
    }
  ];

  const handleUpgradePlan = (planName: string) => {
    // Mock upgrade functionality
    console.log(`Upgrading to ${planName}`);
    // In real app, this would redirect to Stripe checkout
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-slate-400">Manage your account, billing, and team permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            <Shield className="h-3 w-3 mr-1" />
            Secure
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-700">
          <TabsTrigger value="profile" className="text-slate-300 data-[state=active]:text-white">
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-slate-300 data-[state=active]:text-white">
            Billing
          </TabsTrigger>
          <TabsTrigger value="users" className="text-slate-300 data-[state=active]:text-white">
            Users
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-slate-300 data-[state=active]:text-white">
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Account Profile */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                Account Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">
                    {(user as any)?.firstName || 'John'} {(user as any)?.lastName || 'Doe'}
                  </h3>
                  <p className="text-slate-400">{(user as any)?.email || 'john@example.com'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge className="bg-blue-600 text-white">
                      {isFounder ? 'Founder' : isAdmin ? 'Admin' : 'Owner'}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-600 text-white">
                      Verified
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">First Name</label>
                    <div className="mt-1 text-white">{(user as any)?.firstName || 'John'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Last Name</label>
                    <div className="mt-1 text-white">{(user as any)?.lastName || 'Doe'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Email</label>
                    <div className="mt-1 text-white">{(user as any)?.email || 'john@example.com'}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Phone</label>
                    <div className="mt-1 text-white">+1 (555) 123-4567</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Company</label>
                    <div className="mt-1 text-white">Travectio Transport LLC</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Member Since</label>
                    <div className="mt-1 text-white">January 2024</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-white">support@travectio.com</div>
                      <div className="text-sm text-slate-400">Support Email</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-white">+1 (555) 123-4567</div>
                      <div className="text-sm text-slate-400">Support Phone</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-white">123 Transport St</div>
                      <div className="text-sm text-slate-400">Atlanta, GA 30309</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-white">24/7 Support</div>
                      <div className="text-sm text-slate-400">Always Available</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Current Subscription */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <div className="text-white font-medium">Pro Plan</div>
                  <div className="text-slate-400 text-sm">$24.99 per truck/month</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">$124.95</div>
                  <div className="text-slate-400 text-sm">Next billing: Jan 15, 2024</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Plans */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5" />
                Subscription Plans
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Choose the plan that best fits your fleet size and needs
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {subscriptionPlans.map((plan) => (
                  <SubscriptionCard
                    key={plan.plan}
                    plan={plan.plan}
                    price={plan.price}
                    trucks={plan.trucks}
                    features={plan.features}
                    isCurrent={plan.plan === 'Pro'}
                    onUpgrade={() => handleUpgradePlan(plan.plan)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5" />
                Billing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Pro Plan - December 2023</div>
                    <div className="text-slate-400 text-sm">5 trucks • Dec 15, 2023</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">$124.95</div>
                    <Badge className="bg-green-600 text-white">Paid</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Pro Plan - November 2023</div>
                    <div className="text-slate-400 text-sm">5 trucks • Nov 15, 2023</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">$124.95</div>
                    <Badge className="bg-green-600 text-white">Paid</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Team Members */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({mockUsers.length})
                </span>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    role={user.role}
                    isCurrentUser={user.id === '1'}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Permissions */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="text-white font-medium">Owner</div>
                  <div className="text-sm text-slate-400">Full access to all features and settings</div>
                </div>
                <div className="space-y-2">
                  <div className="text-white font-medium">Admin</div>
                  <div className="text-sm text-slate-400">Manage operations and users</div>
                </div>
                <div className="space-y-2">
                  <div className="text-white font-medium">Manager</div>
                  <div className="text-sm text-slate-400">View and manage loads</div>
                </div>
                <div className="space-y-2">
                  <div className="text-white font-medium">Driver</div>
                  <div className="text-sm text-slate-400">View assigned loads only</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Notification Settings */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Email Notifications</div>
                    <div className="text-slate-400 text-sm">Receive important updates via email</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-green-600 text-green-400">
                    Enabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">SMS Alerts</div>
                    <div className="text-slate-400 text-sm">Critical alerts via text message</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    Disabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Load Updates</div>
                    <div className="text-slate-400 text-sm">Notifications for load status changes</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-green-600 text-green-400">
                    Enabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">HOS Violations</div>
                    <div className="text-slate-400 text-sm">Immediate alerts for compliance issues</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-green-600 text-green-400">
                    Enabled
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert Preferences */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertCircle className="h-5 w-5" />
                Alert Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-green-200 font-medium">Low Fuel Alert</div>
                      <div className="text-green-300 text-sm">Alert when fuel level drops below 25%</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="text-yellow-200 font-medium">Maintenance Reminder</div>
                      <div className="text-yellow-300 text-sm">Remind 500 miles before scheduled maintenance</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-blue-200 font-medium">Load Delivery</div>
                      <div className="text-blue-300 text-sm">Notify when loads are delivered successfully</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
