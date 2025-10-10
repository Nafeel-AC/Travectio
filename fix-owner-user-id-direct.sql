-- Direct fix for owner's user_id mismatch

-- 1. Show current owner membership with user_id
SELECT 'Current owner membership:' as info;
SELECT 
  om.id as membership_id,
  om.user_id as current_user_id,
  om.role,
  om.status
FROM public.organization_members om
WHERE om.id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a';

-- 2. Show all users to find the correct boss@gmail.com user_id
SELECT 'All users with boss email:' as info;
SELECT 
  u.id as correct_user_id,
  u.email,
  u."firstName",
  u."lastName"
FROM public.users u
WHERE u.email ILIKE '%boss%gmail%';

-- 3. Update the owner membership to use the correct user_id
-- Replace 'CORRECT_USER_ID_HERE' with the actual ID from step 2
UPDATE public.organization_members
SET user_id = (
  SELECT id 
  FROM public.users 
  WHERE email = 'boss@gmail.com'
  LIMIT 1
)
WHERE id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a';

-- 4. Verify the fix
SELECT 'After fix - Owner with user data:' as info;
SELECT 
  om.id as membership_id,
  om.user_id,
  om.role,
  u.email,
  u."firstName",
  u."lastName"
FROM public.organization_members om
LEFT JOIN public.users u ON u.id = om.user_id
WHERE om.id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a';
