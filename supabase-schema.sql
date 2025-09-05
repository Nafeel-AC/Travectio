-- Travectio Fleet Management System - Supabase Schema
-- Run this in your Supabase SQL Editor to create the required tables
-- Based on migrated ORM schema with enhanced RLS policies
-- 
-- IMPORTANT: This schema uses UUID primary keys and foreign keys
-- All RLS policies properly handle UUID type comparisons
-- No more "text = uuid" operator errors!

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "profileImageUrl" TEXT,
    "isFounder" INTEGER DEFAULT 0,
    "isAdmin" INTEGER DEFAULT 0,
    "isActive" INTEGER DEFAULT 1,
    phone TEXT,
    company TEXT,
    title TEXT,
    "terminatedAt" TIMESTAMP WITH TIME ZONE,
    "terminatedBy" TEXT,
    "terminationReason" TEXT,
    "instanceId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trucks table
CREATE TABLE IF NOT EXISTS trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    "fixedCosts" REAL NOT NULL,
    "variableCosts" REAL NOT NULL,
    "totalMiles" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    vin TEXT,
    "licensePlate" TEXT,
    "eldDeviceId" TEXT,
    "currentDriverId" UUID,
    "equipmentType" TEXT NOT NULL DEFAULT 'Dry Van',
    "loadBoardIntegration" TEXT DEFAULT 'manual',
    "elogsIntegration" TEXT DEFAULT 'manual',
    "preferredLoadBoard" TEXT,
    "elogsProvider" TEXT,
    "costPerMile" REAL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    name TEXT NOT NULL,
    "licenseNumber" TEXT,
    "licenseState" TEXT,
    "licenseExpiry" DATE,
    "cdlNumber" TEXT,
    "phoneNumber" TEXT,
    email TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "currentTruckId" UUID REFERENCES trucks(id),
    "eldDeviceId" TEXT,
    "preferredLoadTypes" TEXT[],
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loads table
CREATE TABLE IF NOT EXISTS loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    "truckId" UUID REFERENCES trucks(id),
    type TEXT NOT NULL,
    pay REAL NOT NULL,
    miles INTEGER NOT NULL,
    "isProfitable" INTEGER NOT NULL,
    "estimatedFuelCost" REAL NOT NULL DEFAULT 0,
    "estimatedGallons" REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    "originCity" TEXT,
    "originState" TEXT,
    "destinationCity" TEXT,
    "destinationState" TEXT,
    "deadheadFromCity" TEXT,
    "deadheadFromState" TEXT,
    "deadheadMiles" INTEGER NOT NULL DEFAULT 0,
    "totalMilesWithDeadhead" INTEGER NOT NULL DEFAULT 0,
    "pickupDate" TIMESTAMP WITH TIME ZONE,
    "deliveryDate" TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    commodity TEXT,
    "ratePerMile" REAL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load stops table
CREATE TABLE IF NOT EXISTS load_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    type TEXT NOT NULL,
    "stopType" TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    "scheduledTime" TIMESTAMP WITH TIME ZONE,
    "actualTime" TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HOS logs table
CREATE TABLE IF NOT EXISTS hos_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL REFERENCES drivers(id),
    "truckId" UUID REFERENCES trucks(id),
    "dutyStatus" TEXT NOT NULL,
    location TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    violations TEXT[],
    "driveTimeRemaining" INTEGER,
    "onDutyRemaining" INTEGER,
    "cycleHoursRemaining" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load board table (from your migrated schema)
