-- Fix the owner's user_id link in organization_members

-- 1. First, let's see what user_id the owner membership has
SELECT 'Current owner membership:' as info;
SELECT 
  om.id,
  om.user_id,
  om.role,
  om.status
FROM public.organization_members om
WHERE om.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND om.role = 'owner';

-- 2. Find the correct user_id for boss@gmail.com
SELECT 'Correct user record for boss@gmail.com:' as info;
SELECT 
  u.id,
  u.email,
  u."firstName",
  u."lastName"
FROM public.users u
WHERE u.email = 'boss@gmail.com';

-- 3. Update the owner's membership to use the correct user_id
-- First, get the correct user_id
DO $$
DECLARE
  correct_user_id UUID;
  owner_membership_id UUID;
BEGIN
  -- Get the correct user_id for boss@gmail.com
  SELECT id INTO correct_user_id 
  FROM public.users 
  WHERE email = 'boss@gmail.com';
  
  -- Get the owner membership id
  SELECT id INTO owner_membership_id
  FROM public.organization_members
  WHERE organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
  AND role = 'owner';
  
  -- Update the membership if both records exist
  IF correct_user_id IS NOT NULL AND owner_membership_id IS NOT NULL THEN
    UPDATE public.organization_members
    SET user_id = correct_user_id
    WHERE id = owner_membership_id;
    
    RAISE NOTICE 'Updated owner membership user_id to: %', correct_user_id;
  ELSE
    RAISE NOTICE 'Could not find user or membership record';
  END IF;
END $$;

-- 4. Verify the fix worked
SELECT 'Verification - Owner membership after fix:' as info;
SELECT 
  om.id,
  om.user_id,
  om.role,
  u.email,
  u."firstName",
  u."lastName"
FROM public.organization_members om
LEFT JOIN public.users u ON u.id = om.user_id
WHERE om.organization_id = '38a411a1-de76-42a9-9070-65e7c5c67f4a'
AND om.role = 'owner';
