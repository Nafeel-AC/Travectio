-- Complete Schema Setup Script
-- This script checks for missing tables and creates them with proper RLS policies
-- Safe to run multiple times - only creates what's missing

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table first (referenced by all other tables)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  firstName text,
  lastName text,
  profileImageUrl text,
  isFounder integer DEFAULT 0,
  isAdmin integer DEFAULT 0,
  isActive integer DEFAULT 1,
  phone text,
  company text,
  title text,
  terminatedAt timestamp with time zone,
  terminatedBy text,
  terminationReason text,
  instanceId text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create pricing_plans table (referenced by subscriptions)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  displayName text NOT NULL,
  minTrucks integer NOT NULL,
  maxTrucks integer,
  basePrice numeric,
  pricePerTruck numeric,
  stripePriceId text,
  isActive boolean DEFAULT true,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT pricing_plans_pkey PRIMARY KEY (id)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  planId uuid NOT NULL,
  stripeCustomerId text,
  stripeSubscriptionId text,
  truckCount integer NOT NULL DEFAULT 0,
  calculatedAmount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'::text,
  currentPeriodStart timestamp with time zone,
  currentPeriodEnd timestamp with time zone,
  cancelAtPeriodEnd boolean DEFAULT false,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_planId_fkey FOREIGN KEY (planId) REFERENCES public.pricing_plans(id) ON DELETE CASCADE
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  subscriptionId uuid NOT NULL,
  stripeInvoiceId text,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  paidAt timestamp with time zone,
  receiptUrl text,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_subscriptionId_fkey FOREIGN KEY (subscriptionId) REFERENCES public.subscriptions(id) ON DELETE CASCADE
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  sessionToken text NOT NULL,
  isActive integer NOT NULL DEFAULT 1,
  expiresAt timestamp with time zone NOT NULL,
  userAgent text,
  ipAddress text,
  lastActivity timestamp with time zone NOT NULL,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create trucks table
CREATE TABLE IF NOT EXISTS public.trucks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  name text NOT NULL,
  fixedCosts real NOT NULL,
  variableCosts real NOT NULL,
  totalMiles integer NOT NULL DEFAULT 0,
  isActive integer NOT NULL DEFAULT 1,
  vin text,
  licensePlate text,
  eldDeviceId text,
  currentDriverId uuid,
  equipmentType text NOT NULL DEFAULT 'Dry Van'::text,
  loadBoardIntegration text DEFAULT 'manual'::text,
  elogsIntegration text DEFAULT 'manual'::text,
  preferredLoadBoard text,
  elogsProvider text,
  costPerMile real,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT trucks_pkey PRIMARY KEY (id),
  CONSTRAINT trucks_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  firstName text NOT NULL,
  lastName text NOT NULL,
  name text NOT NULL,
  licenseNumber text,
  licenseState text,
  licenseExpiry date,
  cdlNumber text,
  phoneNumber text,
  email text,
  isActive integer NOT NULL DEFAULT 1,
  currentTruckId uuid,
  eldDeviceId text,
  preferredLoadTypes text[],
  notes text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT drivers_pkey PRIMARY KEY (id),
  CONSTRAINT drivers_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT drivers_currentTruckId_fkey FOREIGN KEY (currentTruckId) REFERENCES public.trucks(id) ON DELETE SET NULL
);

-- Update trucks table to reference drivers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trucks_currentDriverId_fkey' 
        AND table_name = 'trucks' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.trucks 
        ADD CONSTRAINT trucks_currentDriverId_fkey 
        FOREIGN KEY ("currentDriverId") REFERENCES public.drivers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create loads table
