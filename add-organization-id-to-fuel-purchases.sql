-- Add organization_id column to fuel_purchases table if it doesn't exist
-- This allows proper organization-scoped filtering

-- Check current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='fuel_purchases' 
ORDER BY ordinal_position;

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='fuel_purchases' 
        AND column_name='organization_id'
    ) THEN
        ALTER TABLE public.fuel_purchases ADD COLUMN organization_id UUID;
        RAISE NOTICE 'Added organization_id column to fuel_purchases table';
        
        -- Add foreign key constraint to organizations table if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema='public' AND table_name='organizations'
        ) THEN
            ALTER TABLE public.fuel_purchases 
            ADD CONSTRAINT fuel_purchases_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
            RAISE NOTICE 'Added foreign key constraint for organization_id';
        END IF;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_fuel_purchases_organization_id 
        ON public.fuel_purchases(organization_id);
        RAISE NOTICE 'Added index for organization_id';
        
    ELSE
        RAISE NOTICE 'organization_id column already exists';
    END IF;
END $$;

-- Verify the new schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='fuel_purchases' 
AND column_name IN ('organization_id', 'truckId', 'createdBy', 'userId')
ORDER BY column_name;
