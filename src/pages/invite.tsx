import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useOrgRole } from "@/lib/org-role-context";

export default function InviteRedeemPage() {
  const { toast } = useToast();
  const { refresh } = useOrgRole();
  const [status, setStatus] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [token, setToken] = React.useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [inviteInfo, setInviteInfo] = React.useState<{orgName: string, role: string} | null>(null);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("token") || "";
    setToken(t);
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
    });

    // Load invite info if token exists
    if (t) {
      loadInviteInfo(t);
    }
  }, []);

  const loadInviteInfo = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          organizations(name),
          role,
          status,
          expires_at
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        setStatus("Invalid or expired invitation");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setStatus("Invitation has expired");
        return;
      }

      setInviteInfo({
        orgName: (data.organizations as any).name,
        role: data.role
      });
    } catch (error) {
      setStatus("Failed to load invitation details");
    }
  };

  const acceptInvite = async () => {
    if (!token) {
      setStatus("Missing token");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        p_token: token
      });

      if (error) throw error;

      toast({
        title: "Invitation accepted!",
        description: `You've been added to ${inviteInfo?.orgName} as a ${inviteInfo?.role}.`,
      });

      setStatus("Invitation accepted successfully! Redirecting...");
      
      // Refresh org-role context to load new membership and role
      await refresh();
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (e: any) {
      setStatus(e.message || "Failed to accept invitation");
      toast({
        title: "Failed to accept invitation",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    // Store the invite token in localStorage so it can be used after sign-up
    if (token) {
      localStorage.setItem('pendingInviteToken', token);
    }
    // Redirect to sign-up page
    window.location.href = '/auth/signup';
  };

  const handleSignIn = () => {
    // Store the invite token in localStorage so it can be used after sign-in
    if (token) {
      localStorage.setItem('pendingInviteToken', token);
    }
    // Redirect to sign-in page
    window.location.href = '/auth/signin';
  };

  return (
    <div className="container mx-auto p-6 max-w-xl">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            {inviteInfo ? `Invitation to ${inviteInfo.orgName}` : "Organization Invitation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteInfo ? (
            <>
              <p className="text-slate-300">
                You've been invited to join <strong>{inviteInfo.orgName}</strong> as a <strong>{inviteInfo.role}</strong>.
              </p>
              {!isAuthenticated && (
                <div className="space-y-3">
                  <p className="text-amber-300">You need to sign in with the invited email before accepting.</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSignUp}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Sign Up
                    </Button>
                    <Button 
                      onClick={handleSignIn}
                      variant="outline" 
                      className="text-white border-slate-600"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
              {isAuthenticated && (
                <div className="flex gap-2">
                  <Button 
                    disabled={loading || !token} 
                    onClick={acceptInvite}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Accepting..." : "Accept Invitation"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-300">Loading invitation details...</p>
          )}
          {status && <div className="text-slate-200">{status}</div>}
        </CardContent>
      </Card>
    </div>
  );
}


