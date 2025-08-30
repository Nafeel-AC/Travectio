-- Travectio Fleet Management System - Supabase Schema
-- Run this in your Supabase SQL Editor to create the required tables
-- Based on migrated ORM schema with enhanced RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    is_founder INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trucks table
CREATE TABLE IF NOT EXISTS trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    fixed_costs REAL NOT NULL,
    variable_costs REAL NOT NULL,
    total_miles INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    vin TEXT,
    license_plate TEXT,
    eld_device_id TEXT,
    current_driver_id UUID,
    equipment_type TEXT NOT NULL DEFAULT 'Dry Van',
    load_board_integration TEXT DEFAULT 'manual',
    elogs_integration TEXT DEFAULT 'manual',
    preferred_load_board TEXT,
    elogs_provider TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    license_number TEXT,
    cdl_class TEXT,
    phone TEXT,
    email TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loads table
CREATE TABLE IF NOT EXISTS loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    truck_id UUID REFERENCES trucks(id),
    type TEXT NOT NULL,
    pay REAL NOT NULL,
    miles INTEGER NOT NULL,
    is_profitable INTEGER NOT NULL,
    estimated_fuel_cost REAL NOT NULL DEFAULT 0,
    estimated_gallons REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    origin_city TEXT,
    origin_state TEXT,
    destination_city TEXT,
    destination_state TEXT,
    deadhead_from_city TEXT,
    deadhead_from_state TEXT,
    deadhead_miles INTEGER NOT NULL DEFAULT 0,
    total_miles_with_deadhead INTEGER NOT NULL DEFAULT 0,
    pickup_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load stops table
CREATE TABLE IF NOT EXISTS load_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    stop_number INTEGER NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    stop_type TEXT NOT NULL, -- 'pickup' or 'delivery'
    scheduled_time TIMESTAMP WITH TIME ZONE,
    actual_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HOS logs table
CREATE TABLE IF NOT EXISTS hos_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    truck_id UUID REFERENCES trucks(id),
    log_type TEXT NOT NULL, -- 'driving', 'on_duty', 'off_duty', 'sleeper_berth'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load board table (from your migrated schema)
