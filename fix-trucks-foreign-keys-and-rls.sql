-- =====================================================
-- Fix Trucks Foreign Keys and RLS Policies
-- This script fixes the missing foreign key constraints and updates RLS policies
-- =====================================================

-- 1) Add missing foreign key constraints
DO $$
BEGIN
  -- Add foreign key constraint for trucks.currentDriverId -> drivers.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='trucks_currentDriverId_fkey'
  ) THEN
    ALTER TABLE public.trucks
      ADD CONSTRAINT trucks_currentDriverId_fkey 
      FOREIGN KEY ("currentDriverId") REFERENCES public.drivers(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint: trucks_currentDriverId_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint trucks_currentDriverId_fkey already exists';
  END IF;

  -- Add foreign key constraint for drivers.currentTruckId -> trucks.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='drivers_currentTruckId_fkey'
  ) THEN
    ALTER TABLE public.drivers
      ADD CONSTRAINT drivers_currentTruckId_fkey 
      FOREIGN KEY ("currentTruckId") REFERENCES public.trucks(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint: drivers_currentTruckId_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint drivers_currentTruckId_fkey already exists';
  END IF;
END $$;

-- 2) Update RLS policies to use correct column names
-- Fix any policies that might be using incorrect column references

-- Update driver policies to use correct column names
DROP POLICY IF EXISTS "Driver insert own hos" ON public.hos_logs;
CREATE POLICY "Driver insert own hos" ON public.hos_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = hos_logs."driverId"
      AND d.auth_user_id = auth.uid()
      AND d.organization_id = hos_logs.organization_id
  )
);

DROP POLICY IF EXISTS "Driver update own hos" ON public.hos_logs;
CREATE POLICY "Driver update own hos" ON public.hos_logs
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = hos_logs."driverId"
      AND d.auth_user_id = auth.uid()
      AND d.organization_id = hos_logs.organization_id
  )
);

DROP POLICY IF EXISTS "Driver delete own hos" ON public.hos_logs;
CREATE POLICY "Driver delete own hos" ON public.hos_logs
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = hos_logs."driverId"
      AND d.auth_user_id = auth.uid()
      AND d.organization_id = hos_logs.organization_id
  )
);

-- Update fuel purchase policies
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

DROP POLICY IF EXISTS "Driver update own fuel" ON public.fuel_purchases;
CREATE POLICY "Driver update own fuel" ON public.fuel_purchases
FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.trucks t
    JOIN public.drivers d ON d.id = t."currentDriverId"
    WHERE t.id = fuel_purchases."truckId"
      AND d.auth_user_id = auth.uid()
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
      AND d.auth_user_id = auth.uid()
      AND t.organization_id = fuel_purchases.organization_id
  )
);

-- Update load policies for drivers
DROP POLICY IF EXISTS "Driver manage assigned loads" ON public.loads;
CREATE POLICY "Driver manage assigned loads" ON public.loads
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.trucks t
    JOIN public.drivers d ON d.id = t."currentDriverId"
    WHERE t.id = loads."truckId"
      AND d.auth_user_id = auth.uid()
      AND t.organization_id = loads.organization_id
  )
);

-- 3) Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints and RLS policies updated successfully';
END $$;
