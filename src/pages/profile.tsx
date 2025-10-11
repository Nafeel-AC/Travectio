import { useEffect, useState } from "react";
import { useAuth, useAccountDeletion } from "@/hooks/useSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, User, Shield, Calendar, Mail, Building, Users, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User as UserType } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { useOrgRole } from "@/lib/org-role-context";
import { OrgDriverService } from "@/lib/org-supabase-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { user, loading } = useAuth();
  const { deleteAccount, isDeleting } = useAccountDeletion();
  const { refresh, memberships, activeOrgId, role } = useOrgRole();
  
  const { toast } = useToast();
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [userRow, setUserRow] = useState<any | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [truckCount, setTruckCount] = useState<number>(1);
  const [subscribing, setSubscribing] = useState(false);
  // Driver self-onboarding fields (merged card)
  const [driverName, setDriverName] = useState("");
  const [driverCdl, setDriverCdl] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  
  // Organization data state
  const [orgDetails, setOrgDetails] = useState<any>(null);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [loadingOrgData, setLoadingOrgData] = useState(false);

  // Cast the Supabase user to our custom User type
  const userProfile = user as unknown as UserType;

  // Load organization details and members
  const loadOrganizationData = async () => {
    if (!activeOrgId || !user?.id) return;
    
    setLoadingOrgData(true);
    try {
      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', activeOrgId)
        .single();

      if (orgError) throw orgError;
      setOrgDetails(org);

      // Get organization members first (without nested select to avoid RLS issues)
      const { data: membershipData, error: membersError } = await supabase
        .from('organization_members')
        .select('id, role, status, created_at, user_id')
        .eq('organization_id', activeOrgId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;

      // Then get user details separately for each member
      const members = [];
      if (membershipData) {
        for (const membership of membershipData) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, firstName, lastName')
            .eq('id', membership.user_id)
            .single();
          
          members.push({
            ...membership,
            users: userData
          });
        }
      }

      console.log('Raw members data:', members);
      if (membersError) {
        console.error('Members error:', membersError);
        throw membersError;
      }
      setOrgMembers(members || []);
      
    } catch (error: any) {
      console.error('Failed to load organization data:', error);
      toast({
        title: "Failed to load organization data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingOrgData(false);
    }
  };

  // Load latest user row from DB and initialize edit fields
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', (user as any).id)
        .maybeSingle();
      setUserRow(data || null);
      setFirstName((data as any)?.firstName || "");
      setLastName((data as any)?.lastName || "");
      setCompany((data as any)?.company || "");
      setTitle((data as any)?.title || "");
      setPhone((data as any)?.phone || "");
      // Initialize merged driver fields from user when available
      const computedFullName = [((data as any)?.firstName || '').trim(), ((data as any)?.lastName || '').trim()].filter(Boolean).join(' ');
      if (computedFullName) setDriverName(computedFullName);
      if ((data as any)?.phone) setDriverPhone((data as any)?.phone);
    };
    load();
  }, [userProfile?.id]);

  const saveDriverProfile = async () => {
    if (!user?.id) return;
    try {
      const { data: existing } = await supabase
        .from('drivers')
        .select('id')
        .eq('userId', (user as any).id)
        .maybeSingle();

      if (existing?.id) {
        await OrgDriverService.updateDriver(existing.id, {
          name: driverName,
          cdlNumber: driverCdl,
          phoneNumber: driverPhone,
          email: (user as any).email,
        });
      } else {
        await OrgDriverService.createDriver({
          userId: (user as any).id,
          name: driverName,
          cdlNumber: driverCdl,
          phoneNumber: driverPhone,
          email: (user as any).email,
          status: 'active'
        });
      }
      // Also sync "users" profile first/last/phone from merged card
      const [first, ...rest] = driverName.trim().split(' ');
      const last = rest.join(' ');
      await supabase
        .from('users')
        .update({ firstName: first || null, lastName: last || null, phone: driverPhone || null })
        .eq('id', (user as any).id);

      toast({ title: 'Driver profile saved', description: 'Your driver and account details were updated.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  // Load organization data when activeOrgId changes
  useEffect(() => {
    loadOrganizationData();
  }, [activeOrgId, user]);

  const createOrganization = async () => {
    if (!orgName.trim()) {
      toast({ title: 'Name required', description: 'Please enter an organization name.', variant: 'destructive' });
      return;
    }
    try {
      setCreatingOrg(true);
      const { data, error } = await supabase.rpc('create_organization', { p_name: orgName.trim() });
      if (error) throw error;
      await refresh();
      setOrgName("");
      toast({ title: 'Organization created', description: 'You are now the owner. Subscribe from Pricing to unlock features.' });
    } catch (e: any) {
      toast({ title: 'Creation failed', description: e?.message || 'Could not create organization', variant: 'destructive' });
    } finally {
      setCreatingOrg(false);
    }
  };

  const startSubscription = async () => {
    try {
      if (!activeOrgId && memberships.length === 0) {
        toast({ title: 'Create an organization first', description: 'You need an organization before subscribing.', variant: 'destructive' });
        return;
      }
      setSubscribing(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${(supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: 'per-truck', truckCount }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to start checkout');
      }
      const { url } = await resp.json();
      if (url) {
        window.location.href = url;
      }
    } catch (e: any) {
      toast({ title: 'Checkout failed', description: e?.message || 'Could not create checkout session', variant: 'destructive' });
    } finally {
      setSubscribing(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('users')
        .update({
          firstName: firstName || null,
          lastName: lastName || null,
          company: company || null,
          title: title || null,
          phone: phone || null,
          updatedAt: new Date().toISOString()
        })
        .eq('id', (user as any).id);
      if (error) throw error;
      // Refresh local view from DB to persist across reloads
      const { data: refreshed } = await supabase
        .from('users')
        .select('*')
        .eq('id', (user as any).id)
        .maybeSingle();
      setUserRow(refreshed || null);
      toast({ title: 'Profile updated', description: 'Your profile information was saved.' });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Could not save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Early returns AFTER hooks are declared to keep hook order stable
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Please log in to view your profile.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    if (!deleteReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for account deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteAccount(deleteReason);
    } catch (error) {
      // Error is already handled by the hook
      console.error('Account deletion error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        </div>

        {role === 'driver' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Driver Profile</CardTitle>
              <CardDescription>Provide your required driver and account details once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Enter your full name" />
                </div>
                <div className="space-y-2">
                  <Label>CDL Number</Label>
                  <Input value={driverCdl} onChange={(e) => setDriverCdl(e.target.value)} placeholder="CDL-XXXXXXXXXX" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={(user as any)?.email || ''} disabled />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveDriverProfile}>Save</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Information Card - hidden for drivers (merged above) */}
        {role !== 'driver' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and status information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input value={userProfile?.email || "Not provided"} disabled />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <Input 
                  value={userRow?.createdAt ? new Date(userRow.createdAt).toLocaleDateString() : "Unknown"} 
                  disabled 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Full Name</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="First Name" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input 
                  placeholder="Last Name" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Company</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Account Status:
              </Label>
              <div className="flex gap-2">
                {userRow?.isFounder === 1 && (
                  <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600">
                    Founder
                  </Badge>
                )}
                {userRow?.isAdmin === 1 && (
                  <Badge variant="secondary">
                    Admin
                  </Badge>
                )}
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Organization Information Card */}
        {activeOrgId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Your organization details, role, and team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingOrgData ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-20 bg-slate-200 rounded"></div>
                </div>
              ) : (
                <>
                  {/* Organization Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Organization Name
                      </Label>
                      <Input value={orgDetails?.name || "Loading..."} disabled />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Your Role
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input value={role || "Loading..."} disabled />
                        <Badge variant={role === 'owner' ? 'default' : role === 'dispatcher' ? 'secondary' : 'outline'}>
                          {role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                          {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Loading...'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Organization Members */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Members ({orgMembers.length})
                      </Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadOrganizationData}
                        disabled={loadingOrgData}
                      >
                        {loadingOrgData ? 'Loading...' : 'Refresh'}
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg divide-y">
                      {orgMembers.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">
                          No team members found
                        </div>
                      ) : (
                        // Sort members to show owner first
                        [...orgMembers].sort((a, b) => {
                          if (a.role === 'owner') return -1;
                          if (b.role === 'owner') return 1;
                          return 0;
                        }).map((member: any) => {
                          const isOwner = member.role === 'owner';
                          const isCurrentUser = member.users?.id === user?.id;
                          
                          return (
                            <div key={member.id} className={`p-4 flex items-center justify-between ${
                              isOwner ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500' : ''
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isOwner ? 'bg-blue-600 text-white' : 
                                  member.role === 'dispatcher' ? 'bg-green-100 text-green-700' : 
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {isOwner && <Crown className="h-4 w-4" />}
                                  {!isOwner && (member.users?.email?.charAt(0).toUpperCase() || '?')}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isOwner ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                                      {member.users?.firstName && member.users?.lastName 
                                        ? `${member.users.firstName} ${member.users.lastName}`
                                        : member.users?.email?.split('@')[0] || 'Unknown User'
                                      }
                                    </span>
                                    {isCurrentUser && (
                                      <Badge variant="outline" className="text-xs">You</Badge>
                                    )}
                                    {isOwner && (
                                      <Badge variant="default" className="text-xs bg-blue-600">Organization Owner</Badge>
                                    )}
                                  </div>
                                  <div className={`text-sm ${isOwner ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                                    {member.users?.email || 'No email'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  isOwner ? 'default' : 
                                  member.role === 'dispatcher' ? 'secondary' : 
                                  'outline'
                                } className={isOwner ? 'bg-blue-600' : ''}>
                                  {isOwner && <Crown className="h-3 w-3 mr-1" />}
                                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {new Date(member.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account Management Card - Visible to owners or users without organizations */}
        {(role === 'owner' || !activeOrgId) && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Management
            </CardTitle>
            <CardDescription>
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create Organization (no subscription required) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Create Organization</Label>
              <div className="flex gap-2">
                <Input placeholder="Organization name" value={orgName} onChange={(e)=>setOrgName(e.target.value)} />
                <Button onClick={createOrganization} disabled={creatingOrg} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {creatingOrg ? 'Creating...' : 'Create'}
                </Button>
              </div>
              <p className="text-xs text-slate-400">Create your organization first. You can subscribe after.</p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Data Privacy:</strong> Your fleet data is private and only visible to you. 
                Only the system founder can view aggregated system metrics for platform management.
              </p>
            </div>
          </CardContent>
        </Card>
        )}

        <Separator />

        {/* Account Deletion Card - Visible to owners or users without organizations */}
        {(role === 'owner' || !activeOrgId) && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Account Deletion
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                What happens when you delete your account:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• All your fleet data (trucks, loads, drivers) will be permanently deleted</li>
                <li>• Your account access will be immediately revoked</li>
                <li>• This action cannot be undone</li>
                <li>• You will need to create a new account to use the service again</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deleteReason">Reason for leaving (optional)</Label>
                <Textarea
                  id="deleteReason"
                  placeholder="Help us improve by telling us why you're leaving..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    disabled={isDeleting}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting Account..." : "Delete My Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Confirm Account Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>
                        This will permanently delete your account and all associated data. 
                        This action cannot be undone.
                      </p>
                      
                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
                          Type "DELETE" to confirm:
                        </Label>
                        <Input
                          id="deleteConfirmation"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                          className="font-mono"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}