-- Check RLS policies for organizations table
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
WHERE tablename = 'organizations' 
AND schemaname = 'public';

-- Check if RLS is enabled on organizations table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'organizations' 
AND schemaname = 'public';

-- Test the nested query that's failing
SELECT 'Testing the actual frontend query:' as info;
SELECT 
  organizations.name,
  invitations.role,
  invitations.status,
  invitations.expires_at
FROM public.invitations
JOIN public.organizations ON invitations.organization_id = organizations.id
WHERE invitations.token = '0fcdfe10-7aec-4fd8-bd4c-352c489e586e'
AND invitations.status = 'pending';
