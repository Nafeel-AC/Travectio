-- Check RLS policies on users table that might be blocking access

SELECT 'Users table RLS status:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

SELECT 'Users table RLS policies:' as info;
SELECT 
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- Test if the current user can access the owner's user record directly
  
-- Test the exact join that should work
SELECT 'Join test:' as info;
SELECT 
  om.id,
  om.role,
  om.user_id,
  u.id as user_table_id,
  u.email
FROM public.organization_members om
LEFT JOIN public.users u ON u.id = om.user_id
WHERE om.id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a';