CREATE TABLE IF NOT EXISTS public.loads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  truckId uuid,
  type text NOT NULL,
  pay real NOT NULL,
  miles integer NOT NULL,
  isProfitable integer NOT NULL,
  estimatedFuelCost real NOT NULL DEFAULT 0,
  estimatedGallons real NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'::text,
  originCity text,
  originState text,
  destinationCity text,
  destinationState text,
  deadheadFromCity text,
  deadheadFromState text,
  deadheadMiles integer NOT NULL DEFAULT 0,
  totalMilesWithDeadhead integer NOT NULL DEFAULT 0,
  pickupDate timestamp with time zone,
  deliveryDate timestamp with time zone,
  notes text,
  commodity text,
  ratePerMile real,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT loads_pkey PRIMARY KEY (id),
  CONSTRAINT loads_truckId_fkey FOREIGN KEY (truckId) REFERENCES public.trucks(id) ON DELETE SET NULL,
  CONSTRAINT loads_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create load_stops table
CREATE TABLE IF NOT EXISTS public.load_stops (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  loadId uuid NOT NULL,
  sequence integer NOT NULL,
  type text NOT NULL,
  stopType text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  scheduledTime timestamp with time zone,
  actualTime timestamp with time zone,
  notes text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT load_stops_pkey PRIMARY KEY (id),
  CONSTRAINT load_stops_loadId_fkey FOREIGN KEY (loadId) REFERENCES public.loads(id) ON DELETE CASCADE
);

-- Create fuel_purchases table
CREATE TABLE IF NOT EXISTS public.fuel_purchases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  truckId uuid NOT NULL,
  loadId uuid,
  fuelType text NOT NULL,
  gallons real NOT NULL,
  pricePerGallon real NOT NULL,
  totalCost real NOT NULL,
  stationName text,
  stationAddress text,
  purchaseDate date NOT NULL,
  receiptNumber text,
  paymentMethod text,
  notes text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT fuel_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT fuel_purchases_truckId_fkey FOREIGN KEY (truckId) REFERENCES public.trucks(id) ON DELETE CASCADE,
  CONSTRAINT fuel_purchases_loadId_fkey FOREIGN KEY (loadId) REFERENCES public.loads(id) ON DELETE SET NULL
);

-- Create hos_logs table
CREATE TABLE IF NOT EXISTS public.hos_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  driverId uuid NOT NULL,
  truckId uuid,
  dutyStatus text NOT NULL,
  location text,
  timestamp timestamp with time zone NOT NULL,
  notes text,
  violations text[],
  driveTimeRemaining integer,
  onDutyRemaining integer,
  cycleHoursRemaining integer,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT hos_logs_pkey PRIMARY KEY (id),
  CONSTRAINT hos_logs_truckId_fkey FOREIGN KEY (truckId) REFERENCES public.trucks(id) ON DELETE SET NULL,
  CONSTRAINT hos_logs_driverId_fkey FOREIGN KEY (driverId) REFERENCES public.drivers(id) ON DELETE CASCADE
);

-- Create load_plans table
CREATE TABLE IF NOT EXISTS public.load_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  name text NOT NULL,
  description text,
  startDate date,
  endDate date,
  status text NOT NULL DEFAULT 'draft'::text,
  totalRevenue real NOT NULL DEFAULT 0,
  totalMiles real NOT NULL DEFAULT 0,
  estimatedProfit real NOT NULL DEFAULT 0,
  notes text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT load_plans_pkey PRIMARY KEY (id),
  CONSTRAINT load_plans_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create load_plan_legs table
CREATE TABLE IF NOT EXISTS public.load_plan_legs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  planId uuid NOT NULL,
  sequence integer NOT NULL,
  loadId uuid,
  originCity text NOT NULL,
  originState text NOT NULL,
  destinationCity text NOT NULL,
  destinationState text NOT NULL,
  estimatedRevenue real NOT NULL,
  estimatedMiles integer NOT NULL,
  scheduledDate date NOT NULL,
  status text NOT NULL,
  notes text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT load_plan_legs_pkey PRIMARY KEY (id),
  CONSTRAINT load_plan_legs_loadId_fkey FOREIGN KEY (loadId) REFERENCES public.loads(id) ON DELETE SET NULL,
  CONSTRAINT load_plan_legs_planId_fkey FOREIGN KEY (planId) REFERENCES public.load_plans(id) ON DELETE CASCADE
);

