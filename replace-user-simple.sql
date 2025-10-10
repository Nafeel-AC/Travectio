-- Simple approach: Delete old user and create new one with correct ID
-- This handles foreign key constraints automatically with CASCADE

-- First, check what will be deleted
SELECT 'Sessions to be deleted:' as info;
SELECT COUNT(*) FROM public.sessions WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

SELECT 'Other data to be deleted:' as info;
SELECT 
  (SELECT COUNT(*) FROM public.trucks WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a') as trucks,
  (SELECT COUNT(*) FROM public.drivers WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a') as drivers,
  (SELECT COUNT(*) FROM public.loads WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a') as loads;

-- Delete the old user (CASCADE will handle foreign key references)
DELETE FROM public.users WHERE id = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Create the user with the correct Supabase Auth ID
INSERT INTO public.users (
  id, 
  email, 
  "isFounder", 
  "isAdmin", 
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  '0f519e86-3e6e-46d7-b4e5-d364607b2338',
  'nafeelmannan@gmail.com',
  0,
  0,
  1,
  now(),
  now()
);

-- Verify the fix
SELECT 'New user created:' as info;
SELECT id, email, "createdAt" FROM public.users WHERE email = 'nafeelmannan@gmail.com';