CREATE TABLE IF NOT EXISTS load_board (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    origin_city TEXT NOT NULL,
    origin_state TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    destination_state TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    weight REAL,
    pay REAL NOT NULL,
    miles INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    load_board_provider TEXT,
    external_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load plans table (from your migrated schema)
CREATE TABLE IF NOT EXISTS load_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'draft',
    total_miles REAL NOT NULL DEFAULT 0,
    total_pay REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load plan legs table (from your migrated schema)
CREATE TABLE IF NOT EXISTS load_plan_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES load_plans(id) ON DELETE CASCADE,
    leg_number INTEGER NOT NULL,
    origin_city TEXT NOT NULL,
    origin_state TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    destination_state TEXT NOT NULL,
    miles INTEGER NOT NULL,
    pay REAL NOT NULL,
    equipment_type TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet metrics table
CREATE TABLE IF NOT EXISTS fleet_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    metric_date DATE NOT NULL,
    total_trucks INTEGER NOT NULL DEFAULT 0,
    active_trucks INTEGER NOT NULL DEFAULT 0,
    total_miles REAL NOT NULL DEFAULT 0,
    revenue_miles REAL NOT NULL DEFAULT 0,
    deadhead_miles REAL NOT NULL DEFAULT 0,
    total_revenue REAL NOT NULL DEFAULT 0,
    total_costs REAL NOT NULL DEFAULT 0,
    net_profit REAL NOT NULL DEFAULT 0,
    avg_cost_per_mile REAL NOT NULL DEFAULT 0,
    fuel_efficiency REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Truck cost breakdown table
CREATE TABLE IF NOT EXISTS truck_cost_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id UUID NOT NULL REFERENCES trucks(id),
    truck_payment REAL NOT NULL DEFAULT 0,
    trailer_payment REAL NOT NULL DEFAULT 0,
    elog_subscription REAL NOT NULL DEFAULT 0,
    liability_insurance REAL NOT NULL DEFAULT 0,
    physical_insurance REAL NOT NULL DEFAULT 0,
    cargo_insurance REAL NOT NULL DEFAULT 0,
    trailer_interchange REAL NOT NULL DEFAULT 0,
    bobtail_insurance REAL NOT NULL DEFAULT 0,
    non_trucking_liability REAL NOT NULL DEFAULT 0,
    base_plate_deduction REAL NOT NULL DEFAULT 0,
    company_phone REAL NOT NULL DEFAULT 0,
    driver_pay REAL NOT NULL DEFAULT 0,
    fuel REAL NOT NULL DEFAULT 0,
    def_fluid REAL NOT NULL DEFAULT 0,
    maintenance REAL NOT NULL DEFAULT 0,
    ifta_taxes REAL NOT NULL DEFAULT 0,
    tolls REAL NOT NULL DEFAULT 0,
    dwell_time REAL NOT NULL DEFAULT 0,
    reefer_fuel REAL NOT NULL DEFAULT 0,
    truck_parking REAL NOT NULL DEFAULT 0,
    gallons_used REAL NOT NULL DEFAULT 0,
    avg_fuel_price REAL NOT NULL DEFAULT 0,
    miles_per_gallon REAL NOT NULL DEFAULT 0,
    total_fixed_costs REAL NOT NULL DEFAULT 0,
    total_variable_costs REAL NOT NULL DEFAULT 0,
    total_weekly_costs REAL NOT NULL DEFAULT 0,
    cost_per_mile REAL NOT NULL DEFAULT 0,
    week_starting TIMESTAMP WITH TIME ZONE NOT NULL,
    week_ending TIMESTAMP WITH TIME ZONE NOT NULL,
    miles_this_week REAL NOT NULL DEFAULT 0,
    total_miles_with_deadhead REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fuel purchases table
CREATE TABLE IF NOT EXISTS fuel_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    truck_id UUID REFERENCES trucks(id),
    load_id UUID REFERENCES loads(id),
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    gallons REAL NOT NULL,
    price_per_gallon REAL NOT NULL,
    total_cost REAL NOT NULL,
    fuel_type TEXT DEFAULT 'diesel',
    odometer_reading INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table (from your migrated schema)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
    related_entity_type TEXT, -- 'truck', 'load', 'driver', etc.
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analytics table (from your migrated schema)
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_date DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data input tracking table (from your migrated schema)
CREATE TABLE IF NOT EXISTS data_input_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    input_type TEXT NOT NULL, -- 'manual', 'import', 'api'
    entity_type TEXT NOT NULL, -- 'truck', 'load', 'driver', etc.
    entity_id UUID,
    input_date TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics table (from your migrated schema)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_date DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature analytics table (from your migrated schema)
CREATE TABLE IF NOT EXISTS feature_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    user_count INTEGER NOT NULL DEFAULT 0,
    metric_date DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (from your migrated schema - renamed from user_sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    session_token TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session audit logs table
CREATE TABLE IF NOT EXISTS session_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES sessions(id),
    action TEXT NOT NULL, -- 'login', 'logout', 'timeout', 'invalidate'
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trucks_user_id ON trucks(user_id);
CREATE INDEX IF NOT EXISTS idx_loads_user_id ON loads(user_id);
CREATE INDEX IF NOT EXISTS idx_loads_truck_id ON loads(truck_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_hos_logs_driver_id ON hos_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_hos_logs_truck_id ON hos_logs(truck_id);
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_truck_id ON fuel_purchases(truck_id);
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_user_id ON fuel_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_load_id ON fuel_purchases(load_id);
CREATE INDEX IF NOT EXISTS idx_truck_cost_breakdown_truck_id ON truck_cost_breakdown(truck_id);
CREATE INDEX IF NOT EXISTS idx_load_board_user_id ON load_board(user_id);
CREATE INDEX IF NOT EXISTS idx_load_plans_user_id ON load_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_load_plan_legs_plan_id ON load_plan_legs(plan_id);
CREATE INDEX IF NOT EXISTS idx_fleet_metrics_user_id ON fleet_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_metrics_date ON fleet_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_data_input_tracking_user_id ON data_input_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON system_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_feature_analytics_date ON feature_analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_session_audit_logs_user_id ON session_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_audit_logs_session_id ON session_audit_logs(session_id);

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
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Founder can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::text 
            AND u.is_founder = 1
        )
    );

-- Trucks table policies
CREATE POLICY "Users can view own trucks" ON trucks
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Founder can view all trucks" ON trucks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::text 
            AND u.is_founder = 1
        )
    );

