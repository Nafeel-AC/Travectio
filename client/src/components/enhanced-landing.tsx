import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  TrendingUp, 
  Calculator, 
  Fuel, 
  Clock, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Users
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description: "Track your fleet performance with live cost per mile, profit margins, and operational insights.",
    highlight: "Up to 15% cost savings"
  },
  {
    icon: Calculator,
    title: "Smart Load Calculator",
    description: "Calculate load profitability instantly with automated deadhead miles and true operational costs.",
    highlight: "Automated calculations"
  },
  {
    icon: Fuel,
    title: "Fuel Management",
    description: "Monitor fuel purchases, calculate accurate MPG, and track fuel efficiency across your fleet.",
    highlight: "Precise MPG tracking"
  },
  {
    icon: Truck,
    title: "Fleet Optimization",
    description: "Comprehensive truck management with detailed cost breakdown and driver assignments.",
    highlight: "Complete fleet control"
  },
  {
    icon: Clock,
    title: "HOS Compliance",
    description: "Automated Hours of Service tracking to ensure regulatory compliance and driver safety.",
    highlight: "100% compliant"
  },
  {
    icon: BarChart3,
    title: "Cross-Tab Sync",
    description: "Real-time data synchronization across all dashboard tabs for instant metric updates.",
    highlight: "Instant updates"
  }
];

const benefits = [
  "Increase profit margins by 10-15%",
  "Reduce administrative time by 60%",
  "Ensure 100% HOS compliance",
  "Real-time operational insights",
  "Automated cost calculations",
  "Smart load recommendations"
];

export default function EnhancedLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Travectio</h1>
                <p className="text-xs text-muted-foreground">Professional Fleet Solutions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="hidden sm:flex">
                <Sparkles className="h-3 w-3 mr-1" />
                Enterprise Ready
              </Badge>
              <a href="/api/login">
                <Button>
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4">
                <Zap className="h-3 w-3 mr-1" />
                Industry Leading Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Transform Your Fleet
                <span className="gradient-text block">Into a Profit Machine</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The most advanced fleet management platform designed specifically for trucking companies. 
                Maximize profits, ensure compliance, and scale your operations with intelligent automation.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/api/login">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </a>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                <Users className="h-5 w-5 mr-2" />
                Schedule Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 pt-8 opacity-60">
              <div className="text-sm font-medium">Trusted by 500+ fleets</div>
              <div className="text-sm font-medium">⭐ 4.9/5 rating</div>
              <div className="text-sm font-medium">🏆 Industry leading</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Fleet Operators Choose Travectio</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the difference with proven results and industry-leading features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Fleet Management Suite</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every tool you need to run a profitable, compliant, and efficient trucking operation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                        <IconComponent className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.highlight}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Maximize Your Fleet's Potential?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join hundreds of successful fleet operators who trust Travectio to optimize their operations, 
                increase profits, and scale their business efficiently.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/login">
                <Button size="lg" className="text-lg px-8 py-3">
                  <Shield className="h-5 w-5 mr-2" />
                  Start Your Free Trial
                </Button>
              </a>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-3"
                onClick={() => window.open('mailto:rrivera@travectiosolutions.com?subject=Fleet Management Solutions Inquiry&body=Hello,%0A%0AI am interested in learning more about Travectio Fleet Management Solutions for my business.%0A%0APlease contact me to schedule a demo.%0A%0AThanks!', '_blank')}
              >
                Contact Sales Team
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <div>No credit card required • Full access • Cancel anytime</div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs">
                <span>Questions? Contact us:</span>
                <a 
                  href="mailto:rrivera@travectiosolutions.com" 
                  className="text-primary hover:underline"
                >
                  rrivera@travectiosolutions.com
                </a>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() => window.open('https://calendly.com/travectio-solutions/fleet-management-demo', '_blank')}
                >
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Truck className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-bold gradient-text">Travectio Solutions</div>
                  <div className="text-xs text-muted-foreground">Professional Fleet Management</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Revolutionizing the way the world moves with intelligent fleet management solutions.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Contact Information</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Email:</span>
                  <a 
                    href="mailto:rrivera@travectiosolutions.com" 
                    className="ml-2 text-primary hover:underline"
                  >
                    rrivera@travectiosolutions.com
                  </a>
                </div>
                <div>
                  <span className="font-medium">Sales:</span>
                  <button 
                    onClick={() => window.open('mailto:rrivera@travectiosolutions.com?subject=Sales Inquiry - Fleet Management Solutions', '_blank')}
                    className="ml-2 text-primary hover:underline"
                  >
                    Contact Sales Team
                  </button>
                </div>
                <div>
                  <span className="font-medium">Demo:</span>
                  <button 
                    onClick={() => window.open('https://calendly.com/travectio-solutions/fleet-management-demo', '_blank')}
                    className="ml-2 text-primary hover:underline"
                  >
                    Schedule a Demo
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Quick Start</h4>
              <div className="space-y-2">
                <a href="/api/login">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Start Free Trial
                  </Button>
                </a>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => window.open('mailto:rrivera@travectiosolutions.com?subject=Fleet Management Solutions Demo Request', '_blank')}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Request Demo
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
              <div>© 2025 Travectio Solutions. All rights reserved.</div>
              <div className="mt-2 md:mt-0">
                Contact: <a href="mailto:rrivera@travectiosolutions.com" className="text-primary hover:underline">rrivera@travectiosolutions.com</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}