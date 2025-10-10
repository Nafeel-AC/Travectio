-- Fix the SELECT policy on organization_members to allow team visibility

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Read own or owner memberships" ON public.organization_members;

-- Create a new policy that allows all organization members to see other members in their org
CREATE POLICY "Organization members can see all members in their org" ON public.organization_members
  FOR SELECT USING (
    -- User can see members if they are also a member of the same organization
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organization_members.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Verify the updated policy
SELECT 'Updated SELECT policy:' as info;
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'organization_members'
AND cmd = 'SELECT';
