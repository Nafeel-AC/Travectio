import { supabase } from './supabase';

// Export Supabase client for direct database operations
export const db = supabase;

// Re-export supabase for convenience
export { supabase };