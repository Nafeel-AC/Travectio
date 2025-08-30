import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building2, 
  Users, 
  Truck, 
  Crown, 
  CheckCircle2,
  ArrowRight,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  name: string;
  type: 'owner-operator' | 'small-fleet' | 'medium-fleet' | 'enterprise';
  description: string;
  truckCount: string;
  features: string[];
  isPremium?: boolean;
  isActive?: boolean;
}

const profileTypes: Profile[] = [
  {
    id: 'owner-operator',
    name: 'Owner Operator',
    type: 'owner-operator',
    description: 'Perfect for individual truck owners managing their own operations',
    truckCount: '1 truck',
    features: [
      'Individual truck management',
      'Load profitability calculator',
      'Fuel tracking and MPG analysis', 
      'HOS compliance monitoring',
      'Basic analytics and reporting'
    ]
  },
  {
    id: 'small-fleet',
    name: 'Small Fleet',
    type: 'small-fleet',
    description: 'Ideal for growing operations with 2-10 trucks',
    truckCount: '2-10 trucks',
    features: [
      'Multi-truck fleet management',
      'Driver assignment and tracking',
      'Advanced load matching',
      'Cross-fleet analytics',
      'Cost comparison tools'
    ],
    isPremium: true
  },
  {
    id: 'medium-fleet',
    name: 'Medium Fleet',
    type: 'medium-fleet', 
    description: 'Comprehensive solution for established fleets with 11-50 trucks',
    truckCount: '11-50 trucks',
    features: [
      'Enterprise fleet dashboard',
      'Multi-driver management',
      'Advanced route optimization',
      'Bulk operations support',
      'Custom reporting suite'
    ],
    isPremium: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Fleet',
    type: 'enterprise',
    description: 'Full-scale solution for large operations with 50+ trucks',
    truckCount: '50+ trucks',
    features: [
      'White-label customization',
      'API integrations',
      'Multi-location support',
      'Advanced compliance tools',
      'Dedicated account manager'
    ],
    isPremium: true
  }
];

export default function ProfileSelector() {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId);
    // Here you would typically save the profile selection to the backend
  };

  const handleContinue = () => {
    // Navigate to the main dashboard with the selected profile
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src={(user as any)?.profileImageUrl || ""} alt={(user as any)?.firstName || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <h1 className="text-2xl font-bold">
                Welcome to Travectio, {(user as any)?.firstName || 'Fleet Manager'}!
              </h1>
              <p className="text-muted-foreground">
                Let's set up your profile to customize your experience
              </p>
            </div>
          </div>
        </div>

        {/* Profile Selection */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Choose Your Fleet Profile</h2>
            <p className="text-muted-foreground">Select the option that best describes your operation</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {profileTypes.map((profile) => (
              <Card 
                key={profile.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  selectedProfile === profile.id 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleProfileSelect(profile.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {profile.type === 'owner-operator' && <Truck className="h-6 w-6 text-primary" />}
                        {profile.type === 'small-fleet' && <Users className="h-6 w-6 text-primary" />}
                        {profile.type === 'medium-fleet' && <Building2 className="h-6 w-6 text-primary" />}
                        {profile.type === 'enterprise' && <Crown className="h-6 w-6 text-primary" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{profile.name}</CardTitle>
                        <CardDescription className="font-medium text-primary">
                          {profile.truckCount}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {profile.isPremium && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <Crown className="h-3 w-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                      {selectedProfile === profile.id && (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {profile.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Key Features:</h4>
                    <ul className="space-y-2">
                      {profile.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {profile.features.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{profile.features.length - 3} more features
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 pt-6">
          <Button 
            size="lg" 
            onClick={handleContinue}
            disabled={!selectedProfile}
            className="px-8"
          >
            Continue to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Custom Setup
          </Button>
        </div>
        
        {selectedProfile && (
          <div className="text-center text-sm text-muted-foreground">
            You can change your profile type anytime in settings
          </div>
        )}
      </div>
    </div>
  );
}