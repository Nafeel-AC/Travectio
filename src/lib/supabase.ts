import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('🔍 Supabase Configuration Debug:');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
console.log('All env vars:', import.meta.env);
console.log('import.meta.env type:', typeof import.meta.env);
console.log('import.meta.env keys:', Object.keys(import.meta.env || {}));

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected');
  console.log('Window location:', window.location.href);
  console.log('Is Vite dev server:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `Missing Supabase environment variables. 
  
  Expected:
  - VITE_SUPABASE_URL: ${supabaseUrl || 'MISSING'}
  - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'PRESENT' : 'MISSING'}
  
  Please check:
  1. Your .env file exists in the project root
  2. Variables are prefixed with VITE_
  3. You're running through the Vite dev server (npm run dev)
  4. You've restarted the dev server after adding .env
  
  Current environment: ${import.meta.env.MODE || 'unknown'}
  Current directory: ${import.meta.env.PWD || 'unknown'}`;
  
  console.error('❌ Supabase Configuration Error:', errorMessage);
  
  // In development, show a more helpful error
  if (import.meta.env.DEV) {
    // Create a visible error element on the page
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc3545;
      color: white;
      padding: 20px;
      font-family: monospace;
      font-size: 14px;
      z-index: 9999;
      max-height: 50vh;
      overflow-y: auto;
      white-space: pre-wrap;
    `;
    errorDiv.innerHTML = `<strong>🚨 Supabase Configuration Error</strong><br><br>${errorMessage}`;
    document.body.appendChild(errorDiv);
  }
  
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { User, Session } from '@supabase/supabase-js';
