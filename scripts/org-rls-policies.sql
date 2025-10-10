-- =========================================================
-- Org‑Scoped RLS Policies (Idempotent)
--
-- Rules implemented:
-- 1) Any active organization member can VIEW all org data.
-- 2) Owners/Dispatchers can ADD/UPDATE/DELETE trucks.
-- 3) Drivers can CRUD only their OWN HOS logs, Fuel purchases, and Loads
--    (through their assigned truck / own driver record).
--
-- Assumptions:
-- - All listed domain tables include a column organization_id (uuid).
-- - Relationships:
--   * trucks("currentDriverId") → drivers(id)
--   * hos_logs("driverId") → drivers(id)
--   * fuel_purchases("truckId") → trucks(id)
--   * loads("truckId") → trucks(id)
--   * drivers("userId") maps to authenticated user for driver self-scoping
-- - RLS is ENABLED on these tables.
--
-- Safe to run multiple times.
-- =========================================================

-- 0) Enable RLS (no-op if already enabled)
ALTER TABLE public.trucks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_stops           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_purchases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hos_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_cost_breakdown ENABLE ROW LEVEL SECURITY;

-- 1) Remove legacy user-owned policies if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='trucks'
      AND policyname IN (
        'Users can view own trucks','Users can insert own trucks',
        'Users can update own trucks','Users can delete own trucks'
      )
  ) THEN
    DROP POLICY IF EXISTS "Users can view own trucks"   ON public.trucks;
    DROP POLICY IF EXISTS "Users can insert own trucks" ON public.trucks;
    DROP POLICY IF EXISTS "Users can update own trucks" ON public.trucks;
    DROP POLICY IF EXISTS "Users can delete own trucks" ON public.trucks;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='drivers'
      AND policyname IN (
        'Users can insert own drivers','Users can update own drivers','Users can delete own drivers'
      )
  ) THEN
    DROP POLICY IF EXISTS "Users can insert own drivers" ON public.drivers;
    DROP POLICY IF EXISTS "Users can update own drivers" ON public.drivers;
    DROP POLICY IF EXISTS "Users can delete own drivers" ON public.drivers;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='loads'
      AND policyname IN (
        'Users can view own loads','Users can insert own loads',
        'Users can update own loads','Users can delete own loads'
      )
  ) THEN
    DROP POLICY IF EXISTS "Users can view own loads"   ON public.loads;
    DROP POLICY IF EXISTS "Users can insert own loads" ON public.loads;
    DROP POLICY IF EXISTS "Users can update own loads" ON public.loads;
    DROP POLICY IF EXISTS "Users can delete own loads" ON public.loads;
  END IF;
END $$;

-- 2) Org members can READ all org data (apply to each table)
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

DROP POLICY IF EXISTS "Org members read loads" ON public.loads;
CREATE POLICY "Org members read loads" ON public.loads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = loads.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Org members read load_stops" ON public.load_stops;
CREATE POLICY "Org members read load_stops" ON public.load_stops
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = load_stops.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Org members read fuel_purchases" ON public.fuel_purchases;
CREATE POLICY "Org members read fuel_purchases" ON public.fuel_purchases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = fuel_purchases.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Org members read hos_logs" ON public.hos_logs;
CREATE POLICY "Org members read hos_logs" ON public.hos_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = hos_logs.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

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

-- 3) Trucks: Owner/Dispatcher can INSERT/UPDATE; Owner can DELETE
DROP POLICY IF EXISTS "Owner/Dispatcher insert trucks" ON public.trucks;
CREATE POLICY "Owner/Dispatcher insert trucks" ON public.trucks
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = trucks.organization_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','dispatcher')
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Owner/Dispatcher update trucks" ON public.trucks;
CREATE POLICY "Owner/Dispatcher update trucks" ON public.trucks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = trucks.organization_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','dispatcher')
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Owner delete trucks" ON public.trucks;
CREATE POLICY "Owner delete trucks" ON public.trucks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = trucks.organization_id
      AND m.user_id = auth.uid()
      AND m.role = 'owner'
      AND m.status = 'active'
  )
);

