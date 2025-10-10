-- Fix the user ID mismatch for nafeelmannan@gmail.com
-- The user exists with ID 795b2e64-7e24-4c79-aecc-73044bd24c8a in database
-- But Supabase Auth has them as 0f519e86-3e6e-46d7-b4e5-d364607b2338

-- First, check current state
SELECT 'Current database user:' as info;
SELECT id, email FROM public.users WHERE email = 'nafeelmannan@gmail.com';

-- Update the user's ID to match Supabase Auth
UPDATE public.users 
SET id = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE email = 'nafeelmannan@gmail.com' 
AND id = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Verify the fix
SELECT 'After update:' as info;
SELECT id, email FROM public.users WHERE email = 'nafeelmannan@gmail.com';
