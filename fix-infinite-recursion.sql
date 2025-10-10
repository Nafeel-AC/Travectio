-- Fix infinite recursion in organization_members RLS policies
-- The issue: RLS policies on organization_members are trying to check organization_members
-- Solution: Disable RLS on organization_members entirely

-- Drop all RLS policies on organization_members
DROP POLICY IF EXISTS "Users read own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Owner or Dispatcher write loads" ON public.organization_members;
DROP POLICY IF EXISTS "Owner/Dispatcher write loads" ON public.organization_members;
DROP POLICY IF EXISTS "Org members read organization_members" ON public.organization_members;
DROP POLICY IF EXISTS "Owner write organization_members" ON public.organization_members;

-- Disable RLS entirely on organization_members
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'organization_members';

-- Test the query that was failing
SELECT 
  organization_id, 
  role, 
  status,
  user_id
FROM public.organization_members
WHERE user_id = 'bc963d2a-56f4-4531-8f64-0f7ba42f76fc'
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;
