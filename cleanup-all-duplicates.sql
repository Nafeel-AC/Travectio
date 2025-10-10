-- Comprehensive script to clean up duplicates in all tables
-- Run this in Supabase SQL editor

-- ==============================================
-- 1. CLEAN UP USERS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate emails in users table
SELECT 'users' as table_name, email, COUNT(*) as duplicate_count
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Remove duplicate users (keep the oldest record)
WITH user_duplicates AS (
  SELECT id, email, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY "createdAt" ASC) as rn
  FROM public.users
  WHERE email IS NOT NULL
)
DELETE FROM public.users 
WHERE id IN (
  SELECT id FROM user_duplicates WHERE rn > 1
);

-- ==============================================
-- 2. CLEAN UP TRUCKS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate truck names per user
SELECT 'trucks' as table_name, "userId", name, COUNT(*) as duplicate_count
FROM public.trucks 
GROUP BY "userId", name 
HAVING COUNT(*) > 1;

-- Remove duplicate trucks (keep the oldest record)
WITH truck_duplicates AS (
  SELECT id, "userId", name, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", name ORDER BY "createdAt" ASC) as rn
  FROM public.trucks
)
DELETE FROM public.trucks 
WHERE id IN (
  SELECT id FROM truck_duplicates WHERE rn > 1
);

-- ==============================================
-- 3. CLEAN UP DRIVERS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate driver names per user
SELECT 'drivers' as table_name, "userId", "firstName", "lastName", COUNT(*) as duplicate_count
FROM public.drivers 
GROUP BY "userId", "firstName", "lastName" 
HAVING COUNT(*) > 1;

-- Remove duplicate drivers (keep the oldest record)
WITH driver_duplicates AS (
  SELECT id, "userId", "firstName", "lastName", "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", "firstName", "lastName" ORDER BY "createdAt" ASC) as rn
  FROM public.drivers
)
DELETE FROM public.drivers 
WHERE id IN (
  SELECT id FROM driver_duplicates WHERE rn > 1
);

-- ==============================================
-- 4. CLEAN UP LOADS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate loads (same origin/destination per user)
SELECT 'loads' as table_name, "userId", "originCity", "destinationCity", "pickupDate", COUNT(*) as duplicate_count
FROM public.loads 
GROUP BY "userId", "originCity", "destinationCity", "pickupDate" 
HAVING COUNT(*) > 1;

-- Remove duplicate loads (keep the oldest record)
WITH load_duplicates AS (
  SELECT id, "userId", "originCity", "destinationCity", "pickupDate", "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", "originCity", "destinationCity", "pickupDate" ORDER BY "createdAt" ASC) as rn
  FROM public.loads
)
DELETE FROM public.loads 
WHERE id IN (
  SELECT id FROM load_duplicates WHERE rn > 1
);

-- ==============================================
-- 5. CLEAN UP LOAD_BOARD TABLE DUPLICATES
-- ==============================================

-- Check for duplicate load board entries
SELECT 'load_board' as table_name, "userId", "loadBoardSource", "originCity", "destinationCity", COUNT(*) as duplicate_count
FROM public.load_board 
GROUP BY "userId", "loadBoardSource", "originCity", "destinationCity" 
HAVING COUNT(*) > 1;

-- Remove duplicate load board entries
WITH load_board_duplicates AS (
  SELECT id, "userId", "loadBoardSource", "originCity", "destinationCity", "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", "loadBoardSource", "originCity", "destinationCity" ORDER BY "createdAt" ASC) as rn
  FROM public.load_board
)
DELETE FROM public.load_board 
WHERE id IN (
  SELECT id FROM load_board_duplicates WHERE rn > 1
);

-- ==============================================
-- 6. CLEAN UP LOAD_PLANS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate load plans
SELECT 'load_plans' as table_name, "userId", name, COUNT(*) as duplicate_count
FROM public.load_plans 
GROUP BY "userId", name 
HAVING COUNT(*) > 1;

-- Remove duplicate load plans
WITH load_plan_duplicates AS (
  SELECT id, "userId", name, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", name ORDER BY "createdAt" ASC) as rn
  FROM public.load_plans
)
DELETE FROM public.load_plans 
WHERE id IN (
  SELECT id FROM load_plan_duplicates WHERE rn > 1
);

