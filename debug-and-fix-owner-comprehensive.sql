-- Comprehensive debug and fix for owner user data

-- 1. Show the exact owner membership record
SELECT 'Owner membership record:' as info;
SELECT 
  om.id,
  om.user_id,
  om.organization_id,
  om.role,
  om.status,
  om.created_at
FROM public.organization_members om
WHERE om.id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a';

-- 2. Check if that user_id exists in users table
SELECT 'Does the owner user_id exist in users table?' as info;
SELECT 
  u.id,
  u.email,
  u."firstName",
  u."lastName",
  u."createdAt"
FROM public.users u
WHERE u.id = (
  SELECT user_id 
  FROM public.organization_members 
  WHERE id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a'
);

-- 3. Find ALL users with boss email variations
SELECT 'All boss email users:' as info;
SELECT 
  u.id,
  u.email,
  u."firstName",
  u."lastName",
  u."createdAt"
FROM public.users u
WHERE u.email ILIKE '%boss%'
ORDER BY u."createdAt";

-- 4. Show what the frontend query is actually doing
SELECT 'Frontend query simulation:' as info;
SELECT 
  om.id,
  om.role,
  om.status,
  om.created_at,
  json_build_object(
    'id', u.id,
    'email', u.email,
    'firstName', u."firstName",
    'lastName', u."lastName"
  ) as users
FROM public.organization_members om
LEFT JOIN public.users u ON u.id = om.user_id
WHERE om.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND om.status = 'active'
ORDER BY om.created_at ASC;

-- 5. If boss@gmail.com user exists, update the membership
DO $$
DECLARE
  boss_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Find boss user
  SELECT id INTO boss_user_id 
  FROM public.users 
  WHERE email = 'boss@gmail.com';
  
  -- Get current user_id from membership
  SELECT user_id INTO current_user_id
  FROM public.organization_members
  WHERE id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a';
  
  RAISE NOTICE 'Boss user_id: %, Current membership user_id: %', boss_user_id, current_user_id;
  
  IF boss_user_id IS NOT NULL AND boss_user_id != current_user_id THEN
    UPDATE public.organization_members
    SET user_id = boss_user_id
    WHERE id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a';
    
    RAISE NOTICE 'Updated membership user_id from % to %', current_user_id, boss_user_id;
  ELSIF boss_user_id IS NULL THEN
    RAISE NOTICE 'No user found with email boss@gmail.com';
  ELSE
    RAISE NOTICE 'User_id is already correct: %', boss_user_id;
  END IF;
END $$;

-- 6. Final verification
SELECT 'Final verification:' as info;
SELECT 
  om.id,
  om.user_id,
  om.role,
  u.email,
  u."firstName",
  u."lastName"
FROM public.organization_members om
LEFT JOIN public.users u ON u.id = om.user_id
WHERE om.id = 'f6d29033-ab0b-4bd7-8c09-580ce6c1b62a';
