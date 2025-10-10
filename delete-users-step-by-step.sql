-- Step-by-step deletion to handle all foreign key constraints
-- Run this in Supabase SQL editor

-- Step 1: Delete from truck_cost_breakdown first (this was causing the error)
DELETE FROM public.truck_cost_breakdown 
WHERE "truckId" IN (
  SELECT id FROM public.trucks 
  WHERE "userId" IN (
    'user-id-1', 'user-id-2'  -- Replace with actual user IDs
  )
);

-- Step 2: Delete from load_stops (references loads)
DELETE FROM public.load_stops 
WHERE "loadId" IN (
  SELECT id FROM public.loads 
  WHERE "userId" IN (
    'user-id-1', 'user-id-2'  -- Replace with actual user IDs
  )
);

-- Step 3: Delete from load_plan_legs (references load_plans)
DELETE FROM public.load_plan_legs 
WHERE "loadPlanId" IN (
  SELECT id FROM public.load_plans 
  WHERE "userId" IN (
    'user-id-1', 'user-id-2'  -- Replace with actual user IDs
  )
);

-- Step 4: Delete from hos_logs (references drivers)
DELETE FROM public.hos_logs 
WHERE "driverId" IN (
  SELECT id FROM public.drivers 
  WHERE "userId" IN (
    'user-id-1', 'user-id-2'  -- Replace with actual user IDs
  )
);

-- Step 5: Delete from fuel_purchases (references trucks)
DELETE FROM public.fuel_purchases 
WHERE "truckId" IN (
  SELECT id FROM public.trucks 
  WHERE "userId" IN (
    'user-id-1', 'user-id-2'  -- Replace with actual user IDs
  )
);

-- Step 6: Delete from loads
DELETE FROM public.loads 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 7: Delete from load_plans
DELETE FROM public.load_plans 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 8: Delete from load_board
DELETE FROM public.load_board 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 9: Delete from fleet_metrics
DELETE FROM public.fleet_metrics 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 10: Delete from activities
DELETE FROM public.activities 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 11: Delete from user_analytics
DELETE FROM public.user_analytics 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 12: Delete from data_input_tracking
DELETE FROM public.data_input_tracking 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 13: Delete from subscriptions
DELETE FROM public.subscriptions 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 14: Delete from payments
DELETE FROM public.payments 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 15: Delete from organization_members
DELETE FROM public.organization_members 
WHERE user_id IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 16: Delete from invitations
DELETE FROM public.invitations 
WHERE invited_by IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 17: Delete from drivers
DELETE FROM public.drivers 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 18: Delete from trucks
DELETE FROM public.trucks 
WHERE "userId" IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);

-- Step 19: Finally delete the users
DELETE FROM public.users 
WHERE id IN (
  'user-id-1', 'user-id-2'  -- Replace with actual user IDs
);
