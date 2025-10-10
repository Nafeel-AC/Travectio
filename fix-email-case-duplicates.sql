-- Fix email case duplicates in users table
-- This will normalize all emails to lowercase and remove duplicates

-- First, let's see what case-sensitive duplicates exist
SELECT LOWER(email) as normalized_email, COUNT(*) as count,
       array_agg(id ORDER BY "createdAt" ASC) as user_ids,
       array_agg(email ORDER BY "createdAt" ASC) as original_emails
FROM public.users 
WHERE email IS NOT NULL
GROUP BY LOWER(email)
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Update all emails to lowercase to prevent case conflicts
UPDATE public.users 
SET email = LOWER(email)
WHERE email IS NOT NULL;

-- Now remove duplicates after normalization (keep the oldest record)
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