CREATE TABLE IF NOT EXISTS load_board (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    "loadBoardSource" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "originState" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "destinationState" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    weight REAL,
    length REAL,
    pay REAL NOT NULL,
    miles INTEGER NOT NULL,
    "ratePerMile" REAL NOT NULL,
    "pickupDate" DATE NOT NULL,
    "deliveryDate" DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    "loadBoardProvider" TEXT NOT NULL,
    "externalId" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load plans table (from your migrated schema)
CREATE TABLE IF NOT EXISTS load_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    "startDate" DATE,
    "endDate" DATE,
    status TEXT NOT NULL DEFAULT 'draft',
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "totalMiles" REAL NOT NULL DEFAULT 0,
    "estimatedProfit" REAL NOT NULL DEFAULT 0,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load plan legs table (from your migrated schema)
CREATE TABLE IF NOT EXISTS load_plan_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "planId" UUID NOT NULL REFERENCES load_plans(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    "loadId" UUID REFERENCES loads(id),
    "originCity" TEXT NOT NULL,
    "originState" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "destinationState" TEXT NOT NULL,
    "estimatedRevenue" REAL NOT NULL,
    "estimatedMiles" INTEGER NOT NULL,
    "scheduledDate" DATE NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet metrics table
CREATE TABLE IF NOT EXISTS fleet_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "totalMiles" REAL NOT NULL DEFAULT 0,
    "totalFuelCost" REAL NOT NULL DEFAULT 0,
    "totalMaintenanceCost" REAL NOT NULL DEFAULT 0,
    "totalDriverPay" REAL NOT NULL DEFAULT 0,
    "profitMargin" REAL NOT NULL DEFAULT 0,
    "revenuePerMile" REAL NOT NULL DEFAULT 0,
    "costPerMile" REAL NOT NULL DEFAULT 0,
    "fuelEfficiency" REAL NOT NULL DEFAULT 0,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Truck cost breakdown table
CREATE TABLE IF NOT EXISTS truck_cost_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "truckId" UUID NOT NULL REFERENCES trucks(id),
    "weekStarting" DATE NOT NULL,
    "weekEnding" DATE NOT NULL,
    "truckPayment" REAL NOT NULL DEFAULT 0,
    "trailerPayment" REAL NOT NULL DEFAULT 0,
    "elogSubscription" REAL NOT NULL DEFAULT 0,
    "liabilityInsurance" REAL NOT NULL DEFAULT 0,
    "physicalInsurance" REAL NOT NULL DEFAULT 0,
    "cargoInsurance" REAL NOT NULL DEFAULT 0,
    "trailerInterchange" REAL NOT NULL DEFAULT 0,
    "bobtailInsurance" REAL NOT NULL DEFAULT 0,
    "nonTruckingLiability" REAL NOT NULL DEFAULT 0,
    "basePlateDeduction" REAL NOT NULL DEFAULT 0,
    "companyPhone" REAL NOT NULL DEFAULT 0,
    "driverPay" REAL NOT NULL DEFAULT 0,
    fuel REAL NOT NULL DEFAULT 0,
    "defFluid" REAL NOT NULL DEFAULT 0,
    maintenance REAL NOT NULL DEFAULT 0,
    "iftaTaxes" REAL NOT NULL DEFAULT 0,
    tolls REAL NOT NULL DEFAULT 0,
    "dwellTime" REAL NOT NULL DEFAULT 0,
    "reeferFuel" REAL NOT NULL DEFAULT 0,
    "truckParking" REAL NOT NULL DEFAULT 0,
    "gallonsUsed" REAL NOT NULL DEFAULT 0,
    "avgFuelPrice" REAL NOT NULL DEFAULT 0,
    "milesPerGallon" REAL NOT NULL DEFAULT 0,
    "totalFixedCosts" REAL NOT NULL DEFAULT 0,
    "totalVariableCosts" REAL NOT NULL DEFAULT 0,
    "totalWeeklyCosts" REAL NOT NULL DEFAULT 0,
    "costPerMile" REAL NOT NULL DEFAULT 0,
    "milesThisWeek" REAL NOT NULL DEFAULT 0,
    "totalMilesWithDeadhead" REAL NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fuel purchases table
CREATE TABLE IF NOT EXISTS fuel_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "truckId" UUID NOT NULL REFERENCES trucks(id),
    "loadId" UUID REFERENCES loads(id),
    "fuelType" TEXT NOT NULL,
    gallons REAL NOT NULL,
    "pricePerGallon" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "stationName" TEXT,
    "stationAddress" TEXT,
    "purchaseDate" DATE NOT NULL,
    "receiptNumber" TEXT,
    "paymentMethod" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table (from your migrated schema)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    "relatedTruckId" UUID REFERENCES trucks(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analytics table (from your migrated schema)
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    "sessionId" TEXT NOT NULL,
    "sessionStartTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    date DATE NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "actionsPerformed" INTEGER NOT NULL DEFAULT 0,
    "featuresUsed" TEXT[] NOT NULL DEFAULT '{}',
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" REAL NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0,
    "totalPageViews" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "avgSessionDuration" REAL NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP WITH TIME ZONE,
    "preferredFeatures" TEXT[],
    "deviceType" TEXT,
    "browserType" TEXT,
    location TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data input tracking table (from your migrated schema)
CREATE TABLE IF NOT EXISTS data_input_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    "inputType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID,
    "inputDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics table (from your migrated schema)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "metricName" TEXT NOT NULL,
    "metricValue" REAL NOT NULL,
    "metricDate" DATE NOT NULL,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature analytics table (from your migrated schema)
CREATE TABLE IF NOT EXISTS feature_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "featureName" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "userCount" INTEGER NOT NULL DEFAULT 0,
    "metricDate" DATE NOT NULL,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (from your migrated schema - renamed from user_sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "sessionToken" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastActivity" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("userId", "sessionToken")
);

-- Session audit logs table
CREATE TABLE IF NOT EXISTS session_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "sessionId" UUID REFERENCES sessions(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trucks_user_id ON trucks("userId");
CREATE INDEX IF NOT EXISTS idx_loads_user_id ON loads("userId");
CREATE INDEX IF NOT EXISTS idx_loads_truck_id ON loads("truckId");
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers("userId");
CREATE INDEX IF NOT EXISTS idx_hos_logs_driver_id ON hos_logs("driverId");
CREATE INDEX IF NOT EXISTS idx_hos_logs_truck_id ON hos_logs("truckId");
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_truck_id ON fuel_purchases("truckId");
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_load_id ON fuel_purchases("loadId");
CREATE INDEX IF NOT EXISTS idx_truck_cost_breakdown_truck_id ON truck_cost_breakdown("truckId");
CREATE INDEX IF NOT EXISTS idx_load_board_user_id ON load_board("userId");
CREATE INDEX IF NOT EXISTS idx_load_plans_user_id ON load_plans("userId");
CREATE INDEX IF NOT EXISTS idx_load_plan_legs_plan_id ON load_plan_legs("planId");
CREATE INDEX IF NOT EXISTS idx_fleet_metrics_user_id ON fleet_metrics("userId");
CREATE INDEX IF NOT EXISTS idx_fleet_metrics_date ON fleet_metrics(date);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities("userId");
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics("userId");
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(date);
CREATE INDEX IF NOT EXISTS idx_data_input_tracking_user_id ON data_input_tracking("userId");
CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON system_metrics("metricDate");
CREATE INDEX IF NOT EXISTS idx_feature_analytics_date ON feature_analytics("metricDate");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions("sessionToken");
CREATE INDEX IF NOT EXISTS idx_session_audit_logs_user_id ON session_audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_session_audit_logs_session_id ON session_audit_logs("sessionId");

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE hos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_plan_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_input_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_audit_logs ENABLE ROW LEVEL SECURITY;

-- Comprehensive RLS Policies

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own user row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Trucks table policies
-- Only allow users to view their own trucks
CREATE POLICY "Users can view own trucks" ON trucks
    FOR SELECT USING (auth.uid() = "userId");

-- Only allow users to insert their own trucks
CREATE POLICY "Users can insert own trucks" ON trucks
    FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Only allow users to update their own trucks
CREATE POLICY "Users can update own trucks" ON trucks
    FOR UPDATE USING (auth.uid() = "userId");

-- Only allow users to delete their own trucks
CREATE POLICY "Users can delete own trucks" ON trucks
    FOR DELETE USING (auth.uid() = "userId");

-- Drivers table policies
CREATE POLICY "Users can view own drivers" ON drivers
    FOR ALL USING (auth.uid() = "userId");

CREATE POLICY "Founder can view all drivers" ON drivers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Loads table policies
CREATE POLICY "Users can view own loads" ON loads
    FOR ALL USING (auth.uid() = "userId");

CREATE POLICY "Founder can view all loads" ON loads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Load stops table policies
CREATE POLICY "Users can view own load stops" ON load_stops
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM loads l 
            WHERE l.id = load_stops."loadId" 
            AND l."userId" = auth.uid()
        )
    );

-- HOS logs table policies
CREATE POLICY "Users can view own HOS logs" ON hos_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = hos_logs."driverId" 
            AND d."userId" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = hos_logs."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Load board table policies
CREATE POLICY "Users can view own load board entries" ON load_board
    FOR ALL USING (auth.uid() = "userId");

-- Load plans table policies
CREATE POLICY "Users can view own load plans" ON load_plans
    FOR ALL USING (auth.uid() = "userId");

-- Load plan legs table policies
CREATE POLICY "Users can view own load plan legs" ON load_plan_legs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM load_plans lp 
            WHERE lp.id = load_plan_legs."planId" 
            AND lp."userId" = auth.uid()
        )
    );

