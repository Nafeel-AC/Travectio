-- Add missing broker-related columns to loads table
-- This will allow the frontend form to save broker information

-- First, check current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='loads' 
ORDER BY ordinal_position;

-- Add brokerName column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='loads' 
        AND column_name='brokerName'
    ) THEN
        ALTER TABLE public.loads ADD COLUMN "brokerName" TEXT;
        RAISE NOTICE 'Added brokerName column to loads table';
    ELSE
        RAISE NOTICE 'brokerName column already exists';
    END IF;
END $$;

-- Add brokerContact column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='loads' 
        AND column_name='brokerContact'
    ) THEN
        ALTER TABLE public.loads ADD COLUMN "brokerContact" TEXT;
        RAISE NOTICE 'Added brokerContact column to loads table';
    ELSE
        RAISE NOTICE 'brokerContact column already exists';
    END IF;
END $$;

-- Add rateConfirmation column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='loads' 
        AND column_name='rateConfirmation'
    ) THEN
        ALTER TABLE public.loads ADD COLUMN "rateConfirmation" TEXT;
        RAISE NOTICE 'Added rateConfirmation column to loads table';
    ELSE
        RAISE NOTICE 'rateConfirmation column already exists';
    END IF;
END $$;

-- Add weight column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='loads' 
        AND column_name='weight'
    ) THEN
        ALTER TABLE public.loads ADD COLUMN "weight" NUMERIC;
        RAISE NOTICE 'Added weight column to loads table';
    ELSE
        RAISE NOTICE 'weight column already exists';
    END IF;
END $$;

-- Verify the new schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='loads' 
AND column_name IN ('brokerName', 'brokerContact', 'rateConfirmation', 'weight')
ORDER BY column_name;
