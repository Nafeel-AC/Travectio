import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { supabase } from "@/lib/supabase";
import RouteGuard from "@/components/route-guard";

interface BetaInviteRow {
  id: string;
  email: string;
  token: string;
  invited_by: string | null;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

export default function BetaInvitesPage() {
  const { isAdmin, isFounder } = useFounderAccess();
  const [emailsText, setEmailsText] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<BetaInviteRow[]>([]);

  const canManage = useMemo(() => isAdmin || isFounder, [isAdmin, isFounder]);

  const edgeUrl = (name: string) => {
    const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
    return `${base}/functions/v1/${name}`;
  };

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token || "";
      const res = await fetch(edgeUrl("beta-invites") + "?action=list", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load invites");
      setInvites(json.invites || []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInvites();
  }, []);

  const createInvites = async () => {
    const emails = emailsText
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return;
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token || "";
      const res = await fetch(edgeUrl("beta-invites") + "?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ emails, expiresAt: expiresAt || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create invites");
      setEmailsText("");
      await fetchInvites();
    } catch (e) {
      // noop: could show toast
    } finally {
      setLoading(false);
    }
  };

  const revokeInvite = async (id: string) => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token || "";
      const res = await fetch(edgeUrl("beta-invites") + "?action=revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to revoke invite");
      await fetchInvites();
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const origin = window.location.origin;
    const link = `${origin}/invite?token=${token}`;
    await navigator.clipboard.writeText(link);
  };

  return (
    <RouteGuard requireAdmin>
      <div className="container mx-auto p-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Beta Invites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="emails" className="text-slate-300">Emails (comma or new line)</Label>
                <Input id="emails" value={emailsText} onChange={(e) => setEmailsText(e.target.value)} placeholder="alice@example.com, bob@acme.com" className="bg-slate-900 text-white border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires" className="text-slate-300">Expiration (optional)</Label>
                <Input id="expires" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="bg-slate-900 text-white border-slate-700" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button disabled={!canManage || loading} onClick={createInvites}>Send invites</Button>
              <Button variant="outline" className="text-white border-slate-600" disabled={loading} onClick={fetchInvites}>Refresh</Button>
            </div>
          </CardContent>
        </Card>

        <div className="h-4" />

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Expires</th>
                    <th className="text-left p-2">Used</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  {invites.map((inv) => (
                    <tr key={inv.id} className="border-t border-slate-700">
                      <td className="p-2">{inv.email}</td>
                      <td className="p-2">{inv.expires_at ? new Date(inv.expires_at).toLocaleString() : "—"}</td>
                      <td className="p-2">{inv.used_at ? new Date(inv.used_at).toLocaleString() : "No"}</td>
                      <td className="p-2 flex gap-2">
                        <Button variant="outline" className="text-white border-slate-600" onClick={() => copyInviteLink(inv.token)}>Copy link</Button>
                        {!inv.used_at && (
                          <Button variant="destructive" onClick={() => revokeInvite(inv.id)}>Revoke</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}


