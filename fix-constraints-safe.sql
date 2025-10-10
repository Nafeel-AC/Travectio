-- Safe way to fix foreign key constraints
-- This script will work regardless of existing constraint names

-- First, let's see what constraints exist
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
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- Now let's update constraints using a dynamic approach
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all foreign key constraints that reference users table
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
          AND ccu.table_name = 'users'
    ) LOOP
        -- Only update if the constraint doesn't already have CASCADE
        IF r.delete_rule != 'CASCADE' THEN
            -- Drop the existing constraint
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
            
            -- Add the constraint back with CASCADE
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.users(id) ON DELETE CASCADE', 
                          r.table_name, r.constraint_name, r.column_name);
            
            RAISE NOTICE 'Updated constraint % on table %', r.constraint_name, r.table_name;
        ELSE
            RAISE NOTICE 'Constraint % on table % already has CASCADE', r.constraint_name, r.table_name;
        END IF;
    END LOOP;
END $$;
