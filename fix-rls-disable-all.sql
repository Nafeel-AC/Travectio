-- EMERGENCY FIX: Disable all RLS policies causing infinite recursion

-- Disable RLS on users table completely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view organization members" ON public.users;
DROP POLICY IF EXISTS "Founders can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can delete own account" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Drop the helper function that might be causing issues
DROP FUNCTION IF EXISTS public.user_can_view_org_member(UUID);

-- Verify everything is clean
SELECT 'Users table RLS status:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

SELECT 'Users policies (should be empty):' as info;
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';
