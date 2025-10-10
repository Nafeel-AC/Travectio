-- Check for duplicate emails in users table
SELECT email, COUNT(*) as count
FROM public.users 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;
