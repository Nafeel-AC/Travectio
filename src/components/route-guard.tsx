import React from "react";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { useOrgRole } from "@/lib/org-role-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface RouteGuardProps {
  children: React.ReactNode;
  requireCustomer?: boolean;
  requireAdmin?: boolean;
  requireFounder?: boolean;
  requireOwner?: boolean;
  requireDispatcher?: boolean;
  requireDriver?: boolean;
}

export default function RouteGuard({
  children,
  requireCustomer = false,
  requireAdmin = false,
  requireFounder = false,
  requireOwner = false,
  requireDispatcher = false,
  requireDriver = false,
}: RouteGuardProps) {
  const { isFounder, isAdmin, isLoading } = useFounderAccess();
  const { role } = useOrgRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check access permissions
  const hasAccess = () => {
    if (requireFounder) return isFounder;
    if (requireAdmin) return isAdmin || isFounder;
    if (requireCustomer) return !isAdmin && !isFounder;
    if (requireOwner) return role === "owner" || isFounder;
    if (requireDispatcher) return role === "dispatcher" || role === "owner" || isFounder;
    if (requireDriver) return role === "driver" || isFounder; // founders bypass for testing
    return true; // No restrictions
  };

  if (!hasAccess()) {
    const getAccessMessage = () => {
      if (requireFounder) return "Founder access required";
      if (requireAdmin) return "Administrator access required";
      if (requireCustomer) return "This feature is for customer accounts only";
      if (requireOwner) return "Owner access required";
      if (requireDispatcher) return "Dispatcher access required";
      if (requireDriver) return "Driver access required";
      return "Access denied";
    };

    const getRedirectPath = () => {
      if (isFounder) return "/owner-dashboard";
      if (isAdmin) return "/admin-dashboard";
      return "/customer-dashboard";
    };

    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="bg-red-900/20 border-red-800">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-300">
              {getAccessMessage()}. You don't have permission to access this
              page.
            </p>
            <p className="text-slate-400 text-sm">
              Your current role:{" "}
              {isFounder ? "Founder" : isAdmin ? "Administrator" : "Customer"}
            </p>
            <Link href={getRedirectPath()}>
              <Button
                variant="outline"
                className="text-white border-slate-600 hover:bg-slate-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
