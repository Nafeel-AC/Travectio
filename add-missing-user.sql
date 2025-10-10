-- Add the missing user that's causing the loop
INSERT INTO public.users (
  id, 
  email, 
  isFounder, 
  isAdmin, 
  isActive,
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
) ON CONFLICT (id) DO NOTHING;

-- Verify the user was added
SELECT id, email, "createdAt" FROM public.users WHERE id = '0f519e86-3e6e-46d7-b4e5-d364607b2338';
