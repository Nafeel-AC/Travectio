-- Debug owner data to see what's in the database
-- Check the organization and its members

-- 1. Check the organization details
SELECT 'Organization Details:' as info;
SELECT id, name, status, created_at
FROM public.organizations 
WHERE id = '38a411a1-de76-42a9-9070-65e7c5c67f4a';

-- 2. Check all organization members
SELECT 'All Organization Members:' as info;
SELECT 
  om.id,
  om.role,
  om.status,
  om.created_at,
  u.id as user_id,
  u.email,
  u."firstName",
  u."lastName"
FROM public.organization_members om
JOIN public.users u ON u.id = om.user_id
WHERE om.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
ORDER BY om.created_at;

-- 3. Check specifically for the owner
SELECT 'Owner Details:' as info;
SELECT 
  om.id,
  om.role,
  om.status,
  u.email,
  u."firstName",
  u."lastName",
  CASE 
    WHEN u."firstName" IS NOT NULL AND u."lastName" IS NOT NULL 
    THEN CONCAT(u."firstName", ' ', u."lastName")
    ELSE SPLIT_PART(u.email, '@', 1)
  END as display_name
FROM public.organization_members om
JOIN public.users u ON u.id = om.user_id
WHERE om.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND om.role = 'owner';
