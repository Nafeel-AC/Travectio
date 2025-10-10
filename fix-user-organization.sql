-- Fix user organization membership for nafeelmannan@gmail.com
-- This will either add them to an existing org or create a new one

-- First, check if user has any memberships
SELECT 
  u.email,
  COUNT(om.id) as membership_count
FROM public.users u
LEFT JOIN public.organization_members om ON u.id = om.user_id AND om.status = 'active'
WHERE u.email = 'nafeelmannan@gmail.com'
GROUP BY u.email;

-- Option 1: Create a new organization for the user
INSERT INTO public.organizations (name, status)
VALUES ('nafeelmannan@gmail.com', 'active')
ON CONFLICT (name) DO NOTHING
RETURNING id, name;

-- Get the organization ID (either newly created or existing)
SELECT id, name FROM public.organizations WHERE name = 'nafeelmannan@gmail.com';

-- Add user as owner of their organization
INSERT INTO public.organization_members (organization_id, user_id, role, status)
SELECT 
  o.id,
  u.id,
  'owner',
  'active'
FROM public.users u
CROSS JOIN public.organizations o
WHERE u.email = 'nafeelmannan@gmail.com'
  AND o.name = 'nafeelmannan@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members om 
    WHERE om.user_id = u.id AND om.organization_id = o.id
  );

-- Verify the fix
SELECT 
  u.email,
  o.name as org_name,
  om.role,
  om.status
FROM public.users u
JOIN public.organization_members om ON u.id = om.user_id
JOIN public.organizations o ON om.organization_id = o.id
WHERE u.email = 'nafeelmannan@gmail.com';
