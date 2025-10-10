-- COMPLETELY REMOVE RLS from organization_members to stop infinite recursion
-- We'll handle access control at the application level instead

-- Disable RLS on organization_members table
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Active members can read team members" ON public.organization_members;
DROP POLICY IF EXISTS "Founders can see all memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can manage memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can read all org members" ON public.organization_members;
DROP POLICY IF EXISTS "System can insert memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can read own membership" ON public.organization_members;

-- Verify RLS is disabled
SELECT 'RLS Status for organization_members:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'organization_members';

-- Verify no policies exist
SELECT 'Remaining policies (should be empty):' as info;
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'organization_members';
