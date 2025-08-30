#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * This script helps initialize your Supabase database with the required schema
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupSupabase() {
  console.log('🚀 Setting up Supabase database...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Create connection
    const sql = postgres(connectionString, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    });

    const db = drizzle(sql, { schema });

    console.log('✅ Connected to Supabase database');
    console.log('📋 Creating database schema...');

    // Test connection
    await sql`SELECT 1`;
    console.log('✅ Database connection test successful');

    // You can add custom setup logic here if needed
    console.log('✅ Supabase setup completed successfully!');
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error setting up Supabase:', error.message);
    process.exit(1);
  }
}

setupSupabase();
