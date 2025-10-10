-- Add the specific user that's causing the 409 errors
-- This will break the authentication loop

-- First check if user already exists
SELECT id, email FROM public.users WHERE id = '0f519e86-3e6e-46d7-b4e5-d364607b2338';

-- Insert the user (will do nothing if already exists)
INSERT INTO public.users (
  id, 
  email, 
  "isFounder", 
  "isAdmin", 
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  '0f519e86-3e6e-46d7-b4e5-d364607b2338',
  'nafeelmannan@gmail.com',
  0,
  0,
  1,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  "updatedAt" = now();

-- Verify the user was added/updated
SELECT id, email, "createdAt", "isActive" FROM public.users WHERE id = '0f519e86-3e6e-46d7-b4e5-d364607b2338';
