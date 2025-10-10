-- Debug the owner's user data to see why it's showing as "Unknown User"

-- 1. Check if the owner's user record exists
SELECT 'Owner user record check:' as info;
SELECT 
  u.id,
  u.email,
  u."firstName",
  u."lastName",
  u."createdAt"
FROM public.users u
WHERE u.email = 'boss@gmail.com';

-- 2. Check the organization_members record for the owner
SELECT 'Owner membership record:' as info;
SELECT 
  om.id,
  om.user_id,
  om.role,
  om.status,
  om.created_at
FROM public.organization_members om
WHERE om.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND om.role = 'owner';

-- 3. Test the exact join that the frontend is doing
SELECT 'Frontend join simulation:' as info;
SELECT 
  om.id as membership_id,
  om.role,
  om.status,
  om.created_at,
  u.id as user_id,
  u.email,
  u."firstName",
  u."lastName"
FROM public.organization_members om
LEFT JOIN public.users u ON u.id = om.user_id
WHERE om.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND om.status = 'active'
ORDER BY om.created_at ASC;

-- 4. Check if there's a user_id mismatch
SELECT 'User ID mismatch check:' as info;
SELECT 
  'organization_members' as table_name,
  om.user_id,
  om.role
FROM public.organization_members om
WHERE om.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
UNION ALL
SELECT 
  'users' as table_name,
  u.id as user_id,
  'N/A' as role
FROM public.users u
WHERE u.email IN ('boss@gmail.com', 'nafeelmannan@gmail.com');
