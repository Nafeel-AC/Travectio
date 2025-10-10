-- Fix infinite recursion in organization_members RLS policy
-- The issue is likely a circular reference in the policy logic

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Organization members can see all members in their org" ON public.organization_members;
DROP POLICY IF EXISTS "Read own or owner memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Owner delete memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Owner insert memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Owner update memberships" ON public.organization_members;

-- Create simple, non-recursive policies
-- 1. Users can read their own membership
CREATE POLICY "Users can read own membership" ON public.organization_members
  FOR SELECT USING (user_id = auth.uid());

-- 2. Users can read other members in organizations where they are owners
CREATE POLICY "Owners can read all org members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner' 
      AND status = 'active'
    )
  );

-- 3. Users can read other members in organizations where they are active members (non-recursive)
CREATE POLICY "Active members can read team members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT DISTINCT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- 4. Owners can manage memberships
CREATE POLICY "Owners can manage memberships" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner' 
      AND status = 'active'
    )
  );

-- 5. System can insert new memberships (for invitations)
CREATE POLICY "System can insert memberships" ON public.organization_members
  FOR INSERT WITH CHECK (true);

-- 6. Founders can see everything
CREATE POLICY "Founders can see all memberships" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND "isFounder" = 1
    )
  );

-- Verify policies
SELECT 'Updated organization_members policies:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'organization_members';
