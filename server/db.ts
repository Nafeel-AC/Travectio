import dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { supabase, supabaseAdmin } from './supabase';

// Load environment variables (safe to call; other files also call dotenv.config())
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	// Don't crash silently in dev; throw to make the missing var explicit during setup
	throw new Error('DATABASE_URL environment variable is required for Drizzle DB connection');
}

// Create a Postgres client and Drizzle ORM instance connected to DATABASE_URL (Supabase Postgres)
// Note: Supabase requires SSL; passing ssl option to postgres driver. If your connection string
// already includes sslmode=require this option may be redundant.
const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });

export const db = drizzle(sql);

// Re-export Supabase clients for server-side auth/admin operations
export { supabase, supabaseAdmin };