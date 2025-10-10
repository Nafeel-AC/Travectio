-- Fix RLS policies for organizations table to allow reading org names for invitations

-- Check current policies
SELECT 'Current organizations RLS policies:' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'organizations' 
AND schemaname = 'public';

-- Add a policy to allow users to read organization names when they have a pending invitation
CREATE POLICY "Users can view org names for their invitations" ON public.organizations
FOR SELECT 
USING (
  -- Allow if user is a member of the organization
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
  OR
  -- Allow if user has a pending invitation to this organization
  EXISTS (
    SELECT 1 FROM public.invitations i
    JOIN public.users u ON LOWER(u.email) = LOWER(i.email)
    WHERE i.organization_id = organizations.id
    AND u.id = auth.uid()
    AND i.status = 'pending'
    AND i.expires_at > now()
  )
);

-- Verify the new policies
SELECT 'Updated organizations RLS policies:' as info;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'organizations' 
AND schemaname = 'public';