-- Create load_board table
CREATE TABLE IF NOT EXISTS public.load_board (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  loadBoardSource text NOT NULL,
  originCity text NOT NULL,
  originState text NOT NULL,
  destinationCity text NOT NULL,
  destinationState text NOT NULL,
  equipmentType text NOT NULL,
  weight real,
  length real,
  pay real NOT NULL,
  miles integer NOT NULL,
  ratePerMile real NOT NULL,
  pickupDate date NOT NULL,
  deliveryDate date NOT NULL,
  status text NOT NULL DEFAULT 'available'::text,
  loadBoardProvider text NOT NULL,
  externalId text,
  notes text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT load_board_pkey PRIMARY KEY (id),
  CONSTRAINT load_board_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create truck_cost_breakdown table
CREATE TABLE IF NOT EXISTS public.truck_cost_breakdown (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  truckId uuid NOT NULL,
  weekStarting date NOT NULL,
  weekEnding date NOT NULL,
  truckPayment real NOT NULL DEFAULT 0,
  trailerPayment real NOT NULL DEFAULT 0,
  elogSubscription real NOT NULL DEFAULT 0,
  liabilityInsurance real NOT NULL DEFAULT 0,
  physicalInsurance real NOT NULL DEFAULT 0,
  cargoInsurance real NOT NULL DEFAULT 0,
  trailerInterchange real NOT NULL DEFAULT 0,
  bobtailInsurance real NOT NULL DEFAULT 0,
  nonTruckingLiability real NOT NULL DEFAULT 0,
  basePlateDeduction real NOT NULL DEFAULT 0,
  companyPhone real NOT NULL DEFAULT 0,
  driverPay real NOT NULL DEFAULT 0,
  fuel real NOT NULL DEFAULT 0,
  defFluid real NOT NULL DEFAULT 0,
  maintenance real NOT NULL DEFAULT 0,
  iftaTaxes real NOT NULL DEFAULT 0,
  tolls real NOT NULL DEFAULT 0,
  dwellTime real NOT NULL DEFAULT 0,
  reeferFuel real NOT NULL DEFAULT 0,
  truckParking real NOT NULL DEFAULT 0,
  gallonsUsed real NOT NULL DEFAULT 0,
  avgFuelPrice real NOT NULL DEFAULT 0,
  milesPerGallon real NOT NULL DEFAULT 0,
  totalFixedCosts real NOT NULL DEFAULT 0,
  totalVariableCosts real NOT NULL DEFAULT 0,
  totalWeeklyCosts real NOT NULL DEFAULT 0,
  costPerMile real NOT NULL DEFAULT 0,
  milesThisWeek real NOT NULL DEFAULT 0,
  totalMilesWithDeadhead real NOT NULL DEFAULT 0,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT truck_cost_breakdown_pkey PRIMARY KEY (id),
  CONSTRAINT truck_cost_breakdown_truckId_fkey FOREIGN KEY (truckId) REFERENCES public.trucks(id) ON DELETE CASCADE
);

-- Create analytics and metrics tables
CREATE TABLE IF NOT EXISTS public.fleet_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  date date NOT NULL,
  totalRevenue real NOT NULL DEFAULT 0,
  totalMiles real NOT NULL DEFAULT 0,
  totalFuelCost real NOT NULL DEFAULT 0,
  totalMaintenanceCost real NOT NULL DEFAULT 0,
  totalDriverPay real NOT NULL DEFAULT 0,
  profitMargin real NOT NULL DEFAULT 0,
  revenuePerMile real NOT NULL DEFAULT 0,
  costPerMile real NOT NULL DEFAULT 0,
  fuelEfficiency real NOT NULL DEFAULT 0,
  notes text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT fleet_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT fleet_metrics_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.user_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  sessionId text NOT NULL,
  sessionStartTime timestamp with time zone NOT NULL,
  date date NOT NULL,
  pageViews integer NOT NULL DEFAULT 0,
  timeSpent integer NOT NULL DEFAULT 0,
  actionsPerformed integer NOT NULL DEFAULT 0,
  featuresUsed text[] NOT NULL DEFAULT '{}'::text[],
  sessionDuration integer NOT NULL DEFAULT 0,
  bounceRate real NOT NULL DEFAULT 0,
  conversionRate real NOT NULL DEFAULT 0,
  totalPageViews integer NOT NULL DEFAULT 0,
  totalTimeSpent integer NOT NULL DEFAULT 0,
  totalActions integer NOT NULL DEFAULT 0,
  avgSessionDuration real NOT NULL DEFAULT 0,
  lastActivity timestamp with time zone,
  preferredFeatures text[],
  deviceType text,
  browserType text,
  location text,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT user_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT user_analytics_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.feature_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  featureName text NOT NULL,
  usageCount integer NOT NULL DEFAULT 0,
  userCount integer NOT NULL DEFAULT 0,
  metricDate date NOT NULL,
  metadata jsonb,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT feature_analytics_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.system_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  metricName text NOT NULL,
  metricValue real NOT NULL,
  metricDate date NOT NULL,
  metadata jsonb,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT system_metrics_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  description text,
  metadata jsonb,
  timestamp timestamp with time zone NOT NULL,
  relatedTruckId uuid,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_relatedTruckId_fkey FOREIGN KEY (relatedTruckId) REFERENCES public.trucks(id) ON DELETE SET NULL,
  CONSTRAINT activities_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.data_input_tracking (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  inputType text NOT NULL,
  entityType text NOT NULL,
  entityId uuid,
  inputDate timestamp with time zone NOT NULL,
  metadata jsonb,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT data_input_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT data_input_tracking_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.session_audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  sessionId uuid,
  action text NOT NULL,
  ipAddress text,
  userAgent text,
  metadata jsonb,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT session_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT session_audit_logs_sessionId_fkey FOREIGN KEY (sessionId) REFERENCES public.sessions(id) ON DELETE CASCADE,
  CONSTRAINT session_audit_logs_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_plan_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_input_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for user-owned tables (trucks, drivers, loads, etc.)
CREATE OR REPLACE FUNCTION create_user_owned_policies(table_name text) RETURNS void AS $$
BEGIN
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON %I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON %I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON %I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON %I', table_name, table_name);
    
    -- Create new policies (using lowercase userid as PostgreSQL converts it)
    EXECUTE format('CREATE POLICY "Users can view own %I" ON %I FOR SELECT USING (auth.uid() = userid)', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (auth.uid() = userid)', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (auth.uid() = userid)', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (auth.uid() = userid)', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply policies to user-owned tables (only those with direct userId column)
SELECT create_user_owned_policies('trucks');
SELECT create_user_owned_policies('drivers');
SELECT create_user_owned_policies('loads');
SELECT create_user_owned_policies('load_plans');
SELECT create_user_owned_policies('load_board');
SELECT create_user_owned_policies('fleet_metrics');
SELECT create_user_owned_policies('user_analytics');
SELECT create_user_owned_policies('activities');
SELECT create_user_owned_policies('data_input_tracking');
SELECT create_user_owned_policies('subscriptions');
SELECT create_user_owned_policies('payments');
SELECT create_user_owned_policies('sessions');
SELECT create_user_owned_policies('session_audit_logs');

-- Additional specific policies from original schema

-- Founder can view all drivers
DROP POLICY IF EXISTS "Founder can view all drivers" ON public.drivers;
CREATE POLICY "Founder can view all drivers" ON public.drivers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Founder can view all loads
DROP POLICY IF EXISTS "Founder can view all loads" ON public.loads;
CREATE POLICY "Founder can view all loads" ON public.loads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Load stops policies (through loads relationship)
DROP POLICY IF EXISTS "Users can view own load stops" ON public.load_stops;
CREATE POLICY "Users can view own load stops" ON public.load_stops
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.loads l 
            WHERE l.id = load_stops."loadId" 
            AND l."userId" = auth.uid()
        )
    );

-- HOS logs policies (through drivers/trucks relationship)
DROP POLICY IF EXISTS "Users can view own HOS logs" ON public.hos_logs;
CREATE POLICY "Users can view own HOS logs" ON public.hos_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.drivers d 
            WHERE d.id = hos_logs."driverId" 
            AND d."userId" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.trucks t 
            WHERE t.id = hos_logs."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Load plan legs policies (through load_plans relationship)
DROP POLICY IF EXISTS "Users can view own load plan legs" ON public.load_plan_legs;
CREATE POLICY "Users can view own load plan legs" ON public.load_plan_legs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.load_plans lp 
            WHERE lp.id = load_plan_legs."planId" 
            AND lp."userId" = auth.uid()
        )
    );

