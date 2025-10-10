-- Check invitations for nafeelmannan@gmail.com
SELECT 
  id,
  organization_id,
  email,
  role,
  token,
  status,
  expires_at,
  created_at
FROM public.invitations 
WHERE email = 'nafeelmannan@gmail.com'
ORDER BY created_at DESC;

-- Check all pending invitations
SELECT 
  i.email,
  i.role,
  i.status,
  i.expires_at,
  o.name as org_name
FROM public.invitations i
JOIN public.organizations o ON i.organization_id = o.id
WHERE i.status = 'pending'
ORDER BY i.created_at DESC;
