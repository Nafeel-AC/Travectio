-- Fix column name references in queries
-- The subscriptions table uses camelCase column names

-- Test the corrected basic subscription query
SELECT 'Testing corrected subscription query:' as info;
SELECT 
  id,
  organization_id,
  status,
  "truckCount",
  "calculatedAmount",
  "createdAt"
FROM public.subscriptions 
WHERE organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND status = 'active'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Test organization membership for the user from the error log
SELECT 'User membership check:' as info;
SELECT 
  om.organization_id,
  om.role,
  om.status,
  o.name as org_name
FROM public.organization_members om
JOIN public.organizations o ON o.id = om.organization_id
WHERE om.user_id = 'bc963d2a-56f4-4531-8f64-0f7ba42f76fc'
AND om.status = 'active';

-- Verify RLS policies are working
SELECT 'RLS Policy verification:' as info;
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'subscriptions'
ORDER BY policyname;