-- Fleet metrics table policies
CREATE POLICY "Users can view own fleet metrics" ON fleet_metrics
    FOR ALL USING (auth.uid() = "userId");

-- Truck cost breakdown table policies
CREATE POLICY "Users can view own truck costs" ON truck_cost_breakdown
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = truck_cost_breakdown."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Fuel purchases table policies
CREATE POLICY "Users can view own fuel purchases" ON fuel_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = fuel_purchases."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Activities table policies
CREATE POLICY "Users can view own activities" ON activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = activities."relatedTruckId" 
            AND t."userId" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- User analytics table policies
CREATE POLICY "Users can view own analytics" ON user_analytics
    FOR ALL USING (auth.uid() = "userId");

-- Data input tracking table policies
CREATE POLICY "Users can view own data inputs" ON data_input_tracking
    FOR ALL USING (auth.uid() = "userId");

-- System metrics table policies (founder/admin only)
CREATE POLICY "Founder can view system metrics" ON system_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Feature analytics table policies (founder/admin only)
CREATE POLICY "Founder can view feature analytics" ON feature_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u."isFounder" = 1
        )
    );

-- Sessions table policies
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = "userId");

-- Allow users to insert and update their own sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'Users can insert own sessions'
  ) THEN
    CREATE POLICY "Users can insert own sessions" ON sessions
      FOR INSERT WITH CHECK (auth.uid() = "userId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'Users can update own sessions'
  ) THEN
    CREATE POLICY "Users can update own sessions" ON sessions
      FOR UPDATE USING (auth.uid() = "userId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'Users can delete own sessions'
  ) THEN
    CREATE POLICY "Users can delete own sessions" ON sessions
      FOR DELETE USING (auth.uid() = "userId");
  END IF;