-- ==============================================
-- 7. CLEAN UP FLEET_METRICS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate fleet metrics (same user, same date)
SELECT 'fleet_metrics' as table_name, "userId", date, COUNT(*) as duplicate_count
FROM public.fleet_metrics 
GROUP BY "userId", date 
HAVING COUNT(*) > 1;

-- Remove duplicate fleet metrics
WITH fleet_metrics_duplicates AS (
  SELECT id, "userId", date, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", date ORDER BY "createdAt" ASC) as rn
  FROM public.fleet_metrics
)
DELETE FROM public.fleet_metrics 
WHERE id IN (
  SELECT id FROM fleet_metrics_duplicates WHERE rn > 1
);

-- ==============================================
-- 8. CLEAN UP ACTIVITIES TABLE DUPLICATES
-- ==============================================

-- Check for duplicate activities (same user, same title, same date)
SELECT 'activities' as table_name, "userId", title, "createdAt"::date, COUNT(*) as duplicate_count
FROM public.activities 
GROUP BY "userId", title, "createdAt"::date 
HAVING COUNT(*) > 1;

-- Remove duplicate activities
WITH activity_duplicates AS (
  SELECT id, "userId", title, "createdAt"::date, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", title, "createdAt"::date ORDER BY "createdAt" ASC) as rn
  FROM public.activities
)
DELETE FROM public.activities 
WHERE id IN (
  SELECT id FROM activity_duplicates WHERE rn > 1
);

-- ==============================================
-- 9. CLEAN UP USER_ANALYTICS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate analytics (same user, same session)
SELECT 'user_analytics' as table_name, "userId", "sessionId", COUNT(*) as duplicate_count
FROM public.user_analytics 
GROUP BY "userId", "sessionId" 
HAVING COUNT(*) > 1;

-- Remove duplicate analytics
WITH analytics_duplicates AS (
  SELECT id, "userId", "sessionId", "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", "sessionId" ORDER BY "createdAt" ASC) as rn
  FROM public.user_analytics
)
DELETE FROM public.user_analytics 
WHERE id IN (
  SELECT id FROM analytics_duplicates WHERE rn > 1
);

-- ==============================================
-- 10. CLEAN UP DATA_INPUT_TRACKING TABLE DUPLICATES
-- ==============================================

-- Check for duplicate data input tracking
SELECT 'data_input_tracking' as table_name, "userId", "inputType", "entityType", "createdAt"::date, COUNT(*) as duplicate_count
FROM public.data_input_tracking 
GROUP BY "userId", "inputType", "entityType", "createdAt"::date 
HAVING COUNT(*) > 1;

-- Remove duplicate data input tracking
WITH data_input_duplicates AS (
  SELECT id, "userId", "inputType", "entityType", "createdAt"::date, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", "inputType", "entityType", "createdAt"::date ORDER BY "createdAt" ASC) as rn
  FROM public.data_input_tracking
)
DELETE FROM public.data_input_tracking 
WHERE id IN (
  SELECT id FROM data_input_duplicates WHERE rn > 1
);

-- ==============================================
-- 11. CLEAN UP SUBSCRIPTIONS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate subscriptions (same user, same plan)
SELECT 'subscriptions' as table_name, "userId", "planId", COUNT(*) as duplicate_count
FROM public.subscriptions 
GROUP BY "userId", "planId" 
HAVING COUNT(*) > 1;

-- Remove duplicate subscriptions (keep the most recent)
WITH subscription_duplicates AS (
  SELECT id, "userId", "planId", "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", "planId" ORDER BY "createdAt" DESC) as rn
  FROM public.subscriptions
)
DELETE FROM public.subscriptions 
WHERE id IN (
  SELECT id FROM subscription_duplicates WHERE rn > 1
);

-- ==============================================
-- 12. CLEAN UP PAYMENTS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate payments (same subscription, same amount, same date)
SELECT 'payments' as table_name, "subscriptionId", amount, "createdAt"::date, COUNT(*) as duplicate_count
FROM public.payments 
GROUP BY "subscriptionId", amount, "createdAt"::date 
HAVING COUNT(*) > 1;

-- Remove duplicate payments
WITH payment_duplicates AS (
  SELECT id, "subscriptionId", amount, "createdAt"::date, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "subscriptionId", amount, "createdAt"::date ORDER BY "createdAt" ASC) as rn
  FROM public.payments
)
DELETE FROM public.payments 
WHERE id IN (
  SELECT id FROM payment_duplicates WHERE rn > 1
);

