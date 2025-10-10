-- =====================================================
-- Org + Role Oriented Migration (idempotent)
-- Run in Supabase SQL editor
-- =====================================================

-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Core org tables
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure a unique constraint exists on name for ON CONFLICT (name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);

-- Roles: owner, dispatcher, driver
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','dispatcher','driver')),
  status text NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','dispatcher','driver')),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Add organization_id to domain tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trucks' AND column_name='organization_id') THEN
    ALTER TABLE public.trucks ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='organization_id') THEN
    ALTER TABLE public.drivers ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='loads' AND column_name='organization_id') THEN
    ALTER TABLE public.loads ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_stops' AND column_name='organization_id') THEN
    ALTER TABLE public.load_stops ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='organization_id') THEN
    ALTER TABLE public.hos_logs ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_purchases' AND column_name='organization_id') THEN
    ALTER TABLE public.fuel_purchases ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_plans' AND column_name='organization_id') THEN
    ALTER TABLE public.load_plans ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_plan_legs' AND column_name='organization_id') THEN
    ALTER TABLE public.load_plan_legs ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_board' AND column_name='organization_id') THEN
    ALTER TABLE public.load_board ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='truck_cost_breakdown' AND column_name='organization_id') THEN
    ALTER TABLE public.truck_cost_breakdown ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fleet_metrics' AND column_name='organization_id') THEN
    ALTER TABLE public.fleet_metrics ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activities' AND column_name='organization_id') THEN
    ALTER TABLE public.activities ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_analytics' AND column_name='organization_id') THEN
    ALTER TABLE public.user_analytics ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='data_input_tracking' AND column_name='organization_id') THEN
    ALTER TABLE public.data_input_tracking ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- 4) Driver ↔ auth user mapping (optional but needed for driver login scoping)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='auth_user_id') THEN
    ALTER TABLE public.drivers ADD COLUMN auth_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5) Loads: assignedDriverId to support driver “My Loads”
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='loads' AND column_name='assignedDriverId') THEN
    ALTER TABLE public.loads ADD COLUMN "assignedDriverId" uuid REFERENCES public.drivers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6) Billing moves to organization scope
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='organization_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN organization_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='organization_id') THEN
    ALTER TABLE public.payments ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- 7) Backfill: create one organization per existing user (owner)
--    Use users.company if present, else users.email as org name
WITH candidate_users AS (
  SELECT u.id, COALESCE(NULLIF(u.company,''), u.email) AS org_name
  FROM public.users u
),
created_orgs AS (
  INSERT INTO public.organizations (name)
  SELECT DISTINCT org_name FROM candidate_users cu
  ON CONFLICT (name) DO NOTHING
  RETURNING id, name
)
INSERT INTO public.organization_members (organization_id, user_id, role, status)
SELECT o.id, u.id, 'owner', 'active'
FROM public.users u
JOIN candidate_users cu ON cu.id = u.id
JOIN public.organizations o ON o.name = cu.org_name
LEFT JOIN public.organization_members m ON m.organization_id = o.id AND m.user_id = u.id
WHERE m.id IS NULL;

-- 8) Backfill organization_id on domain tables using prior ownership via userId
-- Trucks
UPDATE public.trucks t
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE t."userId" = u.id AND t.organization_id IS NULL;

-- Drivers
UPDATE public.drivers d
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE d."userId" = u.id AND d.organization_id IS NULL;

-- Loads (+ children)
UPDATE public.loads l
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE l."userId" = u.id AND l.organization_id IS NULL;

UPDATE public.load_stops ls
SET organization_id = l.organization_id
FROM public.loads l
WHERE ls."loadId" = l.id AND ls.organization_id IS NULL;

-- HOS logs: org via driver or truck
UPDATE public.hos_logs hl
SET organization_id = d.organization_id
FROM public.drivers d
WHERE hl."driverId" = d.id AND hl.organization_id IS NULL;

