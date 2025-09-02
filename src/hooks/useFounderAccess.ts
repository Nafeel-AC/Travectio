import { useState, useEffect } from "react";
import { useAuth } from "./useSupabase";
import { supabase } from "../lib/supabase";

/**
 * Hook to check if the current user has founder-level access
 * Fetches user role data from the users table
 */
export function useFounderAccess() {
  const { user, loading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setIsFounder(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('isFounder, isAdmin')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setIsFounder(false);
          setIsAdmin(false);
        } else if (userData) {
          // Normalize to boolean for integer (0/1), boolean, or string '0'/'1'
          const normalizeFlag = (value: any) => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value === 1;
            if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
            return false;
          };

          setIsFounder(normalizeFlag(userData.isFounder));
          setIsAdmin(normalizeFlag(userData.isAdmin));
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setIsFounder(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserRole();
    }
  }, [user, authLoading]);
  
  return {
    isFounder,
    isAdmin,
    hasSystemAccess: isFounder, // Only founder has complete system access
    isLoading: authLoading || isLoading,
    userEmail: user?.email
  };
}