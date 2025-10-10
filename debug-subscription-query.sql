-- Debug the subscription query that's failing
-- This simulates the exact query the frontend is making

-- 1. Test basic subscription query without nested select
SELECT 'Testing basic subscription query:' as info;
SELECT 
  id,
  organization_id,
  status,
  "truckCount",
  "calculatedAmount"
FROM public.subscriptions 
WHERE organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND status = 'active'
ORDER BY "createdAt" DESC
LIMIT 1;

-- 2. Test if pricing_plans can be accessed
SELECT 'Testing pricing_plans access:' as info;
SELECT id, name, "displayName", "isActive"
FROM public.pricing_plans
WHERE "isActive" = true
LIMIT 3;

-- 3. Test the join between subscriptions and pricing_plans
SELECT 'Testing subscription + pricing_plans join:' as info;
SELECT 
  s.id,
  s.organization_id,
  s.status,
  s."truckCount",
  p.name as plan_name,
  p."displayName" as plan_display_name
FROM public.subscriptions s
LEFT JOIN public.pricing_plans p ON p.id = s."planId"
WHERE s.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND s.status = 'active'
ORDER BY s.created_at DESC
LIMIT 1;

-- 4. Check current user's organization membership
SELECT 'Current user organization membership:' as info;
SELECT 
  om.id,
  om.organization_id,
  om.role,
  om.status,
  o.name as org_name
FROM public.organization_members om
JOIN public.organizations o ON o.id = om.organization_id
WHERE om.user_id = auth.uid()
AND om.status = 'active';

-- 5. Check RLS policies on both tables
SELECT 'Current RLS policies:' as info;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('subscriptions', 'pricing_plans')
ORDER BY tablename, policyname;
