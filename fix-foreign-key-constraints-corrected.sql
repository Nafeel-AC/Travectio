-- Fix foreign key constraints to allow user deletion
-- Run this in Supabase SQL editor

-- First, let's check what foreign key constraints actually exist
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users';

-- Now let's update the foreign key constraints to CASCADE on DELETE
-- We'll drop and recreate them with proper CASCADE behavior

-- Update trucks table foreign key
ALTER TABLE public.trucks 
DROP CONSTRAINT IF EXISTS trucks_userId_fkey;

ALTER TABLE public.trucks 
ADD CONSTRAINT trucks_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update drivers table foreign key
ALTER TABLE public.drivers 
DROP CONSTRAINT IF EXISTS drivers_userId_fkey;

ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update loads table foreign key
ALTER TABLE public.loads 
DROP CONSTRAINT IF EXISTS loads_userId_fkey;

ALTER TABLE public.loads 
ADD CONSTRAINT loads_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update load_board table foreign key
ALTER TABLE public.load_board 
DROP CONSTRAINT IF EXISTS load_board_userId_fkey;

ALTER TABLE public.load_board 
ADD CONSTRAINT load_board_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update load_plans table foreign key
ALTER TABLE public.load_plans 
DROP CONSTRAINT IF EXISTS load_plans_userId_fkey;

ALTER TABLE public.load_plans 
ADD CONSTRAINT load_plans_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update fleet_metrics table foreign key
ALTER TABLE public.fleet_metrics 
DROP CONSTRAINT IF EXISTS fleet_metrics_userId_fkey;

ALTER TABLE public.fleet_metrics 
ADD CONSTRAINT fleet_metrics_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update activities table foreign key
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_userId_fkey;

ALTER TABLE public.activities 
ADD CONSTRAINT activities_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update user_analytics table foreign key
ALTER TABLE public.user_analytics 
DROP CONSTRAINT IF EXISTS user_analytics_userId_fkey;

ALTER TABLE public.user_analytics 
ADD CONSTRAINT user_analytics_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update data_input_tracking table foreign key
ALTER TABLE public.data_input_tracking 
DROP CONSTRAINT IF EXISTS data_input_tracking_userId_fkey;

ALTER TABLE public.data_input_tracking 
ADD CONSTRAINT data_input_tracking_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update subscriptions table foreign key
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_userId_fkey;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update payments table foreign key (if it exists)
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_userId_fkey;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update organization_members table foreign key
ALTER TABLE public.organization_members 
DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

ALTER TABLE public.organization_members 
ADD CONSTRAINT organization_members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update invitations table foreign key
ALTER TABLE public.invitations 
DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;

ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_invited_by_fkey 
FOREIGN KEY (invited_by) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Note: sessions and session_audit_logs already have ON DELETE CASCADE
-- so we don't need to update them
