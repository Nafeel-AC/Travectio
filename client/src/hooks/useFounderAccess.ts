import { useAuth } from "./useAuth";

/**
 * Hook to check if the current user has founder-level access
 * Only rrivera@travectiosolutions.com has complete system oversight
 */
export function useFounderAccess() {
  const { user, isLoading } = useAuth();
  
  // Check if user is founder - use the database flags from the authenticated user
  const userEmail = (user as any)?.email;
  // Handle both numeric (1/0) and boolean values from database
  const isFounder = Boolean((user as any)?.isFounder === 1 || (user as any)?.isFounder === true); 
  const isAdmin = Boolean((user as any)?.isAdmin === 1 || (user as any)?.isAdmin === true);
  
  return {
    isFounder,
    isAdmin,
    hasSystemAccess: isFounder, // Only founder has complete system access
    isLoading,
    userEmail
  };
}