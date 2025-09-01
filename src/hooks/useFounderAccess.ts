import { useState, useEffect } from "react";
import { useAuth } from "./useSupabase";
import { supabase } from "../lib/supabase";

/**
 * Hook to check if the current user has founder-level access
 * Fetches user role data from the users table
 */
export function useFounderAccess() {
  const { user, isLoading: authLoading } = useAuth();
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
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setIsFounder(false);
          setIsAdmin(false);
        } else if (userData) {
          // Handle both numeric (1/0) and boolean values from database
          setIsFounder(Boolean(userData.isFounder === 1 || userData.isFounder === true));
          setIsAdmin(Boolean(userData.isAdmin === 1 || userData.isAdmin === true));
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