-- 4) Drivers directory: owner/dispatcher manage (insert/update/delete)
DROP POLICY IF EXISTS "Owner/Dispatcher insert drivers" ON public.drivers;
CREATE POLICY "Owner/Dispatcher insert drivers" ON public.drivers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = drivers.organization_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','dispatcher')
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Owner/Dispatcher update drivers" ON public.drivers;
CREATE POLICY "Owner/Dispatcher update drivers" ON public.drivers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = drivers.organization_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','dispatcher')
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Owner/Dispatcher delete drivers" ON public.drivers;
CREATE POLICY "Owner/Dispatcher delete drivers" ON public.drivers
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = drivers.organization_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','dispatcher')
      AND m.status = 'active'
  )
);

-- 5) Driver self‑managed resources (HOS, Fuel, Loads)
-- HOS: only the driver (via drivers.userId) can CRUD their own rows
DROP POLICY IF EXISTS "Driver insert own hos" ON public.hos_logs;
CREATE POLICY "Driver insert own hos" ON public.hos_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = hos_logs."driverId"
      AND d."userId" = auth.uid()
      AND d.organization_id = hos_logs.organization_id
  )
);

DROP POLICY IF EXISTS "Driver update own hos" ON public.hos_logs;
CREATE POLICY "Driver update own hos" ON public.hos_logs
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = hos_logs."driverId"
      AND d."userId" = auth.uid()
      AND d.organization_id = hos_logs.organization_id
  )
);

DROP POLICY IF EXISTS "Driver delete own hos" ON public.hos_logs;
CREATE POLICY "Driver delete own hos" ON public.hos_logs
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = hos_logs."driverId"
      AND d."userId" = auth.uid()
      AND d.organization_id = hos_logs.organization_id
  )
);

-- Fuel purchases: only for trucks the driver is currently assigned to
DROP POLICY IF EXISTS "Driver insert own fuel" ON public.fuel_purchases;
CREATE POLICY "Driver insert own fuel" ON public.fuel_purchases
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.trucks t
    JOIN public.drivers d ON d.id = t."currentDriverId"
    WHERE t.id = fuel_purchases."truckId"
      AND d."userId" = auth.uid()
      AND t.organization_id = fuel_purchases.organization_id
  )
);

DROP POLICY IF EXISTS "Driver update own fuel" ON public.fuel_purchases;
CREATE POLICY "Driver update own fuel" ON public.fuel_purchases
FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.trucks t
    JOIN public.drivers d ON d.id = t."currentDriverId"
    WHERE t.id = fuel_purchases."truckId"
      AND d."userId" = auth.uid()
      AND t.organization_id = fuel_purchases.organization_id
  )
);

DROP POLICY IF EXISTS "Driver delete own fuel" ON public.fuel_purchases;
CREATE POLICY "Driver delete own fuel" ON public.fuel_purchases
FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM public.trucks t
    JOIN public.drivers d ON d.id = t."currentDriverId"
    WHERE t.id = fuel_purchases."truckId"
      AND d."userId" = auth.uid()
      AND t.organization_id = fuel_purchases.organization_id
  )
);

-- Loads: driver can manage loads tied to their assigned truck
DROP POLICY IF EXISTS "Owner/Dispatcher write loads" ON public.loads;
CREATE POLICY "Owner/Dispatcher write loads" ON public.loads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = loads.organization_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','dispatcher')
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Driver manage assigned loads" ON public.loads;
CREATE POLICY "Driver manage assigned loads" ON public.loads
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.trucks t
    JOIN public.drivers d ON d.id = t."currentDriverId"
    WHERE t.id = loads."truckId"
      AND d."userId" = auth.uid()
      AND t.organization_id = loads.organization_id
  )
);

-- (Optional) load_stops writes can follow loads writes through application layer;
-- keep SELECT via org policy above. Add write policy if needed.

-- =========================================================
-- End of script
-- =========================================================


