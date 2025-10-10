-- Fix invitation access for users who don't exist in users table yet
-- This is needed for the invitation acceptance flow

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.invitations;

-- Create a more permissive policy that allows authenticated users to read invitations
-- We'll rely on the RPC function to validate email match
CREATE POLICY "Authenticated users can view pending invitations" ON public.invitations
FOR SELECT 
USING (
  -- Allow authenticated users to read pending invitations
  -- The email validation will happen in the accept_invitation RPC function
  (auth.role() = 'authenticated' AND status = 'pending' AND expires_at > now())
  OR
  -- Allow organization owners to see all invitations for their org
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = invitations.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
    AND om.status = 'active'
  )
);

-- Verify the new policy
SELECT 'Updated invitations RLS policy:' as info;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'invitations' 
AND schemaname = 'public'
AND cmd = 'SELECT';