UPDATE public.hos_logs hl
SET organization_id = t.organization_id
FROM public.trucks t
WHERE hl."truckId" = t.id AND hl.organization_id IS NULL AND hl.organization_id IS NULL;

-- Fuel purchases: org via truck
UPDATE public.fuel_purchases fp
SET organization_id = t.organization_id
FROM public.trucks t
WHERE fp."truckId" = t.id AND fp.organization_id IS NULL;

-- Load plans / legs
UPDATE public.load_plans lp
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE lp."userId" = u.id AND lp.organization_id IS NULL;

UPDATE public.load_plan_legs lpl
SET organization_id = lp.organization_id
FROM public.load_plans lp
WHERE lpl."planId" = lp.id AND lpl.organization_id IS NULL;

-- Load board
UPDATE public.load_board lb
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE lb."userId" = u.id AND lb.organization_id IS NULL;

-- Truck cost breakdown
UPDATE public.truck_cost_breakdown tcb
SET organization_id = t.organization_id
FROM public.trucks t
WHERE tcb."truckId" = t.id AND tcb.organization_id IS NULL;

-- Fleet metrics / analytics
UPDATE public.fleet_metrics fm
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE fm."userId" = u.id AND fm.organization_id IS NULL;

UPDATE public.activities a
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE a."userId" = u.id AND a.organization_id IS NULL;

UPDATE public.user_analytics ua
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE ua."userId" = u.id AND ua.organization_id IS NULL;

UPDATE public.data_input_tracking dit
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE dit."userId" = u.id AND dit.organization_id IS NULL;

-- Subscriptions / payments → org
UPDATE public.subscriptions s
SET organization_id = o.id
FROM public.users u
JOIN public.organizations o ON o.name = COALESCE(NULLIF(u.company,''), u.email)
WHERE s."userId" = u.id AND s.organization_id IS NULL;

UPDATE public.payments p
SET organization_id = s.organization_id
FROM public.subscriptions s
WHERE p."subscriptionId" = s.id AND p.organization_id IS NULL;

-- 9) Tighten constraints: NOT NULL + FKs + indexes
DO $$
BEGIN
  -- Set NOT NULL after backfill
  PERFORM 1 FROM public.trucks WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.trucks ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.drivers WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.drivers ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.loads WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.loads ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.load_stops WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.load_stops ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.hos_logs WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.hos_logs ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.fuel_purchases WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.fuel_purchases ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.load_plans WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.load_plans ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.load_plan_legs WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.load_plan_legs ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.load_board WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.load_board ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.truck_cost_breakdown WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.truck_cost_breakdown ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.fleet_metrics WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.fleet_metrics ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.activities WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.activities ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.user_analytics WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.user_analytics ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.data_input_tracking WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.data_input_tracking ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.subscriptions WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.subscriptions ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  PERFORM 1 FROM public.payments WHERE organization_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE public.payments ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