-- Truck cost breakdown policies (through trucks relationship)
DROP POLICY IF EXISTS "Users can view own truck costs" ON public.truck_cost_breakdown;
CREATE POLICY "Users can view own truck costs" ON public.truck_cost_breakdown
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trucks t 
            WHERE t.id = truck_cost_breakdown."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Fuel purchases policies (through trucks relationship)
DROP POLICY IF EXISTS "Users can view own fuel purchases" ON public.fuel_purchases;
CREATE POLICY "Users can view own fuel purchases" ON public.fuel_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trucks t 
            WHERE t.id = fuel_purchases."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Activities policies (through trucks relationship or founder access)
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
CREATE POLICY "Users can view own activities" ON public.activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trucks t 
            WHERE t.id = activities."relatedTruckId" 
            AND t."userId" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Founder can see all subscriptions
DROP POLICY IF EXISTS "Founders can see all subscriptions" ON public.subscriptions;
CREATE POLICY "Founders can see all subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND "isFounder" = 1
        )
    );

-- Founder can see all payments
DROP POLICY IF EXISTS "Founders can see all payments" ON public.payments;
CREATE POLICY "Founders can see all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND "isFounder" = 1
        )
    );

-- Only founders can modify pricing plans
DROP POLICY IF EXISTS "Only founders can modify pricing plans" ON public.pricing_plans;
CREATE POLICY "Only founders can modify pricing plans" ON public.pricing_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND "isFounder" = 1
        )
    );

