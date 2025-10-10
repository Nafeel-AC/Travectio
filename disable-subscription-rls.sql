-- Disable RLS on subscriptions and payments tables
-- Application logic already filters by organization_id

-- Drop all policies on subscriptions
DROP POLICY IF EXISTS "Org members read subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Owner write subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Owner read subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Founder can view all subscriptions" ON public.subscriptions;

-- Disable RLS on subscriptions
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- Drop all policies on payments
DROP POLICY IF EXISTS "Org members read payments" ON public.payments;
DROP POLICY IF EXISTS "Owner write payments" ON public.payments;
DROP POLICY IF EXISTS "Owner read payments" ON public.payments;
DROP POLICY IF EXISTS "Founder can view all payments" ON public.payments;

-- Disable RLS on payments
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('subscriptions', 'payments');