-- FKs (soft if not exists)
DO $$
BEGIN
  -- Domain tables
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='trucks_organization_id_fkey'
  ) THEN
    ALTER TABLE public.trucks
      ADD CONSTRAINT trucks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='drivers_organization_id_fkey') THEN
    ALTER TABLE public.drivers
      ADD CONSTRAINT drivers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loads_organization_id_fkey') THEN
    ALTER TABLE public.loads
      ADD CONSTRAINT loads_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='load_stops_organization_id_fkey') THEN
    ALTER TABLE public.load_stops
      ADD CONSTRAINT load_stops_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='hos_logs_organization_id_fkey') THEN
    ALTER TABLE public.hos_logs
      ADD CONSTRAINT hos_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fuel_purchases_organization_id_fkey') THEN
    ALTER TABLE public.fuel_purchases
      ADD CONSTRAINT fuel_purchases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='load_plans_organization_id_fkey') THEN
    ALTER TABLE public.load_plans
      ADD CONSTRAINT load_plans_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='load_plan_legs_organization_id_fkey') THEN
    ALTER TABLE public.load_plan_legs
      ADD CONSTRAINT load_plan_legs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='load_board_organization_id_fkey') THEN
    ALTER TABLE public.load_board
      ADD CONSTRAINT load_board_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='truck_cost_breakdown_organization_id_fkey') THEN
    ALTER TABLE public.truck_cost_breakdown
      ADD CONSTRAINT truck_cost_breakdown_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fleet_metrics_organization_id_fkey') THEN
    ALTER TABLE public.fleet_metrics
      ADD CONSTRAINT fleet_metrics_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='activities_organization_id_fkey') THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_analytics_organization_id_fkey') THEN
    ALTER TABLE public.user_analytics
      ADD CONSTRAINT user_analytics_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='data_input_tracking_organization_id_fkey') THEN
    ALTER TABLE public.data_input_tracking
      ADD CONSTRAINT data_input_tracking_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Billing
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscriptions_organization_id_fkey') THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='payments_organization_id_fkey') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trucks_org ON public.trucks(organization_id);
CREATE INDEX IF NOT EXISTS idx_drivers_org ON public.drivers(organization_id);
CREATE INDEX IF NOT EXISTS idx_loads_org ON public.loads(organization_id);
CREATE INDEX IF NOT EXISTS idx_load_stops_org ON public.load_stops(organization_id);
CREATE INDEX IF NOT EXISTS idx_hos_logs_org ON public.hos_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_org ON public.fuel_purchases(organization_id);
CREATE INDEX IF NOT EXISTS idx_load_plans_org ON public.load_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_load_plan_legs_org ON public.load_plan_legs(organization_id);
CREATE INDEX IF NOT EXISTS idx_load_board_org ON public.load_board(organization_id);
CREATE INDEX IF NOT EXISTS idx_truck_cost_breakdown_org ON public.truck_cost_breakdown(organization_id);
CREATE INDEX IF NOT EXISTS idx_fleet_metrics_org ON public.fleet_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_org ON public.user_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_input_tracking_org ON public.data_input_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_loads_assigned_driver ON public.loads("assignedDriverId");

-- 10) RLS enablement
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Enable RLS already exists on domain tables in your schema; keep as-is.
-- Ensure it's enabled for any not yet enabled:
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_plan_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_input_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 11) RLS Policies

-- Members can see their orgs (optional: owners see)
DROP POLICY IF EXISTS "Members can read own organizations" ON public.organizations;
CREATE POLICY "Members can read own organizations" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Members read own membership; owners manage
DROP POLICY IF EXISTS "Users read own memberships" ON public.organization_members;
CREATE POLICY "Users read own memberships" ON public.organization_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage memberships" ON public.organization_members;
CREATE POLICY "Owners manage memberships" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
        AND om.status = 'active'
    )
  );

-- Invitations: owners manage within org
DROP POLICY IF EXISTS "Owners manage invitations" ON public.invitations;
CREATE POLICY "Owners manage invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
        AND om.status = 'active'
    )
  );

-- Helper predicate: member of same org
-- Domain tables: base SELECT for any active member of same org
-- Write scopes vary by role.

-- Trucks
DROP POLICY IF EXISTS "Org members read trucks" ON public.trucks;
CREATE POLICY "Org members read trucks" ON public.trucks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = trucks.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write trucks" ON public.trucks;
CREATE POLICY "Owner or Dispatcher write trucks" ON public.trucks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = trucks.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

-- Drivers (directory)
DROP POLICY IF EXISTS "Org members read drivers" ON public.drivers;
CREATE POLICY "Org members read drivers" ON public.drivers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = drivers.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write drivers" ON public.drivers;
CREATE POLICY "Owner or Dispatcher write drivers" ON public.drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = drivers.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

-- Loads
DROP POLICY IF EXISTS "Org members read loads" ON public.loads;
CREATE POLICY "Org members read loads" ON public.loads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = loads.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.drivers d
      WHERE d.id = loads."assignedDriverId"
        AND d.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write loads" ON public.loads;
