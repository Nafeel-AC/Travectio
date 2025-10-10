-- Check organization and membership status for the problematic user
SELECT 
  u.id as user_id,
  u.email as user_email,
  o.id as org_id,
  o.name as org_name,
  om.role as user_role,
  om.status as membership_status
FROM public.users u
LEFT JOIN public.organization_members om ON u.id = om.user_id
LEFT JOIN public.organizations o ON om.organization_id = o.id
WHERE u.email = 'nafeelmannan@gmail.com';

-- Check all organizations
SELECT id, name, created_at FROM public.organizations ORDER BY created_at DESC;

-- Check all organization members
SELECT 
  om.id as membership_id,
  om.organization_id,
  om.user_id,
  om.role,
  om.status,
  u.email as user_email,
  o.name as org_name
FROM public.organization_members om
JOIN public.users u ON om.user_id = u.id
JOIN public.organizations o ON om.organization_id = o.id
ORDER BY om.created_at DESC;
