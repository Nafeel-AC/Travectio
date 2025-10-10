-- Direct way to delete users - handles the foreign key issue
-- Run this in Supabase SQL editor

-- Method 1: Delete users and let the database handle constraints
-- This will work if some constraints already have CASCADE

-- First, let's see what users exist
SELECT id, email, "firstName", "lastName" FROM public.users;

-- Delete specific users (replace with actual user IDs)
-- DELETE FROM public.users WHERE id IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Method 2: If the above fails, we'll delete related records first
-- Uncomment the sections below as needed:

-- Delete from trucks table
-- DELETE FROM public.trucks WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from drivers table  
-- DELETE FROM public.drivers WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from loads table
-- DELETE FROM public.loads WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from load_board table
-- DELETE FROM public.load_board WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from load_plans table
-- DELETE FROM public.load_plans WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from fleet_metrics table
-- DELETE FROM public.fleet_metrics WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from activities table
-- DELETE FROM public.activities WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from user_analytics table
-- DELETE FROM public.user_analytics WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from data_input_tracking table
-- DELETE FROM public.data_input_tracking WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from subscriptions table
-- DELETE FROM public.subscriptions WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from payments table
-- DELETE FROM public.payments WHERE "userId" IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from organization_members table
-- DELETE FROM public.organization_members WHERE user_id IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Delete from invitations table
-- DELETE FROM public.invitations WHERE invited_by IN (
--   'user-id-1',
--   'user-id-2'
-- );

-- Finally delete the users
-- DELETE FROM public.users WHERE id IN (
--   'user-id-1',
--   'user-id-2'
-- );
