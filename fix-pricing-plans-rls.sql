-- Fix pricing_plans RLS policies to ensure they work with nested queries

-- Check current policies
SELECT 'Current pricing_plans policies:' as info;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'pricing_plans';

-- Drop and recreate pricing_plans policies to be more permissive
DROP POLICY IF EXISTS "Anyone can read active pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Only founders can modify pricing plans" ON public.pricing_plans;

-- Allow all authenticated users to read active pricing plans
CREATE POLICY "Authenticated users can read active pricing plans" ON public.pricing_plans
  FOR SELECT USING (
    auth.role() = 'authenticated' AND "isActive" = true
  );

-- Only founders can modify pricing plans
CREATE POLICY "Only founders can modify pricing plans" ON public.pricing_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND "isFounder" = 1
    )
  );

-- Verify the policies were created
SELECT 'Updated pricing_plans policies:' as info;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'pricing_plans';
