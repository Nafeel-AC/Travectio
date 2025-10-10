-- Fix foreign key constraints to allow user deletion
-- Run this in Supabase SQL editor

-- First, let's see what foreign key constraints exist
-- This will help us understand the relationships

-- Check existing foreign key constraints
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
-- This will automatically delete related records when a user is deleted

-- Update trucks table foreign key
ALTER TABLE public.trucks 
DROP CONSTRAINT IF EXISTS trucks_userId_fkey;

ALTER TABLE public.trucks 
ADD CONSTRAINT trucks_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update other tables that might reference users
-- Check if drivers table has user references
ALTER TABLE public.drivers 
DROP CONSTRAINT IF EXISTS drivers_user_id_fkey;

ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update organization_members table
ALTER TABLE public.organization_members 
DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

ALTER TABLE public.organization_members 
ADD CONSTRAINT organization_members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update subscriptions table
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_userId_fkey;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update payments table
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_userId_fkey;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update invitations table
ALTER TABLE public.invitations 
DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;

ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_invited_by_fkey 
FOREIGN KEY (invited_by) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Update any other tables that might reference users
-- Check for other potential foreign keys
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_name, 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
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
          AND ccu.table_name = 'users'
          AND tc.table_name NOT IN ('trucks', 'drivers', 'organization_members', 'subscriptions', 'payments', 'invitations')
    ) LOOP
        -- Drop and recreate the constraint with CASCADE
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.users(id) ON DELETE CASCADE', 
                      r.table_name, r.constraint_name, r.column_name);
    END LOOP;
END $$;
