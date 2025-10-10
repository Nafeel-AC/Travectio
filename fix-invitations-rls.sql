-- Fix RLS policies for invitations table to allow users to read invitations sent to their email

-- First check current policies
SELECT 'Current invitations RLS policies:' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'invitations' 
AND schemaname = 'public';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON public.invitations;
DROP POLICY IF EXISTS "Users can view own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Owners can manage invitations" ON public.invitations;

-- Create a policy that allows users to read invitations sent to their email
-- This is needed for the invitation acceptance flow
CREATE POLICY "Users can view invitations sent to their email" ON public.invitations
FOR SELECT 
USING (
  -- Allow if the invitation email matches the current user's email
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND LOWER(u.email) = LOWER(invitations.email)
  )
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

-- Allow owners to create invitations
CREATE POLICY "Owners can create invitations" ON public.invitations
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = invitations.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
    AND om.status = 'active'
  )
);

-- Allow system to update invitation status (for RPC functions)
CREATE POLICY "System can update invitations" ON public.invitations
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Verify the new policies
SELECT 'New invitations RLS policies:' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'invitations' 
AND schemaname = 'public';
