-- Quick fix: Add pricing plans if they don't exist
-- Run this in your Supabase SQL Editor

-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    "displayName" TEXT NOT NULL,
    "minTrucks" INTEGER NOT NULL,
    "maxTrucks" INTEGER, -- NULL for unlimited
    "basePrice" NUMERIC(10,2), -- Fixed price for tier (NULL for per-truck pricing)
    "pricePerTruck" NUMERIC(10,2), -- Per truck price (for Enterprise plan)
    "stripePriceId" TEXT, -- Stripe price ID for this plan
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing plans - $24.99 per truck model (will skip if they already exist)
INSERT INTO pricing_plans (name, "displayName", "minTrucks", "maxTrucks", "basePrice", "pricePerTruck", "isActive") VALUES
('per-truck', 'Per Truck Plan', 1, NULL, NULL, 24.99, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS if not already enabled
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_plans' AND policyname = 'Anyone can read active pricing plans') THEN
        CREATE POLICY "Anyone can read active pricing plans" ON pricing_plans
            FOR SELECT USING ("isActive" = TRUE);
    END IF;
END$$;

-- Verify the data was inserted
SELECT * FROM pricing_plans ORDER BY "minTrucks";
