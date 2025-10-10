-- Clean up duplicate users in the database
-- Run this in Supabase SQL editor

-- First, let's see if there are any duplicate emails
SELECT email, COUNT(*) as count
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- If there are duplicates, we can clean them up by keeping the oldest record
-- and removing duplicates
WITH duplicates AS (
  SELECT id, email, "createdAt",
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY "createdAt" ASC) as rn
  FROM public.users
)
DELETE FROM public.users 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Also check for any users with NULL emails that might be causing issues
SELECT id, email, "createdAt" 
FROM public.users 
WHERE email IS NULL;

-- If you want to remove users with NULL emails (be careful!)
-- DELETE FROM public.users WHERE email IS NULL;
