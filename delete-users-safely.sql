-- Safe way to delete users from the database
-- Run this in Supabase SQL editor

-- Option 1: Delete users and all their related data (CASCADE)
-- This will delete the user and all related records in other tables
DELETE FROM public.users 
WHERE id IN (
  -- Replace with the actual user IDs you want to delete
  'user-id-1',
  'user-id-2',
  'user-id-3'
);

-- Option 2: If you want to see what will be deleted first, run this query:
-- This shows you all the related records that will be deleted
SELECT 
  'users' as table_name,
  count(*) as record_count
FROM public.users 
WHERE id IN ('user-id-1', 'user-id-2', 'user-id-3')

UNION ALL

SELECT 
  'trucks' as table_name,
  count(*) as record_count
FROM public.trucks 
WHERE "userID" IN ('user-id-1', 'user-id-2', 'user-id-3')

UNION ALL

SELECT 
  'drivers' as table_name,
  count(*) as record_count
FROM public.drivers 
WHERE user_id IN ('user-id-1', 'user-id-2', 'user-id-3')

UNION ALL

SELECT 
  'organization_members' as table_name,
  count(*) as record_count
FROM public.organization_members 
WHERE user_id IN ('user-id-1', 'user-id-2', 'user-id-3')

UNION ALL

SELECT 
  'subscriptions' as table_name,
  count(*) as record_count
FROM public.subscriptions 
WHERE "userId" IN ('user-id-1', 'user-id-2', 'user-id-3')

UNION ALL

SELECT 
  'payments' as table_name,
  count(*) as record_count
FROM public.payments 
WHERE "userId" IN ('user-id-1', 'user-id-2', 'user-id-3');

-- Option 3: If you want to keep some data but delete users, 
-- you can set foreign keys to NULL instead of CASCADE
-- (This requires updating the foreign key constraints first)
