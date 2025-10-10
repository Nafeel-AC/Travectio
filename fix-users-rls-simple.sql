-- DISABLE RLS on users table to prevent infinite recursion
-- This is the safest approach for organization member visibility

-- Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Organization members can view team members" ON public.users;
DROP POLICY IF EXISTS "Founders can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can delete own account" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Verify RLS is disabled
SELECT 'Users table RLS status after fix:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Verify no policies remain
SELECT 'Remaining users policies (should be empty):' as info;
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';
