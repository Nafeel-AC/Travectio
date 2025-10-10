-- Add missing foreign key constraints
-- This script adds the missing foreign key constraint for trucks.currentDriverId -> drivers.id

-- Add foreign key constraint for trucks.currentDriverId -> drivers.id
DO $$
BEGIN
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
END $$;

-- Add foreign key constraint for drivers.currentTruckId -> trucks.id (if needed)
DO $$
BEGIN
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
