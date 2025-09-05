-- Update to Per-Truck Pricing Model
-- Run this in your Supabase SQL Editor to migrate to $24.99 per truck pricing

-- First, update existing pricing plans to the new model
UPDATE pricing_plans 
SET 
  name = 'per-truck',
  "displayName" = 'Per Truck Plan',
  "minTrucks" = 1,
  "maxTrucks" = NULL,
  "basePrice" = NULL,
  "pricePerTruck" = 24.99,
  "isActive" = TRUE,
  "updatedAt" = NOW()
WHERE name IN ('starter', 'growth', 'enterprise');

-- If no existing plans, insert the new plan
INSERT INTO pricing_plans (name, "displayName", "minTrucks", "maxTrucks", "basePrice", "pricePerTruck", "isActive") 
VALUES ('per-truck', 'Per Truck Plan', 1, NULL, NULL, 24.99, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Verify the update
SELECT * FROM pricing_plans WHERE "isActive" = TRUE;

-- Update any existing subscriptions to use the new plan
UPDATE subscriptions 
SET 
  "planId" = (SELECT id FROM pricing_plans WHERE name = 'per-truck' LIMIT 1),
  "calculatedAmount" = 24.99 * "truckCount",
  "updatedAt" = NOW()
WHERE "planId" IN (
  SELECT id FROM pricing_plans 
  WHERE name IN ('starter', 'growth', 'enterprise')
);

-- Verify subscription updates
SELECT 
  s.*,
  p.name as plan_name,
  p."pricePerTruck"
FROM subscriptions s
LEFT JOIN pricing_plans p ON s."planId" = p.id
ORDER BY s."createdAt" DESC
LIMIT 10;
