-- Fix RLS policies for users table to allow new user creation
-- The issue is that new users can't insert themselves because the policy checks fail

-- First, let's see current policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Drop the restrictive insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a more permissive insert policy that allows authenticated users to create their own profile
CREATE POLICY "Users can insert own profile" ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Also ensure the select policy allows users to see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Ensure update policy is correct
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Verify the policies are correct
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY cmd, policyname;
