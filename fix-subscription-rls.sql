-- =====================================================
-- FIX SUBSCRIPTION RLS POLICIES FOR ORGANIZATION-LEVEL ACCESS
-- =====================================================

-- Drop all existing conflicting policies on subscriptions
DROP POLICY IF EXISTS "Users can only see their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Founders can see all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Owner read subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Owner write subscriptions" ON public.subscriptions;

-- Create new organization-based policies for subscriptions
-- All organization members can READ the organization's subscription (shared billing)
CREATE POLICY "Organization members can read org subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = subscriptions.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Only owners can modify subscriptions (billing management)
CREATE POLICY "Only owners can modify org subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = subscriptions.organization_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

-- Founders can see all subscriptions (system admin)
CREATE POLICY "Founders can see all subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND "isFounder" = 1
    )
  );

-- Fix payments table policies too
DROP POLICY IF EXISTS "Users can only see their own payments" ON public.payments;
DROP POLICY IF EXISTS "Founders can see all payments" ON public.payments;
DROP POLICY IF EXISTS "Owner read payments" ON public.payments;
DROP POLICY IF EXISTS "Owner write payments" ON public.payments;

-- All organization members can READ payments (shared billing visibility)
CREATE POLICY "Organization members can read org payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.organization_members m ON m.organization_id = s.organization_id
      WHERE s.id = payments."subscriptionId"
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Only owners can modify payments
CREATE POLICY "Only owners can modify org payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.organization_members m ON m.organization_id = s.organization_id
      WHERE s.id = payments."subscriptionId"
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

-- Founders can see all payments
CREATE POLICY "Founders can see all payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND "isFounder" = 1
    )
  );
