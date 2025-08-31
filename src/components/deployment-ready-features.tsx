import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Rocket, Shield, Users, Globe, Zap, BarChart3 } from "lucide-react";

const deploymentFeatures = [
  {
    category: "Multi-Profile Architecture",
    icon: Users,
    features: [
      "Owner Operator profile (1 truck)",
      "Small Fleet profile (2-10 trucks)", 
      "Medium Fleet profile (11-50 trucks)",
      "Enterprise profile (50+ trucks)",
      "Profile-specific feature sets",
      "Scalable user experience"
    ]
  },
  {
    category: "Cross-Platform Compatibility",
    icon: Globe,
    features: [
      "Responsive design for all devices",
      "PWA-compatible architecture",
      "Cross-browser compatibility",
      "Mobile-optimized interface",
      "Tablet-friendly layouts",
      "Desktop professional experience"
    ]
  },
  {
    category: "Enterprise Security",
    icon: Shield,
    features: [
      "OpenID Connect authentication",
      "Secure session management",
      "Role-based access control",
      "Data encryption at rest",
      "Secure API endpoints",
      "Compliance-ready logging"
    ]
  },
  {
    category: "Performance Optimization",
    icon: Zap,
    features: [
      "Real-time data synchronization",
      "Optimized query performance",
      "Efficient caching strategies",
      "Minimal API calls",
      "Fast load times",
      "Smooth user interactions"
    ]
  },
  {
    category: "Advanced Analytics",
    icon: BarChart3,
    features: [
      "Real-time cost per mile tracking",
      "Accurate profit margin calculations",
      "Comprehensive fleet metrics",
      "Cross-tab data consistency",
      "Automated calculations",
      "Historical trend analysis"
    ]
  },
  {
    category: "Launch Readiness",
    icon: Rocket,
    features: [
      "Production-ready codebase",
      "Comprehensive error handling",
      "User-friendly onboarding",
      "Professional visual design",
      "Streamlined workflows",
      "Multi-tenant architecture"
    ]
  }
];

export default function DeploymentReadyFeatures() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold gradient-text">Travectio Solutions</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Enterprise-grade fleet management platform ready for multi-profile deployment across all Travectio Solutions accounts
        </p>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Deployment Ready
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {deploymentFeatures.map((category, index) => {
          const IconComponent = category.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready for Production Deployment</h2>
          <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
            Travectio Solutions is now fully optimized for deployment across multiple user profiles. 
            The platform provides a comprehensive fleet management experience with enterprise-grade security, 
            performance, and user experience suitable for trucking operations of all sizes.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Feature Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Multi</div>
              <div className="text-sm text-muted-foreground">Profile Support</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Enterprise</div>
              <div className="text-sm text-muted-foreground">Grade Security</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Launch</div>
              <div className="text-sm text-muted-foreground">Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}