END $$;

-- Session audit logs table policies
CREATE POLICY "Users can view own session logs" ON session_audit_logs
    FOR SELECT USING (auth.uid() = "userId");

-- Allow users to insert their own audit logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_audit_logs' AND policyname = 'Users can insert own session logs'
  ) THEN
    CREATE POLICY "Users can insert own session logs" ON session_audit_logs
      FOR INSERT WITH CHECK (auth.uid() = "userId");
  END IF;
END $$;

-- =====================================================
-- FOUNDER USER SETUP - CHOOSE ONE OPTION BELOW
-- =====================================================

-- OPTION 1: Comment out this insert and manually create the founder user after auth signup
-- This is the RECOMMENDED approach for production

-- OPTION 2: Uncomment and modify this if you want to auto-create a founder user
-- IMPORTANT: You must first sign up with this email in Supabase Auth, then get the UUID
-- Run this query to get your auth user ID: SELECT id FROM auth.users WHERE email = 'rrivera@travectiosolutions.com';
/*
INSERT INTO users (
    id, 
    email, 
    "firstName", 
    "lastName", 
    "isFounder", 
    "isAdmin", 
    "isActive"
) VALUES (
    'PASTE-YOUR-AUTH-USER-UUID-HERE', -- Replace with actual UUID from auth.users
    'rrivera@travectiosolutions.com', 
    'Founder', 
    'User', 
    1, 
    1, 
    1
) ON CONFLICT (email) DO NOTHING;
*/

