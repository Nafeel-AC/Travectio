-- Missing Schema Elements for New Schema
-- Run this after creating the basic tables from the new schema
-- This adds all the production-ready features missing from the new schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MISSING PAYMENT SYSTEM TABLES
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

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Core table indexes
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

-- Payment system indexes
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans("isActive");
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions("planId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions("stripeCustomerId");
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments("subscriptionId");

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
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
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON users
      FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trucks' AND policyname = 'Users can view own trucks'
  ) THEN
    CREATE POLICY "Users can view own trucks" ON trucks
      FOR SELECT USING (auth.uid() = "userId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trucks' AND policyname = 'Users can insert own trucks'
  ) THEN
    CREATE POLICY "Users can insert own trucks" ON trucks
      FOR INSERT WITH CHECK (auth.uid() = "userId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trucks' AND policyname = 'Users can update own trucks'
  ) THEN
    CREATE POLICY "Users can update own trucks" ON trucks
      FOR UPDATE USING (auth.uid() = "userId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trucks' AND policyname = 'Users can delete own trucks'
  ) THEN
    CREATE POLICY "Users can delete own trucks" ON trucks
      FOR DELETE USING (auth.uid() = "userId");
  END IF;
END $$;

-- Drivers table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'drivers' AND policyname = 'Users can view own drivers'
  ) THEN
    CREATE POLICY "Users can view own drivers" ON drivers
      FOR ALL USING (auth.uid() = "userId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'drivers' AND policyname = 'Founder can view all drivers'
  ) THEN
    CREATE POLICY "Founder can view all drivers" ON drivers
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM users u 
              WHERE u.id = auth.uid() 
              AND u."isFounder" = 1
          )
      );
  END IF;
END $$;

-- Loads table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'loads' AND policyname = 'Users can view own loads'
  ) THEN
    CREATE POLICY "Users can view own loads" ON loads
      FOR ALL USING (auth.uid() = "userId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'loads' AND policyname = 'Founder can view all loads'
  ) THEN
    CREATE POLICY "Founder can view all loads" ON loads
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM users u 
              WHERE u.id = auth.uid() 
              AND u."isFounder" = 1
          )
      );
  END IF;
END $$;

-- Load stops table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'load_stops' AND policyname = 'Users can view own load stops'
  ) THEN
    CREATE POLICY "Users can view own load stops" ON load_stops
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM loads l 
              WHERE l.id = load_stops."loadId" 
              AND l."userId" = auth.uid()
          )
      );
  END IF;
END $$;

-- HOS logs table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hos_logs' AND policyname = 'Users can view own HOS logs'
  ) THEN
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
  END IF;
END $$;

-- Load board table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'load_board' AND policyname = 'Users can view own load board entries'
  ) THEN
    CREATE POLICY "Users can view own load board entries" ON load_board
      FOR ALL USING (auth.uid() = "userId");
  END IF;
END $$;

-- Load plans table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'load_plans' AND policyname = 'Users can view own load plans'
  ) THEN
    CREATE POLICY "Users can view own load plans" ON load_plans
      FOR ALL USING (auth.uid() = "userId");
  END IF;
END $$;

-- Load plan legs table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'load_plan_legs' AND policyname = 'Users can view own load plan legs'
  ) THEN
    CREATE POLICY "Users can view own load plan legs" ON load_plan_legs
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM load_plans lp 
              WHERE lp.id = load_plan_legs."planId" 
              AND lp."userId" = auth.uid()
          )
      );
  END IF;
END $$;

-- Fleet metrics table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fleet_metrics' AND policyname = 'Users can view own fleet metrics'
  ) THEN
    CREATE POLICY "Users can view own fleet metrics" ON fleet_metrics
      FOR ALL USING (auth.uid() = "userId");
  END IF;
END $$;

-- Truck cost breakdown table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'truck_cost_breakdown' AND policyname = 'Users can view own truck costs'
  ) THEN
    CREATE POLICY "Users can view own truck costs" ON truck_cost_breakdown
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM trucks t 
              WHERE t.id = truck_cost_breakdown."truckId" 
              AND t."userId" = auth.uid()
          )
      );
  END IF;
END $$;

-- Fuel purchases table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fuel_purchases' AND policyname = 'Users can view own fuel purchases'
  ) THEN
    CREATE POLICY "Users can view own fuel purchases" ON fuel_purchases
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM trucks t 
              WHERE t.id = fuel_purchases."truckId" 
              AND t."userId" = auth.uid()
          )
      );
  END IF;
END $$;

-- Activities table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activities' AND policyname = 'Users can view own activities'
  ) THEN
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
  END IF;
END $$;

-- User analytics table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_analytics' AND policyname = 'Users can view own analytics'
  ) THEN
    CREATE POLICY "Users can view own analytics" ON user_analytics
      FOR ALL USING (auth.uid() = "userId");
  END IF;
END $$;

-- Data input tracking table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'data_input_tracking' AND policyname = 'Users can view own data inputs'
  ) THEN
    CREATE POLICY "Users can view own data inputs" ON data_input_tracking
      FOR ALL USING (auth.uid() = "userId");
  END IF;
END $$;

-- System metrics table policies (founder/admin only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_metrics' AND policyname = 'Founder can view system metrics'
  ) THEN
    CREATE POLICY "Founder can view system metrics" ON system_metrics
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM users u 
              WHERE u.id = auth.uid() 
              AND u."isFounder" = 1
          )
      );
  END IF;
END $$;

-- Feature analytics table policies (founder/admin only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feature_analytics' AND policyname = 'Founder can view feature analytics'
  ) THEN
    CREATE POLICY "Founder can view feature analytics" ON feature_analytics
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM users u 
              WHERE u.id = auth.uid() 
              AND u."isFounder" = 1
          )
      );
  END IF;
END $$;

-- Sessions table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'Users can view own sessions'
  ) THEN
    CREATE POLICY "Users can view own sessions" ON sessions
      FOR SELECT USING (auth.uid() = "userId");
  END IF;
END $$;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_audit_logs' AND policyname = 'Users can view own session logs'
  ) THEN
    CREATE POLICY "Users can view own session logs" ON session_audit_logs
      FOR SELECT USING (auth.uid() = "userId");
  END IF;
END $$;

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

-- RLS Policies for pricing_plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pricing_plans' AND policyname = 'Anyone can read active pricing plans'
  ) THEN
    CREATE POLICY "Anyone can read active pricing plans" ON pricing_plans
      FOR SELECT USING ("isActive" = TRUE);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pricing_plans' AND policyname = 'Only founders can modify pricing plans'
  ) THEN
    CREATE POLICY "Only founders can modify pricing plans" ON pricing_plans
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() AND "isFounder" = 1
          )
      );
  END IF;
END $$;

-- RLS Policies for subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Users can only see their own subscriptions'
  ) THEN
    CREATE POLICY "Users can only see their own subscriptions" ON subscriptions
      FOR ALL USING (auth.uid() = "userId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Founders can see all subscriptions'
  ) THEN
    CREATE POLICY "Founders can see all subscriptions" ON subscriptions
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() AND "isFounder" = 1
          )
      );
  END IF;
END $$;

-- RLS Policies for payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Users can only see their own payments'
  ) THEN
    CREATE POLICY "Users can only see their own payments" ON payments
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM subscriptions 
              WHERE id = "subscriptionId" AND "userId" = auth.uid()
          )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Founders can see all payments'
  ) THEN
    CREATE POLICY "Founders can see all payments" ON payments
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() AND "isFounder" = 1
          )
      );
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

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

-- =====================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- =====================================================

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
