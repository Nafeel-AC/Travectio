-- Add missing RLS DELETE policies for account deletion
-- Run this in Supabase SQL Editor

-- Users table - allow users to delete their own account
CREATE POLICY "Users can delete own account" ON users
    FOR DELETE USING (auth.uid() = id);

-- Drivers table - allow users to delete their own drivers
CREATE POLICY "Users can delete own drivers" ON drivers
    FOR DELETE USING (auth.uid() = "userId");

-- Loads table - allow users to delete their own loads
CREATE POLICY "Users can delete own loads" ON loads
    FOR DELETE USING (auth.uid() = "userId");

-- Load stops table - allow users to delete their own load stops (via loads relationship)
CREATE POLICY "Users can delete own load stops" ON load_stops
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM loads l 
            WHERE l.id = load_stops."loadId" 
            AND l."userId" = auth.uid()
        )
    );

-- HOS logs table - allow users to delete their own HOS logs (via drivers relationship)
CREATE POLICY "Users can delete own HOS logs" ON hos_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = hos_logs."driverId" 
            AND d."userId" = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = hos_logs."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Load board table - allow users to delete their own load board entries
CREATE POLICY "Users can delete own load board entries" ON load_board
    FOR DELETE USING (auth.uid() = "userId");

-- Load plans table - allow users to delete their own load plans
CREATE POLICY "Users can delete own load plans" ON load_plans
    FOR DELETE USING (auth.uid() = "userId");

-- Load plan legs table - allow users to delete their own load plan legs (via load plans relationship)
CREATE POLICY "Users can delete own load plan legs" ON load_plan_legs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM load_plans lp 
            WHERE lp.id = load_plan_legs."planId" 
            AND lp."userId" = auth.uid()
        )
    );

-- Fleet metrics table - allow users to delete their own fleet metrics
CREATE POLICY "Users can delete own fleet metrics" ON fleet_metrics
    FOR DELETE USING (auth.uid() = "userId");

-- Truck cost breakdown table - allow users to delete their own cost breakdowns (via trucks relationship)
CREATE POLICY "Users can delete own truck costs" ON truck_cost_breakdown
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = truck_cost_breakdown."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Fuel purchases table - allow users to delete their own fuel purchases (via trucks relationship)
CREATE POLICY "Users can delete own fuel purchases" ON fuel_purchases
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trucks t 
            WHERE t.id = fuel_purchases."truckId" 
            AND t."userId" = auth.uid()
        )
    );

-- Activities table - allow users to delete their own activities
CREATE POLICY "Users can delete own activities" ON activities
    FOR DELETE USING (auth.uid() = "userId");

-- User analytics table - allow users to delete their own analytics
CREATE POLICY "Users can delete own analytics" ON user_analytics
    FOR DELETE USING (auth.uid() = "userId");

-- Data input tracking table - allow users to delete their own data inputs
CREATE POLICY "Users can delete own data inputs" ON data_input_tracking
    FOR DELETE USING (auth.uid() = "userId");

-- Session audit logs table - allow users to delete their own session logs
CREATE POLICY "Users can delete own session logs" ON session_audit_logs
    FOR DELETE USING (auth.uid() = "userId");

-- Subscriptions table - allow users to delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON subscriptions
    FOR DELETE USING (auth.uid() = "userId");

-- Payments table - allow users to delete their own payments (via subscriptions relationship)
CREATE POLICY "Users can delete own payments" ON payments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM subscriptions s 
            WHERE s.id = payments."subscriptionId" 
            AND s."userId" = auth.uid()
        )
    );
