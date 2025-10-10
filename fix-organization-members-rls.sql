-- Fix RLS policies on organization_members table to allow members to see other members

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Members can read own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Owner or Dispatcher read organization_members" ON public.organization_members;

-- Create new policy: All organization members can read other members in the same organization
CREATE POLICY "Organization members can read all members in their org" ON public.organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organization_members.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Allow owners to manage (insert/update/delete) organization members
CREATE POLICY "Owners can manage organization members" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organization_members.organization_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

-- Allow system to insert new members (for invitations)
CREATE POLICY "System can insert new members" ON public.organization_members
  FOR INSERT WITH CHECK (true);

-- Founders can see all memberships (system admin)
CREATE POLICY "Founders can see all organization members" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND "isFounder" = 1
    )
  );

-- Verify the new policies
SELECT 'Updated organization_members policies:' as info;
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'organization_members'
ORDER BY policyname;
