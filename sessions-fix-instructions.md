# Sessions Table Fix - Manual SQL Execution

## Problem

The error `"there is no unique or exclusion constraint matching the ON CONFLICT specification"` occurs because the `sessions` table doesn't have a unique constraint on `("userId", "sessionToken")`, but the code tries to use `ON CONFLICT` with these columns.

## Solution

Execute this SQL in your Supabase SQL Editor:

```sql
-- Add unique constraint to sessions table
ALTER TABLE sessions ADD CONSTRAINT sessions_userid_sessiontoken_key UNIQUE ("userId", "sessionToken");
```

## Alternative Solution (if the above fails due to existing duplicate data)

If there are duplicate entries, you'll need to clean them first:

```sql
-- First, remove duplicate sessions (keeping the most recent one)
DELETE FROM sessions
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", "sessionToken") id
  FROM sessions
  ORDER BY "userId", "sessionToken", "updatedAt" DESC
);

-- Then add the unique constraint
ALTER TABLE sessions ADD CONSTRAINT sessions_userid_sessiontoken_key UNIQUE ("userId", "sessionToken");
```

## Steps to Apply

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Paste and execute the SQL above
4. The session errors should disappear after this

## Verification

After applying the fix, you can verify it worked by checking:

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'sessions' AND constraint_type = 'UNIQUE';
```

You should see `sessions_userid_sessiontoken_key` listed as a UNIQUE constraint.