-- =====================================================
-- PAYMENT AND SUBSCRIPTION TABLES
-- =====================================================

-- Pricing plans table - Define available subscription plans
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    "displayName" TEXT NOT NULL,
    "minTrucks" INTEGER NOT NULL,
    "maxTrucks" INTEGER, -- NULL for unlimited
    "basePrice" NUMERIC(10,2), -- Fixed price for tier (NULL for per-truck pricing)
    "pricePerTruck" NUMERIC(10,2), -- Per truck price (for Enterprise plan)
    "stripePriceId" TEXT, -- Stripe price ID for this plan
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing plans - $24.99 per truck model
INSERT INTO pricing_plans (name, "displayName", "minTrucks", "maxTrucks", "basePrice", "pricePerTruck", "isActive") VALUES
('per-truck', 'Per Truck Plan', 1, NULL, NULL, 24.99, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Subscriptions table - Track customer subscription details
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    "planId" UUID NOT NULL REFERENCES pricing_plans(id),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "truckCount" INTEGER NOT NULL DEFAULT 0,
    "calculatedAmount" NUMERIC(10,2) NOT NULL DEFAULT 0, -- Calculated based on plan and truck count
    status TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
    "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
    "cancelAtPeriodEnd" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table - Track payment history and invoices
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subscriptionId" UUID NOT NULL REFERENCES subscriptions(id),
    "stripeInvoiceId" TEXT,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for pricing_plans
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active pricing plans
CREATE POLICY "Anyone can read active pricing plans" ON pricing_plans
    FOR SELECT USING ("isActive" = TRUE);

-- Only founders can modify pricing plans
CREATE POLICY "Only founders can modify pricing plans" ON pricing_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND "isFounder" = 1
        )
    );

-- RLS Policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can only see their own subscriptions" ON subscriptions
    FOR ALL USING (auth.uid() = "userId");

-- Founders can see all subscriptions
CREATE POLICY "Founders can see all subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND "isFounder" = 1
        )
    );

-- RLS Policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can only see payments for their subscriptions
CREATE POLICY "Users can only see their own payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE id = "subscriptionId" AND "userId" = auth.uid()
        )
    );

-- Founders can see all payments
CREATE POLICY "Founders can see all payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND "isFounder" = 1
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

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans("isActive");
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions("planId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions("stripeCustomerId");
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments("subscriptionId");

-- Table comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE trucks IS 'Fleet vehicles and configurations';
COMMENT ON TABLE drivers IS 'Driver information and assignments';
COMMENT ON TABLE loads IS 'Freight tracking and delivery data';
COMMENT ON TABLE load_stops IS 'Multi-stop load locations';
COMMENT ON TABLE hos_logs IS 'Hours of Service compliance logs';
COMMENT ON TABLE load_board IS 'Available loads from load boards';
COMMENT ON TABLE load_plans IS 'Multi-leg load planning';
COMMENT ON TABLE load_plan_legs IS 'Individual legs of load plans';
COMMENT ON TABLE fleet_metrics IS 'Fleet performance analytics';
COMMENT ON TABLE truck_cost_breakdown IS 'Detailed cost analysis per truck';
COMMENT ON TABLE fuel_purchases IS 'Fuel expense tracking';
COMMENT ON TABLE activities IS 'System activity logging';
COMMENT ON TABLE user_analytics IS 'User-specific analytics data';
COMMENT ON TABLE data_input_tracking IS 'Data input audit trail';
COMMENT ON TABLE system_metrics IS 'System-wide performance metrics';
COMMENT ON TABLE feature_analytics IS 'Feature usage analytics';
COMMENT ON TABLE sessions IS 'User session management';
COMMENT ON TABLE session_audit_logs IS 'Session activity audit trail';
COMMENT ON TABLE pricing_plans IS 'Available subscription plans and pricing tiers';
COMMENT ON TABLE subscriptions IS 'Customer subscription plans and billing details';
COMMENT ON TABLE payments IS 'Payment history and invoice tracking';

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
