-- Check all users in the database
SELECT id, email, "createdAt", "isFounder", "isAdmin", "isActive"
FROM public.users 
ORDER BY "createdAt" DESC;
