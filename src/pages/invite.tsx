import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";

export default function InviteRedeemPage() {
  const [status, setStatus] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [token, setToken] = React.useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("token") || "";
    setToken(t);
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
    });
  }, []);

  const redeem = async () => {
    if (!token) {
      setStatus("Missing token");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token || "";
      if (!accessToken) {
        setStatus("Please sign in first");
        return;
      }
      const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
      const res = await fetch(`${base}/functions/v1/redeem-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Redeem failed");
      setStatus("Invite redeemed. You now have beta access.");
    } catch (e: any) {
      setStatus(e.message || "Redeem failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-xl">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Beta Invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300">Click the button below to redeem your beta invite.</p>
          {!isAuthenticated && (
            <p className="text-amber-300">You need to sign in with the invited email before redeeming.</p>
          )}
          <div className="flex gap-2">
            <Button disabled={loading || !token || !isAuthenticated} onClick={redeem}>
              {loading ? "Redeeming…" : "Redeem Invite"}
            </Button>
            {!isAuthenticated && (
              <Link href="/">
                <Button variant="outline" className="text-white border-slate-600">Go to Sign In</Button>
              </Link>
            )}
          </div>
          {status && <div className="text-slate-200">{status}</div>}
        </CardContent>
      </Card>
    </div>
  );
}


