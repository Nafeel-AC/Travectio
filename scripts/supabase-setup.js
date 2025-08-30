#!/usr/bin/env node

/**
 * Supabase Setup Script for Travectio Fleet Management System
 * 
 * This script helps you set up your Supabase project with the required tables
 * and configuration for the fleet management system.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  console.error('');
  console.error('Please create a .env file with your Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Travectio Fleet Management System - Supabase Setup');
console.log('===================================================');
console.log('');

async function checkConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test connection by getting user count
    const { data, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  Tables not found. This is expected for new projects.');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log(`📊 Found ${data?.length || 0} users in the system`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    return false;
  }
}

async function createTables() {
  console.log('');
  console.log('🏗️  Creating database tables...');
  console.log('Note: You need to create these tables manually in your Supabase dashboard');
  console.log('');
  
  const tables = [
    'users',
    'trucks',
    'drivers',
    'loads',
    'load_stops',
    'hos_logs',
    'load_board',
    'fleet_metrics',
    'truck_cost_breakdown',
    'load_plans',
    'load_plan_legs',
    'fuel_purchases',
    'activities',
    'user_analytics',
    'data_input_tracking',
    'system_metrics',
    'feature_analytics',
    'user_sessions',
    'session_audit_logs'
  ];
  
  console.log('Required tables:');
  tables.forEach((table, index) => {
    console.log(`  ${index + 1}. ${table}`);
  });
  
  console.log('');
  console.log('📋 To create these tables:');
  console.log('   1. Go to your Supabase dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Run the SQL commands from the schema.sql file');
  console.log('   4. Or use the table creation interface in the Table Editor');
}

async function setupRowLevelSecurity() {
  console.log('');
  console.log('🔒 Setting up Row Level Security (RLS)...');
  console.log('Note: RLS policies need to be configured manually in Supabase');
  console.log('');
  
  console.log('Key RLS policies to implement:');
  console.log('  - Users can only access their own data');
  console.log('  - Founder users can access all data');
  console.log('  - Session data is isolated by user');
  console.log('');
  
  console.log('📋 To set up RLS:');
  console.log('   1. Enable RLS on all tables in Supabase');
  console.log('   2. Create policies for each table');
  console.log('   3. Test with different user accounts');
}

async function setupAuth() {
  console.log('');
  console.log('🔐 Setting up Authentication...');
  console.log('');
  
  console.log('✅ Supabase Auth is automatically configured');
  console.log('   - Email/password authentication enabled');
  console.log('   - JWT tokens for API access');
  console.log('   - Session management handled by Supabase');
  console.log('');
  
  console.log('📋 To customize auth:');
  console.log('   1. Go to Authentication > Settings in Supabase');
  console.log('   2. Configure email templates');
  console.log('   3. Set up social providers if needed');
  console.log('   4. Configure password policies');
}

async function setupStorage() {
  console.log('');
  console.log('💾 Setting up Storage...');
  console.log('');
  
  console.log('📋 To set up file storage:');
  console.log('   1. Go to Storage in Supabase dashboard');
  console.log('   2. Create buckets for different file types');
  console.log('   3. Set up RLS policies for storage');
  console.log('   4. Configure CORS if needed');
}

async function main() {
  try {
    const isConnected = await checkConnection();
    
    if (isConnected) {
      console.log('');
      console.log('🎉 Your Supabase project is ready!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Create the required database tables');
      console.log('  2. Set up Row Level Security policies');
      console.log('  3. Configure authentication settings');
      console.log('  4. Test the system with sample data');
    } else {
      console.log('');
      console.log('📝 Setup instructions:');
      console.log('  1. Create the required database tables');
      console.log('  2. Configure environment variables');
      console.log('  3. Run this script again to verify');
    }
    
    await createTables();
    await setupRowLevelSecurity();
    await setupAuth();
    await setupStorage();
    
    console.log('');
    console.log('🎯 Setup complete!');
    console.log('');
    console.log('For detailed setup instructions, see:');
    console.log('  - Supabase documentation: https://supabase.com/docs');
    console.log('  - Project README.md file');
    console.log('');
    console.log('Happy coding! 🚀');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();
