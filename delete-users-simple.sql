-- Simple way to delete users and their related data
-- Run this in Supabase SQL editor

-- Step 1: Delete related records first (in reverse dependency order)
-- Delete from tables that reference other tables first

-- Delete from tables that might reference trucks
DELETE FROM public.load_stops WHERE "loadId" IN (
  SELECT id FROM public.loads WHERE "userId" IN (
    'user-id-1', 'user-id-2'  -- Replace with actual user IDs
  )
);

DELETE FROM public.load_plan_legs WHERE "loadPlanId" IN (
  SELECT id FROM public.load_plans WHERE "userId" IN (
    'user-id-1', 'user-id-2'  -- Replace with actual user IDs
  )
);

-- Delete from tables that reference loads
DELETE FROM public.loads WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Delete from tables that reference load_plans
DELETE FROM public.load_plans WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Delete from tables that reference trucks
DELETE FROM public.trucks WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Delete from tables that reference drivers
DELETE FROM public.drivers WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Delete from other user-related tables
DELETE FROM public.load_board WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

DELETE FROM public.fleet_metrics WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

DELETE FROM public.activities WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

DELETE FROM public.user_analytics WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

DELETE FROM public.data_input_tracking WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

DELETE FROM public.subscriptions WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

DELETE FROM public.payments WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

DELETE FROM public.organization_members WHERE user_id IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

DELETE FROM public.invitations WHERE invited_by IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 2: Finally delete the users
DELETE FROM public.users WHERE id IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);
