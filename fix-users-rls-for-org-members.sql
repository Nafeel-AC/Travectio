-- Fix users table RLS to allow organization members to see each other

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Create new policies that allow organization members to see each other
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 2. Organization members can view other members in their organizations
CREATE POLICY "Organization members can view team members" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() 
        AND om2.user_id = users.id
        AND om1.status = 'active'
        AND om2.status = 'active'
    )
  );

-- 3. Founders can view all users (system admin)
CREATE POLICY "Founders can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND "isFounder" = 1
    )
  );

-- Verify the new policies
SELECT 'Updated users table policies:' as info;
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
AND cmd = 'SELECT'
ORDER BY policyname;
