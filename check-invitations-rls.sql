-- Check RLS policies for invitations table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'invitations' 
AND schemaname = 'public';

-- Check if RLS is enabled on invitations table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'invitations' 
AND schemaname = 'public';

-- Check if the specific invitation exists and what user is trying to access it
SELECT 
  id,
  email,
  role,
  status,
  expires_at,
  organization_id
FROM public.invitations 
WHERE token = '0fcdfe10-7aec-4fd8-bd4c-352c489e586e';