CREATE POLICY "Owner or Dispatcher write loads" ON public.loads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = loads.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

-- Load stops: link via load
DROP POLICY IF EXISTS "Org members read load_stops" ON public.load_stops;
CREATE POLICY "Org members read load_stops" ON public.load_stops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loads l
      JOIN public.organization_members m
        ON m.organization_id = l.organization_id
       AND m.user_id = auth.uid()
       AND m.status = 'active'
      WHERE l.id = load_stops."loadId"
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.loads l
      JOIN public.drivers d ON d.id = l."assignedDriverId"
      WHERE l.id = load_stops."loadId"
        AND d.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write load_stops" ON public.load_stops;
CREATE POLICY "Owner or Dispatcher write load_stops" ON public.load_stops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.loads l
      JOIN public.organization_members m
        ON m.organization_id = l.organization_id
       AND m.user_id = auth.uid()
       AND m.role IN ('owner','dispatcher')
       AND m.status = 'active'
      WHERE l.id = load_stops."loadId"
    )
  );

-- HOS logs
DROP POLICY IF EXISTS "Org members read hos_logs" ON public.hos_logs;
CREATE POLICY "Org members read hos_logs" ON public.hos_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = hos_logs.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = hos_logs."driverId"
        AND d.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write hos_logs" ON public.hos_logs;
CREATE POLICY "Owner or Dispatcher write hos_logs" ON public.hos_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = hos_logs.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

-- Driver can insert own HOS
DROP POLICY IF EXISTS "Driver insert own hos_logs" ON public.hos_logs;
CREATE POLICY "Driver insert own hos_logs" ON public.hos_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = hos_logs."driverId"
        AND d.auth_user_id = auth.uid()
        AND d.organization_id = hos_logs.organization_id
    )
  );

-- Fuel purchases
DROP POLICY IF EXISTS "Org members read fuel_purchases" ON public.fuel_purchases;
CREATE POLICY "Org members read fuel_purchases" ON public.fuel_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = fuel_purchases.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.trucks t
      JOIN public.drivers d ON d.id = t."currentDriverId"
      WHERE t.id = fuel_purchases."truckId"
        AND d.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write fuel_purchases" ON public.fuel_purchases;
CREATE POLICY "Owner or Dispatcher write fuel_purchases" ON public.fuel_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = fuel_purchases.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

-- Driver can insert their own fuel entries (for trucks in their org)
DROP POLICY IF EXISTS "Driver insert own fuel" ON public.fuel_purchases;
CREATE POLICY "Driver insert own fuel" ON public.fuel_purchases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trucks t
      JOIN public.drivers d ON d.id = t."currentDriverId"
      WHERE t.id = fuel_purchases."truckId"
        AND d.auth_user_id = auth.uid()
        AND t.organization_id = fuel_purchases.organization_id
    )
  );

-- Load plans / legs, load_board, analytics: members read; owners/dispatchers write
DROP POLICY IF EXISTS "Org members read load_plans" ON public.load_plans;
CREATE POLICY "Org members read load_plans" ON public.load_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = load_plans.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write load_plans" ON public.load_plans;
CREATE POLICY "Owner or Dispatcher write load_plans" ON public.load_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = load_plans.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Org members read load_plan_legs" ON public.load_plan_legs;
CREATE POLICY "Org members read load_plan_legs" ON public.load_plan_legs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.load_plans lp
      JOIN public.organization_members m
        ON m.organization_id = lp.organization_id
       AND m.user_id = auth.uid()
       AND m.status = 'active'
      WHERE lp.id = load_plan_legs."planId"
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write load_plan_legs" ON public.load_plan_legs;
CREATE POLICY "Owner or Dispatcher write load_plan_legs" ON public.load_plan_legs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.load_plans lp
      JOIN public.organization_members m
        ON m.organization_id = lp.organization_id
       AND m.user_id = auth.uid()
       AND m.role IN ('owner','dispatcher')
       AND m.status = 'active'
      WHERE lp.id = load_plan_legs."planId"
    )
  );

