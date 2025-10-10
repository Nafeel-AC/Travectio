-- Check the actual column names in organization_members table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'organization_members'
ORDER BY ordinal_position;
