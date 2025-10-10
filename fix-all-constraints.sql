-- Fix ALL foreign key constraints to allow user deletion
-- This script handles all tables that might reference users or trucks

-- First, let's see ALL foreign key constraints in the database
SELECT 
    tc.table_name, 
    tc.constraint_name,
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Now let's fix ALL foreign key constraints dynamically
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through ALL foreign key constraints
    FOR r IN (
        SELECT 
            tc.table_name, 
            tc.constraint_name,
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            JOIN information_schema.referential_constraints AS rc
              ON tc.constraint_name = rc.constraint_name
              AND tc.table_schema = rc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND (
            -- Constraints that reference users table
            ccu.table_name = 'users' 
            OR 
            -- Constraints that reference trucks table (which might be deleted when users are deleted)
            ccu.table_name = 'trucks'
            OR
            -- Constraints that reference drivers table
            ccu.table_name = 'drivers'
            OR
            -- Constraints that reference loads table
            ccu.table_name = 'loads'
          )
    ) LOOP
        -- Only update if the constraint doesn't already have CASCADE
        IF r.delete_rule != 'CASCADE' THEN
            -- Drop the existing constraint
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
            
            -- Add the constraint back with CASCADE
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I) ON DELETE CASCADE', 
                          r.table_name, r.constraint_name, r.column_name, r.foreign_table_name, r.foreign_column_name);
            
            RAISE NOTICE 'Updated constraint % on table % (references %)', r.constraint_name, r.table_name, r.foreign_table_name;
        ELSE
            RAISE NOTICE 'Constraint % on table % already has CASCADE (references %)', r.constraint_name, r.table_name, r.foreign_table_name;
        END IF;
    END LOOP;
END $$;