-- ==============================================
-- 13. CLEAN UP ORGANIZATION_MEMBERS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate organization memberships
SELECT 'organization_members' as table_name, organization_id, user_id, COUNT(*) as duplicate_count
FROM public.organization_members 
GROUP BY organization_id, user_id 
HAVING COUNT(*) > 1;

-- Remove duplicate organization memberships
WITH org_member_duplicates AS (
  SELECT id, organization_id, user_id, created_at,
    ROW_NUMBER() OVER (PARTITION BY organization_id, user_id ORDER BY created_at ASC) as rn
  FROM public.organization_members
)
DELETE FROM public.organization_members 
WHERE id IN (
  SELECT id FROM org_member_duplicates WHERE rn > 1
);

-- ==============================================
-- 14. CLEAN UP INVITATIONS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate invitations (same email, same organization)
SELECT 'invitations' as table_name, organization_id, email, COUNT(*) as duplicate_count
FROM public.invitations 
GROUP BY organization_id, email 
HAVING COUNT(*) > 1;

-- Remove duplicate invitations (keep the most recent)
WITH invitation_duplicates AS (
  SELECT id, organization_id, email, created_at,
    ROW_NUMBER() OVER (PARTITION BY organization_id, email ORDER BY created_at DESC) as rn
  FROM public.invitations
)
DELETE FROM public.invitations 
WHERE id IN (
  SELECT id FROM invitation_duplicates WHERE rn > 1
);

-- ==============================================
-- 15. CLEAN UP SESSIONS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate sessions (same user, same token)
SELECT 'sessions' as table_name, "userId", "sessionToken", COUNT(*) as duplicate_count
FROM public.sessions 
GROUP BY "userId", "sessionToken" 
HAVING COUNT(*) > 1;

-- Remove duplicate sessions (keep the most recent)
WITH session_duplicates AS (
  SELECT id, "userId", "sessionToken", "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", "sessionToken" ORDER BY "createdAt" DESC) as rn
  FROM public.sessions
)
DELETE FROM public.sessions 
WHERE id IN (
  SELECT id FROM session_duplicates WHERE rn > 1
);

-- ==============================================
-- 16. CLEAN UP SESSION_AUDIT_LOGS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate session audit logs
SELECT 'session_audit_logs' as table_name, "userId", "sessionId", action, "createdAt"::date, COUNT(*) as duplicate_count
FROM public.session_audit_logs 
GROUP BY "userId", "sessionId", action, "createdAt"::date 
HAVING COUNT(*) > 1;

-- Remove duplicate session audit logs
WITH session_audit_duplicates AS (
  SELECT id, "userId", "sessionId", action, "createdAt"::date, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "userId", "sessionId", action, "createdAt"::date ORDER BY "createdAt" ASC) as rn
  FROM public.session_audit_logs
)
DELETE FROM public.session_audit_logs 
WHERE id IN (
  SELECT id FROM session_audit_duplicates WHERE rn > 1
);

-- ==============================================
-- 17. CLEAN UP TRUCK_COST_BREAKDOWN TABLE DUPLICATES
-- ==============================================

-- Check for duplicate truck cost breakdowns
SELECT 'truck_cost_breakdown' as table_name, "truckId", "createdAt"::date, COUNT(*) as duplicate_count
FROM public.truck_cost_breakdown 
GROUP BY "truckId", "createdAt"::date 
HAVING COUNT(*) > 1;

-- Remove duplicate truck cost breakdowns
WITH truck_cost_duplicates AS (
  SELECT id, "truckId", "createdAt"::date, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "truckId", "createdAt"::date ORDER BY "createdAt" ASC) as rn
  FROM public.truck_cost_breakdown
)
DELETE FROM public.truck_cost_breakdown 
WHERE id IN (
  SELECT id FROM truck_cost_duplicates WHERE rn > 1
);

-- ==============================================
-- 18. CLEAN UP HOS_LOGS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate HOS logs (same driver, same date)
SELECT 'hos_logs' as table_name, "driverId", "logDate", COUNT(*) as duplicate_count
FROM public.hos_logs 
GROUP BY "driverId", "logDate" 
HAVING COUNT(*) > 1;

-- Remove duplicate HOS logs
WITH hos_log_duplicates AS (
  SELECT id, "driverId", "logDate", "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "driverId", "logDate" ORDER BY "createdAt" ASC) as rn
  FROM public.hos_logs
)
DELETE FROM public.hos_logs 
WHERE id IN (
  SELECT id FROM hos_log_duplicates WHERE rn > 1
);

