-- Fix duplicate emails in users table
-- This script will keep the oldest user record for each email and delete duplicates

-- First, let's see what duplicates exist
SELECT email, COUNT(*) as count, 
       array_agg(id ORDER BY "createdAt" ASC) as user_ids,
       array_agg("createdAt" ORDER BY "createdAt" ASC) as created_dates
FROM public.users 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Delete duplicate users, keeping only the oldest one for each email
WITH user_duplicates AS (
  SELECT id, email, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY "createdAt" ASC) as rn
  FROM public.users
  WHERE email IS NOT NULL
)
DELETE FROM public.users 
WHERE id IN (
  SELECT id FROM user_duplicates WHERE rn > 1
);

-- Verify no duplicates remain
SELECT 'After cleanup - duplicate emails:' as status;
SELECT email, COUNT(*) as count
FROM public.users 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;