-- Founder can view system metrics
DROP POLICY IF EXISTS "Founder can view system metrics" ON public.system_metrics;
CREATE POLICY "Founder can view system metrics" ON public.system_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Founder can view feature analytics
DROP POLICY IF EXISTS "Founder can view feature analytics" ON public.feature_analytics;
CREATE POLICY "Founder can view feature analytics" ON public.feature_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Special policies for sessions table
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (auth.uid() = "userId");

-- Special policies for session_audit_logs
DROP POLICY IF EXISTS "Users can view own session audit logs" ON public.session_audit_logs;
CREATE POLICY "Users can view own session audit logs" ON public.session_audit_logs FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own session audit logs" ON public.session_audit_logs;
CREATE POLICY "Users can insert own session audit logs" ON public.session_audit_logs FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Public read access for pricing_plans (active plans only)
DROP POLICY IF EXISTS "Anyone can read active pricing plans" ON public.pricing_plans;
CREATE POLICY "Anyone can read active pricing plans" ON public.pricing_plans
    FOR SELECT USING ("isActive" = TRUE);

-- Admin-only policies for system tables
DROP POLICY IF EXISTS "Admins can manage feature analytics" ON public.feature_analytics;
CREATE POLICY "Admins can manage feature analytics" ON public.feature_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND "isAdmin" = 1)
);

DROP POLICY IF EXISTS "Admins can manage system metrics" ON public.system_metrics;
CREATE POLICY "Admins can manage system metrics" ON public.system_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND "isAdmin" = 1)
);

-- Additional RLS policies for complex relationships and founder access

