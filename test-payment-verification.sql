-- Test Payment Verification Queries
-- Run these in Supabase SQL Editor after completing test payment

-- Check if subscription was created
SELECT 
  s.*,
  p.name as plan_name,
  p.displayName as plan_display_name
FROM subscriptions s
LEFT JOIN pricing_plans p ON s.planId = p.id
ORDER BY s.createdAt DESC
LIMIT 5;

-- Check if payment was recorded
SELECT 
  pay.*,
  s.userId,
  s.truckCount
FROM payments pay
LEFT JOIN subscriptions s ON pay.subscriptionId = s.id
ORDER BY pay.createdAt DESC
LIMIT 5;

-- Check user details
SELECT 
  u.email,
  u.firstName,
  u.lastName,
  u.createdAt
FROM users u
WHERE u.email = 'awaisabdullahm@gmail.com';
