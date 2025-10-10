-- Idempotent RPC setup. Safe to run multiple times.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Organization RPC (SECURITY DEFINER)
-- Enforces: caller must have an active subscription
CREATE OR REPLACE FUNCTION public.create_organization(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_org_id uuid;
DECLARE v_has_sub boolean;
BEGIN
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Organization name required';
  END IF;

  -- Require an active subscription for the calling user
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE "userId" = auth.uid() AND status = 'active'
  ) INTO v_has_sub;

  IF NOT v_has_sub THEN
    RAISE EXCEPTION 'Active subscription required';
  END IF;

  INSERT INTO public.organizations (name) VALUES (p_name)
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, auth.uid(), 'owner', 'active');

  RETURN v_org_id;
END $$;

-- Ensure permissions are set (re-runnable)
REVOKE ALL ON FUNCTION public.create_organization(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization(text) TO authenticated;