-- Load stops table policies (through loads relationship)
DROP POLICY IF EXISTS "Users can view own load stops" ON public.load_stops;
CREATE POLICY "Users can view own load stops" ON public.load_stops
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.loads l 
            WHERE l.id = load_stops."loadId" 
            AND l."userId" = auth.uid()
        )
    );

-- HOS logs table policies (through drivers/trucks relationships)
DROP POLICY IF EXISTS "Users can view own HOS logs" ON public.hos_logs;
CREATE POLICY "Users can view own HOS logs" ON public.hos_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.drivers d 
            WHERE d.id = hos_logs."driverId" 
            AND d."userId" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.trucks t 
            WHERE t.id = hos_logs."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Load plan legs table policies (through load_plans relationship)
DROP POLICY IF EXISTS "Users can view own load plan legs" ON public.load_plan_legs;
CREATE POLICY "Users can view own load plan legs" ON public.load_plan_legs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.load_plans lp 
            WHERE lp.id = load_plan_legs."planId" 
            AND lp."userId" = auth.uid()
        )
    );

-- Truck cost breakdown table policies (through trucks relationship)
DROP POLICY IF EXISTS "Users can view own truck costs" ON public.truck_cost_breakdown;
CREATE POLICY "Users can view own truck costs" ON public.truck_cost_breakdown
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trucks t 
            WHERE t.id = truck_cost_breakdown."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Fuel purchases table policies (through trucks relationship)
DROP POLICY IF EXISTS "Users can view own fuel purchases" ON public.fuel_purchases;
CREATE POLICY "Users can view own fuel purchases" ON public.fuel_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trucks t 
            WHERE t.id = fuel_purchases."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Activities table policies (with founder access)
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
CREATE POLICY "Users can view own activities" ON public.activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trucks t 
            WHERE t.id = activities."relatedTruckId" 
            AND t."userId" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Founder access policies for drivers
DROP POLICY IF EXISTS "Founder can view all drivers" ON public.drivers;
CREATE POLICY "Founder can view all drivers" ON public.drivers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Founder access policies for loads
DROP POLICY IF EXISTS "Founder can view all loads" ON public.loads;
CREATE POLICY "Founder can view all loads" ON public.loads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Founder access policies for subscriptions
DROP POLICY IF EXISTS "Founders can see all subscriptions" ON public.subscriptions;
CREATE POLICY "Founders can see all subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND "isFounder" = 1
        )
    );

-- Founder access policies for payments
DROP POLICY IF EXISTS "Founders can see all payments" ON public.payments;
CREATE POLICY "Founders can see all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND "isFounder" = 1
        )
    );

-- Fix pricing plans policy to include isActive filter
DROP POLICY IF EXISTS "Anyone can view pricing plans" ON public.pricing_plans;
CREATE POLICY "Anyone can read active pricing plans" ON public.pricing_plans
    FOR SELECT USING ("isActive" = TRUE);

-- Add founder-only policy for pricing plans modifications
DROP POLICY IF EXISTS "Only founders can modify pricing plans" ON public.pricing_plans;
CREATE POLICY "Only founders can modify pricing plans" ON public.pricing_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND "isFounder" = 1
        )
    );

-- Fix system metrics to use isFounder instead of isAdmin
DROP POLICY IF EXISTS "Admins can manage system metrics" ON public.system_metrics;
CREATE POLICY "Founder can view system metrics" ON public.system_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Fix feature analytics to use isFounder instead of isAdmin
DROP POLICY IF EXISTS "Admins can manage feature analytics" ON public.feature_analytics;
CREATE POLICY "Founder can view feature analytics" ON public.feature_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Helper function to calculate subscription amount based on plan and truck count
CREATE OR REPLACE FUNCTION calculate_subscription_amount(plan_id UUID, truck_count INTEGER)
RETURNS NUMERIC(10,2) AS $$
DECLARE
    plan_record pricing_plans%ROWTYPE;
    calculated_amount NUMERIC(10,2);