-- ==============================================
-- 19. CLEAN UP FUEL_PURCHASES TABLE DUPLICATES
-- ==============================================

-- Check for duplicate fuel purchases (same truck, same date, same amount)
SELECT 'fuel_purchases' as table_name, "truckId", "purchaseDate", amount, COUNT(*) as duplicate_count
FROM public.fuel_purchases 
GROUP BY "truckId", "purchaseDate", amount 
HAVING COUNT(*) > 1;

-- Remove duplicate fuel purchases
WITH fuel_purchase_duplicates AS (
  SELECT id, "truckId", "purchaseDate", amount, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "truckId", "purchaseDate", amount ORDER BY "createdAt" ASC) as rn
  FROM public.fuel_purchases
)
DELETE FROM public.fuel_purchases 
WHERE id IN (
  SELECT id FROM fuel_purchase_duplicates WHERE rn > 1
);

-- ==============================================
-- 20. CLEAN UP LOAD_STOPS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate load stops (same load, same sequence)
SELECT 'load_stops' as table_name, "loadId", sequence, COUNT(*) as duplicate_count
FROM public.load_stops 
GROUP BY "loadId", sequence 
HAVING COUNT(*) > 1;

-- Remove duplicate load stops
WITH load_stop_duplicates AS (
  SELECT id, "loadId", sequence, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "loadId", sequence ORDER BY "createdAt" ASC) as rn
  FROM public.load_stops
)
DELETE FROM public.load_stops 
WHERE id IN (
  SELECT id FROM load_stop_duplicates WHERE rn > 1
);

-- ==============================================
-- 21. CLEAN UP LOAD_PLAN_LEGS TABLE DUPLICATES
-- ==============================================

-- Check for duplicate load plan legs (same load plan, same sequence)
SELECT 'load_plan_legs' as table_name, "loadPlanId", sequence, COUNT(*) as duplicate_count
FROM public.load_plan_legs 
GROUP BY "loadPlanId", sequence 
HAVING COUNT(*) > 1;

-- Remove duplicate load plan legs
WITH load_plan_leg_duplicates AS (
  SELECT id, "loadPlanId", sequence, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "loadPlanId", sequence ORDER BY "createdAt" ASC) as rn
  FROM public.load_plan_legs
)
DELETE FROM public.load_plan_legs 
WHERE id IN (
  SELECT id FROM load_plan_leg_duplicates WHERE rn > 1
);

-- ==============================================
-- FINAL SUMMARY
-- ==============================================

-- Show final counts for all tables
SELECT 'users' as table_name, COUNT(*) as total_records FROM public.users
UNION ALL
SELECT 'trucks', COUNT(*) FROM public.trucks
UNION ALL
SELECT 'drivers', COUNT(*) FROM public.drivers
UNION ALL
SELECT 'loads', COUNT(*) FROM public.loads
UNION ALL
SELECT 'load_board', COUNT(*) FROM public.load_board
UNION ALL
SELECT 'load_plans', COUNT(*) FROM public.load_plans
UNION ALL
SELECT 'fleet_metrics', COUNT(*) FROM public.fleet_metrics
UNION ALL
SELECT 'activities', COUNT(*) FROM public.activities
UNION ALL
SELECT 'user_analytics', COUNT(*) FROM public.user_analytics
UNION ALL
SELECT 'data_input_tracking', COUNT(*) FROM public.data_input_tracking
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM public.subscriptions
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'organization_members', COUNT(*) FROM public.organization_members
UNION ALL
SELECT 'invitations', COUNT(*) FROM public.invitations
UNION ALL
SELECT 'sessions', COUNT(*) FROM public.sessions
UNION ALL
SELECT 'session_audit_logs', COUNT(*) FROM public.session_audit_logs
UNION ALL
SELECT 'truck_cost_breakdown', COUNT(*) FROM public.truck_cost_breakdown
UNION ALL
SELECT 'hos_logs', COUNT(*) FROM public.hos_logs
UNION ALL
SELECT 'fuel_purchases', COUNT(*) FROM public.fuel_purchases
UNION ALL
SELECT 'load_stops', COUNT(*) FROM public.load_stops
UNION ALL
SELECT 'load_plan_legs', COUNT(*) FROM public.load_plan_legs
ORDER BY table_name;