DROP POLICY IF EXISTS "Org members read load_board" ON public.load_board;
CREATE POLICY "Org members read load_board" ON public.load_board
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = load_board.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write load_board" ON public.load_board;
CREATE POLICY "Owner or Dispatcher write load_board" ON public.load_board
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = load_board.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

-- Truck cost breakdown, fleet_metrics: members read; owner/dispatcher write
DROP POLICY IF EXISTS "Org members read truck_cost_breakdown" ON public.truck_cost_breakdown;
CREATE POLICY "Org members read truck_cost_breakdown" ON public.truck_cost_breakdown
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = truck_cost_breakdown.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write truck_cost_breakdown" ON public.truck_cost_breakdown;
CREATE POLICY "Owner or Dispatcher write truck_cost_breakdown" ON public.truck_cost_breakdown
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = truck_cost_breakdown.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Org members read fleet_metrics" ON public.fleet_metrics;
CREATE POLICY "Org members read fleet_metrics" ON public.fleet_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = fleet_metrics.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write fleet_metrics" ON public.fleet_metrics;
CREATE POLICY "Owner or Dispatcher write fleet_metrics" ON public.fleet_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = fleet_metrics.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

-- Activities, user_analytics, data_input_tracking: members read; owner/dispatcher write
DROP POLICY IF EXISTS "Org members read activities" ON public.activities;
CREATE POLICY "Org members read activities" ON public.activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = activities.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write activities" ON public.activities;
CREATE POLICY "Owner or Dispatcher write activities" ON public.activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = activities.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Org members read user_analytics" ON public.user_analytics;
CREATE POLICY "Org members read user_analytics" ON public.user_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = user_analytics.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write user_analytics" ON public.user_analytics;
CREATE POLICY "Owner or Dispatcher write user_analytics" ON public.user_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = user_analytics.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Org members read data_input_tracking" ON public.data_input_tracking;
CREATE POLICY "Org members read data_input_tracking" ON public.data_input_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = data_input_tracking.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or Dispatcher write data_input_tracking" ON public.data_input_tracking;
CREATE POLICY "Owner or Dispatcher write data_input_tracking" ON public.data_input_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = data_input_tracking.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','dispatcher')
        AND m.status = 'active'
    )
  );

-- Billing: Owner only
DROP POLICY IF EXISTS "Owner read subscriptions" ON public.subscriptions;
CREATE POLICY "Owner read subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = subscriptions.organization_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner write subscriptions" ON public.subscriptions;
CREATE POLICY "Owner write subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = subscriptions.organization_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner read payments" ON public.payments;
CREATE POLICY "Owner read payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = payments.organization_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner write payments" ON public.payments;
CREATE POLICY "Owner write payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = payments.organization_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

-- 12) Optional unique constraints per org (examples)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uniq_trucks_org_license_plate') THEN
    ALTER TABLE public.trucks ADD CONSTRAINT uniq_trucks_org_license_plate UNIQUE (organization_id, "licensePlate");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uniq_drivers_org_email') THEN
    ALTER TABLE public.drivers ADD CONSTRAINT uniq_drivers_org_email UNIQUE (organization_id, email);
  END IF;
END $$;

-- 13) Comments
COMMENT ON TABLE public.organizations IS 'Tenant organizations (carriers)';
COMMENT ON TABLE public.organization_members IS 'User membership and role within organizations';
COMMENT ON TABLE public.invitations IS 'Org invitations with role and token';
COMMENT ON COLUMN public.drivers.auth_user_id IS 'Auth user id for driver login scoping';
COMMENT ON COLUMN public.loads."assignedDriverId" IS 'Driver assigned to this load';

-- 14) Done
DO $$ BEGIN RAISE NOTICE 'Org-role migration completed.'; END $$;