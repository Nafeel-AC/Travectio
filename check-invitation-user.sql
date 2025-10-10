-- Check if the user trying to accept invitation exists in database
SELECT 'User trying to accept invitation:' as info;
SELECT id, email FROM public.users WHERE id = 'bc963d2a-56f4-4531-8f64-0f7ba42f76fc';

-- Check the specific invitation they're trying to access
SELECT 'Invitation details:' as info;
SELECT 
  id,
  email,
  role,
  status,
  expires_at,
  organization_id,
  token
FROM public.invitations 
WHERE token = '0fcdfe10-7aec-4fd8-bd4c-352c489e586e';

-- Check if there's an email match between user and invitation
SELECT 'Email match check:' as info;
SELECT 
  u.id as user_id,
  u.email as user_email,
  i.email as invitation_email,
  LOWER(u.email) = LOWER(i.email) as emails_match
FROM public.users u
CROSS JOIN public.invitations i
WHERE u.id = 'bc963d2a-56f4-4531-8f64-0f7ba42f76fc'
AND i.token = '0fcdfe10-7aec-4fd8-bd4c-352c489e586e';
