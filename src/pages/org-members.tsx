import { useEffect, useState } from "react";
import { useOrgRole } from "@/lib/org-role-context";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function OrgMembersPage() {
  const { activeOrgId, role, refresh } = useOrgRole();
  const { toast } = useToast();
  const [members, setMembers] = useState<Array<{ id: string; email: string; role: string; firstName?: string; lastName?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'dispatcher'|'driver'>('dispatcher');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeOrgId) { setLoading(false); return; }
      setLoading(true);
      
      try {
        // Get organization members first (without nested select to avoid RLS issues)
        const { data: membershipData, error: membersError } = await supabase
          .from('organization_members')
          .select('id, role, status, user_id')
          .eq('organization_id', activeOrgId)
          .eq('status', 'active');

        if (membersError) throw membersError;

        // Then get user details separately for each member
        const membersWithUsers = [];
        if (membershipData) {
          for (const membership of membershipData) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, email, firstName, lastName')
              .eq('id', membership.user_id)
              .single();
            
            membersWithUsers.push({
              id: membership.id,
              email: userData?.email || '—',
              role: membership.role,
              firstName: userData?.firstName,
              lastName: userData?.lastName
            });
          }
        }
        
        setMembers(membersWithUsers);
      } catch (error) {
        console.error('Failed to load members:', error);
        setMembers([]);
      }
      
      setLoading(false);
    };
    load();
  }, [activeOrgId]);

  const sendInvite = async () => {
    if (!inviteEmail || !activeOrgId) return;
    
    setSendingInvite(true);
    try {
      // Create invitation in database
      const { data: inviteData, error: inviteError } = await supabase
        .rpc('create_invitation', {
          p_org_id: activeOrgId,
          p_email: inviteEmail,
          p_role: inviteRole
        });

      if (inviteError) throw inviteError;

      // Get current user info for email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get organization name
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', activeOrgId)
        .single();

      // Send email via Edge Function
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dynamic-action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inviteEmail,
          token: inviteData[0].token,
          orgName: orgData?.name || 'Organization',
          inviterName: user.user_metadata?.full_name || user.email,
          inviterEmail: user.email
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail}`,
      });

      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole('dispatcher');
    } catch (error: any) {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Organization Members</h1>
        {role === 'owner' && (
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full" onClick={()=>setInviteOpen(true)}>Invite Member</Button>
        )}
      </div>
      <Card className="rounded-2xl border-slate-700/70 bg-slate-900/60 shadow-xl">
        <CardHeader className="rounded-t-2xl border-b border-slate-700/60 pb-4">
          <CardTitle className="text-white">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-slate-400">Loading…</div>
          ) : (
            <div className="space-y-3">
              {members.map(m => {
                const isOwner = m.role === 'owner';
                const displayName = m.firstName && m.lastName 
                  ? `${m.firstName} ${m.lastName}` 
                  : m.email?.split('@')[0] || 'Unknown User';
                
                return (
                  <div key={m.id} className={`flex items-center justify-between rounded-xl px-5 py-4 transition ${
                    isOwner 
                      ? 'bg-blue-50/60 dark:bg-blue-950/20 border border-blue-500/60 hover:ring-1 hover:ring-blue-400/60' 
                      : 'bg-slate-800/80 border border-slate-700 hover:ring-1 hover:ring-slate-600'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shadow ${
                        isOwner ? 'bg-blue-600 text-white ring-2 ring-blue-300/40' : 
                        m.role === 'dispatcher' ? 'bg-green-100 text-green-700 ring-2 ring-green-300/30' : 
                        'bg-gray-100 text-gray-700 ring-2 ring-gray-300/30'
                      }`}>
                        {isOwner ? '👑' : m.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={`font-medium ${isOwner ? 'text-blue-700 dark:text-blue-300' : 'text-slate-200'}`}>
                          {displayName}
                        </div>
                        <div className={`text-sm ${isOwner ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                          {m.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium shadow ${
                        isOwner ? 'bg-blue-600 text-white' :
                        m.role === 'dispatcher' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {isOwner && '👑 '}
                        {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {members.length === 0 && (
                <div className="text-slate-400">No members yet.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-slate-900/95 border border-slate-700 rounded-2xl p-5 shadow-2xl">
            <div className="text-lg font-semibold text-white mb-2">Invite Member</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-300 mb-1">Email</div>
                <Input value={inviteEmail} onChange={(e)=>setInviteEmail(e.target.value)} placeholder="user@company.com" />
              </div>
              <div>
                <div className="text-xs text-slate-300 mb-1">Role</div>
                <select className="w-full bg-slate-900 text-slate-200 text-sm p-2 rounded-xl border border-slate-700" value={inviteRole} onChange={(e)=>setInviteRole(e.target.value as any)}>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" className="rounded-full" onClick={()=>setInviteOpen(false)} disabled={sendingInvite}>Cancel</Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 rounded-full" 
                  onClick={sendInvite}
                  disabled={sendingInvite || !inviteEmail}
                >
                  {sendingInvite ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


