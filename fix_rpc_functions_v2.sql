-- Fix RPC functions to work without uuid_generate_v4() dependency
-- Run this in Supabase SQL editor

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.create_invitation(uuid,text,text,timestamptz);
DROP FUNCTION IF EXISTS public.accept_invitation(text);

-- Create invitation (owners only) - using gen_random_uuid() instead
CREATE OR REPLACE FUNCTION public.create_invitation(p_org_id uuid, p_email text, p_role text, p_expires_at timestamptz DEFAULT now() + interval '7 days')
RETURNS TABLE(id uuid, token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE 
  v_invitation_token text;
  v_invitation_id uuid;
BEGIN
  -- Check if caller is owner of the organization
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = p_org_id 
    AND user_id = auth.uid() 
    AND role = 'owner' 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only owners can invite';
  END IF;

  -- Generate token using gen_random_uuid() which is available by default
  v_invitation_token := gen_random_uuid()::text;

  -- Insert invitation
  INSERT INTO public.invitations (organization_id, email, role, token, expires_at, invited_by, status)
  VALUES (p_org_id, p_email, p_role, v_invitation_token, p_expires_at, auth.uid(), 'pending')
  RETURNING invitations.id INTO v_invitation_id;

  -- Return the result
  RETURN QUERY SELECT v_invitation_id, v_invitation_token;
END $$;

-- Accept invitation (recipient)
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_invitation record;
  v_user_email text;
  v_membership_id uuid;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation 
  FROM public.invitations 
  WHERE token = p_token 
  AND status='pending' 
  AND expires_at>now() 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  -- Get current user's email
  SELECT email INTO v_user_email 
  FROM public.users 
  WHERE id = auth.uid();

  -- Check if email matches
  IF lower(v_user_email) <> lower(v_invitation.email) THEN
    RAISE EXCEPTION 'Invite email does not match your account';
  END IF;

  -- Create membership
  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (v_invitation.organization_id, auth.uid(), v_invitation.role, 'active')
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET role=EXCLUDED.role, status='active'
  RETURNING organization_members.id INTO v_membership_id;

  -- Mark invitation as accepted
  UPDATE public.invitations 
  SET status='accepted' 
  WHERE invitations.id = v_invitation.id;

  RETURN v_membership_id;
END $$;

-- Set permissions
REVOKE ALL ON FUNCTION public.create_invitation(uuid,text,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_invitation(uuid,text,text,timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