BEGIN
    -- Get the pricing plan details
    SELECT * INTO plan_record FROM pricing_plans WHERE id = plan_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pricing plan not found';
    END IF;
    
    -- Validate truck count is within plan limits
    IF truck_count < plan_record."minTrucks" THEN
        RAISE EXCEPTION 'Truck count % is below minimum % for plan %', truck_count, plan_record."minTrucks", plan_record."displayName";
    END IF;
    
    IF plan_record."maxTrucks" IS NOT NULL AND truck_count > plan_record."maxTrucks" THEN
        RAISE EXCEPTION 'Truck count % exceeds maximum % for plan %', truck_count, plan_record."maxTrucks", plan_record."displayName";
    END IF;
    
    -- Calculate amount using per-truck pricing
    calculated_amount = plan_record."pricePerTruck" * truck_count;
    
    RETURN calculated_amount;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get recommended plan for a truck count
CREATE OR REPLACE FUNCTION get_recommended_plan(truck_count INTEGER)
RETURNS UUID AS $$
DECLARE
    plan_id UUID;
BEGIN
    -- With per-truck pricing, there's only one plan
    SELECT p.id INTO plan_id
    FROM pricing_plans p
    WHERE p."isActive" = TRUE
      AND truck_count >= p."minTrucks"
      AND (p."maxTrucks" IS NULL OR truck_count <= p."maxTrucks")
    LIMIT 1;
    
    RETURN plan_id;
