-- Fix sessions table unique constraint for ON CONFLICT support
-- This resolves the error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- Add unique constraint on userId and sessionToken combination
ALTER TABLE sessions ADD CONSTRAINT sessions_userid_sessiontoken_key UNIQUE ("userId", "sessionToken");
