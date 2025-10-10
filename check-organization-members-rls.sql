-- Check RLS policies on organization_members table
SELECT 'Current organization_members RLS policies:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'organization_members'
ORDER BY policyname;
