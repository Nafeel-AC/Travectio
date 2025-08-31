import { supabase } from './supabase';

// API client utility that automatically includes JWT token
export const apiClient = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Debug: Log authentication status
    console.log('[API Client] Session:', session ? 'Found' : 'None');
    console.log('[API Client] Access token:', session?.access_token ? 'Present' : 'Missing');
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Authorization header if we have a session
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      console.log('[API Client] Authorization header added');
    } else {
      console.log('[API Client] No Authorization header - user not authenticated');
    }

    // Make the request
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      // Token might be expired, try to refresh
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      
      if (newSession?.access_token) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${newSession.access_token}`;
        return fetch(endpoint, {
          ...options,
          headers,
        });
      }
    }

    return response;
  },

  // Convenience methods
  async get(endpoint: string) {
    return this.fetch(endpoint, { method: 'GET' });
  },

  async post(endpoint: string, data?: any) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put(endpoint: string, data?: any) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async patch(endpoint: string, data?: any) {
    return this.fetch(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete(endpoint: string) {
    return this.fetch(endpoint, { method: 'DELETE' });
  },
};
