-- Debug the specific invitation and user email matching

-- Check the user details
SELECT 'User details:' as info;
SELECT id, email, LOWER(email) as email_lower 
FROM public.users 
WHERE id = 'bc963d2a-56f4-4531-8f64-0f7ba42f76fc';

-- Check the invitation details
SELECT 'Invitation details:' as info;
SELECT 
  id,
  email,
  LOWER(email) as email_lower,
  role,
  status,
  expires_at > now() as not_expired,
  token
FROM public.invitations 
WHERE token = '0fcdfe10-7aec-4fd8-bd4c-352c489e586e';

-- Test the RLS policy logic manually
SELECT 'Email match test:' as info;
SELECT 
  u.email as user_email,
  i.email as invitation_email,
  LOWER(u.email) = LOWER(i.email) as emails_match_exact,
  u.email ILIKE i.email as emails_match_ilike
FROM public.users u
CROSS JOIN public.invitations i
WHERE u.id = 'bc963d2a-56f4-4531-8f64-0f7ba42f76fc'
AND i.token = '0fcdfe10-7aec-4fd8-bd4c-352c489e586e';

-- Check if the RLS policy would allow access
SELECT 'RLS policy test:' as info;
SELECT 
  'Policy would allow access' as result
FROM public.users u
CROSS JOIN public.invitations i
WHERE u.id = 'bc963d2a-56f4-4531-8f64-0f7ba42f76fc'
AND i.token = '0fcdfe10-7aec-4fd8-bd4c-352c489e586e'
AND LOWER(u.email) = LOWER(i.email);
