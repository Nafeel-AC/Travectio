-- Fix user ID mismatch by handling foreign key references
-- We need to update all related tables that reference the old user ID

-- First, check what tables reference this user
SELECT 'Current references to old user ID:' as info;

-- Check sessions
SELECT 'sessions' as table_name, COUNT(*) as count 
FROM public.sessions 
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Check other tables that might reference users
SELECT 'trucks' as table_name, COUNT(*) as count 
FROM public.trucks 
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

SELECT 'drivers' as table_name, COUNT(*) as count 
FROM public.drivers 
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

SELECT 'loads' as table_name, COUNT(*) as count 
FROM public.loads 
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Option 1: Update all references, then update the user
-- Update sessions first
UPDATE public.sessions 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Update trucks
UPDATE public.trucks 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Update drivers
UPDATE public.drivers 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Update loads
UPDATE public.loads 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Update other tables that might reference users
UPDATE public.load_plans 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

UPDATE public.load_board 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e6e-46d7-b4e5-d364607b2338';

UPDATE public.fleet_metrics 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

UPDATE public.user_analytics 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

UPDATE public.activities 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

UPDATE public.data_input_tracking 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

UPDATE public.subscriptions 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

UPDATE public.session_audit_logs 
SET "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE "userId" = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Update organization_members if any exist
UPDATE public.organization_members 
SET user_id = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE user_id = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Now update the user ID
UPDATE public.users 
SET id = '0f519e86-3e6e-46d7-b4e5-d364607b2338'
WHERE id = '795b2e64-7e24-4c79-aecc-73044bd24c8a';

-- Verify the fix
SELECT 'After update - user:' as info;
SELECT id, email FROM public.users WHERE email = 'nafeelmannan@gmail.com';

SELECT 'After update - sessions:' as info;
SELECT COUNT(*) as session_count FROM public.sessions WHERE "userId" = '0f519e86-3e6e-46d7-b4e5-d364607b2338';
