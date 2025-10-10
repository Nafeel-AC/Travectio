-- Test the exact query that useSubscription hook runs

-- Step 1: Get membership for boss@gmail.com (user_id: ef073bd1-a1b1-45d1-b3b0-da88cd676ae9)
SELECT 
  organization_id, 
  role, 
  status,
  user_id
FROM public.organization_members
WHERE user_id = 'ef073bd1-a1b1-45d1-b3b0-da88cd676ae9'
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- Step 2: Get subscription for that org (38a411a1-de76-42a9-9070-65e7c5c67f4a)
SELECT *
FROM public.subscriptions
WHERE organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
  AND status = 'active'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Step 3: Check RLS state
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('subscriptions', 'organization_members');


