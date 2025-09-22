import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { supabase } from "@/lib/supabase";
import RouteGuard from "@/components/route-guard";

export default function BetaAccessPage() {
  const { isFounder } = useFounderAccess();
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [mutating, setMutating] = useState(false);

  async function refreshAllowlist() {
    if (!isFounder) return;
    setListLoading(true);
    try {
      const { data, error } = await supabase
        .from("beta_testers")
        .select("email")
        .order("email", { ascending: true });
      if (error) throw error;
      setAllowlist((data || []).map((r: any) => String(r.email)));
    } catch (e) {
      console.error("Failed to load beta_testers", e);
    } finally {
      setListLoading(false);
    }
  }

  async function addEmailsToAllowlist() {
    if (!emailInput.trim()) return;
    setMutating(true);
    try {
      const emails = emailInput
        .split(/[\n,]/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (emails.length === 0) return;
      const rows = emails.map((email) => ({ email, is_active: true }));
      const { error } = await supabase
        .from("beta_testers")
        .upsert(rows, { onConflict: "email" });
      if (error) throw error;
      setEmailInput("");
      await refreshAllowlist();
    } catch (e) {
      console.error("Failed to upsert beta_testers", e);
    } finally {
      setMutating(false);
    }
  }

  async function removeEmail(email: string) {
    setMutating(true);
    try {
      const { error } = await supabase
        .from("beta_testers")
        .delete()
        .eq("email", email);
      if (error) throw error;
      await refreshAllowlist();
    } catch (e) {
      console.error("Failed to delete from beta_testers", e);
    } finally {
      setMutating(false);
    }
  }

  useEffect(() => {
    if (isFounder) {
      refreshAllowlist();
    }
  }, [isFounder]);

  return (
    <RouteGuard requireFounder>
      <div className="container mx-auto p-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Beta Access Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emails" className="text-slate-300">
                Add Email Addresses
              </Label>
              <Input
                id="emails"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="user1@example.com, user2@example.com"
                className="bg-slate-900 text-white border-slate-700"
              />
              <p className="text-sm text-slate-400">
                Separate multiple emails with commas or new lines
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={!isFounder || mutating || !emailInput.trim()}
                onClick={addEmailsToAllowlist}
              >
                Add to Allowlist
              </Button>
              <Button
                variant="outline"
                className="text-white border-slate-600"
                disabled={listLoading}
                onClick={refreshAllowlist}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="h-4" />

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Current Allowlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              {listLoading ? (
                <div className="text-slate-400 p-4">Loading...</div>
              ) : allowlist.length === 0 ? (
                <div className="text-slate-500 p-4">No emails in allowlist yet</div>
              ) : (
                <div className="space-y-2">
                  {allowlist.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-900/40"
                    >
                      <span className="text-slate-200">{email}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={mutating}
                        onClick={() => removeEmail(email)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}




