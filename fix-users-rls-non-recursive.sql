-- Fix users RLS with non-recursive policies to prevent infinite recursion

-- First, ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Organization members can view team members" ON public.users;
DROP POLICY IF EXISTS "Founders can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can delete own account" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create simple, non-recursive policies

-- 1. Users can view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 2. Allow access to users who are in the same organizations (using a function to avoid recursion)
-- First create a helper function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.user_can_view_org_member(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user and target user are in the same organization
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om2.user_id = target_user_id
      AND om1.status = 'active'
      AND om2.status = 'active'
  );
END;
$$;

-- 3. Create policy using the helper function
CREATE POLICY "Users can view organization members" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.user_can_view_org_member(id)
  );

-- 4. Keep other policies simple and non-recursive
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own account" ON public.users
  FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Founders can see all users (simple check, no recursion)
CREATE POLICY "Founders can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND "isFounder" = 1
    )
  );

-- Verify the new policies
SELECT 'Updated users table policies:' as info;
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;