END;
$$ LANGUAGE plpgsql;

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_user_owned_policies(text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trucks_user_id ON public.trucks("userId");
CREATE INDEX IF NOT EXISTS idx_loads_user_id ON public.loads("userId");
CREATE INDEX IF NOT EXISTS idx_loads_truck_id ON public.loads("truckId");
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers("userId");
CREATE INDEX IF NOT EXISTS idx_hos_logs_driver_id ON public.hos_logs("driverId");
CREATE INDEX IF NOT EXISTS idx_hos_logs_truck_id ON public.hos_logs("truckId");
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_truck_id ON public.fuel_purchases("truckId");
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_load_id ON public.fuel_purchases("loadId");
CREATE INDEX IF NOT EXISTS idx_truck_cost_breakdown_truck_id ON public.truck_cost_breakdown("truckId");
CREATE INDEX IF NOT EXISTS idx_load_board_user_id ON public.load_board("userId");
CREATE INDEX IF NOT EXISTS idx_load_plans_user_id ON public.load_plans("userId");
CREATE INDEX IF NOT EXISTS idx_load_plan_legs_plan_id ON public.load_plan_legs("planId");
CREATE INDEX IF NOT EXISTS idx_fleet_metrics_user_id ON public.fleet_metrics("userId");
CREATE INDEX IF NOT EXISTS idx_fleet_metrics_date ON public.fleet_metrics(date);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities("userId");
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics("userId");
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON public.user_analytics(date);
CREATE INDEX IF NOT EXISTS idx_data_input_tracking_user_id ON public.data_input_tracking("userId");
CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON public.system_metrics("metricDate");
CREATE INDEX IF NOT EXISTS idx_feature_analytics_date ON public.feature_analytics("metricDate");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions("sessionToken");
CREATE INDEX IF NOT EXISTS idx_session_audit_logs_user_id ON public.session_audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_session_audit_logs_session_id ON public.session_audit_logs("sessionId");
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON public.pricing_plans("isActive");
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions("planId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions("stripeCustomerId");
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments("subscriptionId");

-- Insert default pricing plan if it doesn't exist
INSERT INTO public.pricing_plans (name, displayName, minTrucks, maxTrucks, pricePerTruck, isActive)
VALUES ('per-truck', 'Per Truck Plan', 1, NULL, 24.99, true)
ON CONFLICT (name) DO NOTHING;

-- Helper function to calculate subscription amount based on plan and truck count
CREATE OR REPLACE FUNCTION calculate_subscription_amount(plan_id UUID, truck_count INTEGER)
RETURNS NUMERIC(10,2) AS $$
DECLARE
    plan_record public.pricing_plans%ROWTYPE;
    calculated_amount NUMERIC(10,2);
BEGIN
    -- Get the pricing plan details
    SELECT * INTO plan_record FROM public.pricing_plans WHERE id = plan_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pricing plan not found';
    END IF;
    
    -- Validate truck count is within plan limits
    IF truck_count < plan_record."minTrucks" THEN
        RAISE EXCEPTION 'Truck count % is below minimum % for plan %', truck_count, plan_record."minTrucks", plan_record."displayName";
    END IF;
    
    IF plan_record."maxTrucks" IS NOT NULL AND truck_count > plan_record."maxTrucks" THEN
        RAISE EXCEPTION 'Truck count % exceeds maximum % for plan %', truck_count, plan_record."maxTrucks", plan_record."displayName";
    END IF;
    
    -- Calculate amount using per-truck pricing
    calculated_amount = plan_record."pricePerTruck" * truck_count;
    
    RETURN calculated_amount;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get recommended plan for a truck count
CREATE OR REPLACE FUNCTION get_recommended_plan(truck_count INTEGER)
RETURNS UUID AS $$
DECLARE
    plan_id UUID;
BEGIN
    -- With per-truck pricing, there's only one plan
    SELECT p.id INTO plan_id
    FROM public.pricing_plans p
    WHERE p."isActive" = TRUE
      AND truck_count >= p."minTrucks"
      AND (p."maxTrucks" IS NULL OR truck_count <= p."maxTrucks")
    LIMIT 1;
    
    RETURN plan_id;
END;
$$ LANGUAGE plpgsql;

-- Table comments for documentation
COMMENT ON TABLE public.users IS 'User accounts and authentication data';
COMMENT ON TABLE public.trucks IS 'Fleet vehicles and configurations';
COMMENT ON TABLE public.drivers IS 'Driver information and assignments';
COMMENT ON TABLE public.loads IS 'Freight tracking and delivery data';
COMMENT ON TABLE public.load_stops IS 'Multi-stop load locations';
COMMENT ON TABLE public.hos_logs IS 'Hours of Service compliance logs';
COMMENT ON TABLE public.load_board IS 'Available loads from load boards';
COMMENT ON TABLE public.load_plans IS 'Multi-leg load planning';
COMMENT ON TABLE public.load_plan_legs IS 'Individual legs of load plans';
COMMENT ON TABLE public.fleet_metrics IS 'Fleet performance analytics';
COMMENT ON TABLE public.truck_cost_breakdown IS 'Detailed cost analysis per truck';
COMMENT ON TABLE public.fuel_purchases IS 'Fuel expense tracking';
COMMENT ON TABLE public.activities IS 'System activity logging';
COMMENT ON TABLE public.user_analytics IS 'User-specific analytics data';
COMMENT ON TABLE public.data_input_tracking IS 'Data input audit trail';
COMMENT ON TABLE public.system_metrics IS 'System-wide performance metrics';
COMMENT ON TABLE public.feature_analytics IS 'Feature usage analytics';
COMMENT ON TABLE public.sessions IS 'User session management';
COMMENT ON TABLE public.session_audit_logs IS 'Session activity audit trail';
COMMENT ON TABLE public.pricing_plans IS 'Available subscription plans and pricing tiers';
COMMENT ON TABLE public.subscriptions IS 'Customer subscription plans and billing details';
COMMENT ON TABLE public.payments IS 'Payment history and invoice tracking';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all tables were created successfully
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'trucks', 'drivers', 'loads', 'load_stops', 
    'hos_logs', 'load_board', 'load_plans', 'load_plan_legs',
    'fleet_metrics', 'truck_cost_breakdown', 'fuel_purchases',
    'activities', 'user_analytics', 'data_input_tracking',
    'system_metrics', 'feature_analytics', 'sessions', 'session_audit_logs',
    'pricing_plans', 'subscriptions', 'payments'
)
GROUP BY table_name
ORDER BY table_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Schema setup completed successfully! All tables created with proper RLS policies.';
END $$;
