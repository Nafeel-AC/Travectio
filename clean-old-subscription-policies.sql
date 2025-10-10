-- Clean up any old/conflicting subscription policies

-- Remove the old user-based policy that might be conflicting
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;

-- Verify only the correct policies remain
SELECT 'Current subscription policies after cleanup:' as info;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'subscriptions'
ORDER BY policyname;

-- Test the subscription query with correct column names
SELECT 'Testing subscription access:' as info;
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