-- Drivers table policies
CREATE POLICY "Users can view own drivers" ON drivers
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Founder can view all drivers" ON drivers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::text 
            AND u.is_founder = 1
        )
    );

-- Loads table policies
CREATE POLICY "Users can view own loads" ON loads
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Founder can view all loads" ON loads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::text 
            AND u.is_founder = 1
        )
    );

-- Load stops table policies
CREATE POLICY "Users can view own load stops" ON load_stops
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM loads l 
            WHERE l.id = load_stops.load_id 
            AND l.user_id = auth.uid()::text
        )
    );

-- HOS logs table policies
CREATE POLICY "Users can view own HOS logs" ON hos_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = hos_logs.driver_id 
            AND d.user_id = auth.uid()::text
        )
        OR
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = hos_logs.truck_id 
            AND t.user_id = auth.uid()::text
        )
    );

-- Load board table policies
CREATE POLICY "Users can view own load board entries" ON load_board
    FOR ALL USING (auth.uid()::text = user_id);

-- Load plans table policies
CREATE POLICY "Users can view own load plans" ON load_plans
    FOR ALL USING (auth.uid()::text = user_id);

-- Load plan legs table policies
CREATE POLICY "Users can view own load plan legs" ON load_plan_legs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM load_plans lp 
            WHERE lp.id = load_plan_legs.plan_id 
            AND lp.user_id = auth.uid()::text
        )
    );

-- Fleet metrics table policies
CREATE POLICY "Users can view own fleet metrics" ON fleet_metrics
    FOR ALL USING (auth.uid()::text = user_id);

-- Truck cost breakdown table policies
CREATE POLICY "Users can view own truck costs" ON truck_cost_breakdown
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = truck_cost_breakdown.truck_id 
            AND t.user_id = auth.uid()::text
        )
    );

-- Fuel purchases table policies
CREATE POLICY "Users can view own fuel purchases" ON fuel_purchases
    FOR ALL USING (auth.uid()::text = user_id);

-- Activities table policies
CREATE POLICY "Users can view own activities" ON activities
    FOR ALL USING (auth.uid()::text = user_id);

-- User analytics table policies
CREATE POLICY "Users can view own analytics" ON user_analytics
    FOR ALL USING (auth.uid()::text = user_id);

-- Data input tracking table policies
CREATE POLICY "Users can view own data inputs" ON data_input_tracking
    FOR ALL USING (auth.uid()::text = user_id);

-- System metrics table policies (founder/admin only)
CREATE POLICY "Founder can view system metrics" ON system_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::text 
            AND u.is_founder = 1
        )
    );

-- Feature analytics table policies (founder/admin only)
CREATE POLICY "Founder can view feature analytics" ON feature_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid()::text 
            AND u.is_founder = 1
        )
    );

-- Sessions table policies
CREATE POLICY "Users can view own sessions" ON sessions
    FOR ALL USING (auth.uid()::text = user_id);

-- Session audit logs table policies
CREATE POLICY "Users can view own session logs" ON session_audit_logs
    FOR ALL USING (auth.uid()::text = user_id);

-- Insert a default founder user (uncomment and modify as needed)
-- INSERT INTO users (id, email, first_name, last_name, is_founder, is_admin, is_active)
-- VALUES ('founder-uuid', 'rrivera@travectiosolutions.com', 'Founder', 'User', 1, 1, 1);

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
