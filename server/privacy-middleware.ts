import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Extend Express Request type to include user data
interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
  };
}

/**
 * Privacy middleware to ensure user metrics are only accessible by:
 * 1. The user themselves
 * 2. Founder-level users (highest access level)
 * 
 * This middleware should be used on any route that returns user-specific analytics/metrics
 */
export const enforceUserMetricsPrivacy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.claims?.sub;
    const requestedUserId = req.params.userId || req.query.userId || req.body.userId;

    if (!currentUserId) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Authentication required" 
      });
    }

    // Get current user's permissions
    const currentUser = await storage.getUser(currentUserId);
    if (!currentUser) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "User not found" 
      });
    }

    // Allow if user is accessing their own metrics
    if (currentUserId === requestedUserId) {
      return next();
    }

    // Allow if user is founder (highest access level)
    if (currentUser.isFounder === 1) {
      // Log founder access for audit purposes
      console.log(`[Privacy Audit] Founder ${currentUserId} accessed metrics for user ${requestedUserId}`);
      return next();
    }

    // Allow if user is admin accessing non-private metrics (optional - can be removed for stricter privacy)
    if (currentUser.isAdmin === 1) {
      // Check if the requested user has private metrics
      const requestedUserMetrics = await storage.getUserAnalytics(requestedUserId);
      if (requestedUserMetrics && requestedUserMetrics.isPrivate === 0) {
        console.log(`[Privacy Audit] Admin ${currentUserId} accessed public metrics for user ${requestedUserId}`);
        return next();
      }
    }

    // Deny access - user cannot see other users' private metrics
    return res.status(403).json({ 
      error: "Forbidden", 
      message: "Access denied. You can only view your own metrics." 
    });

  } catch (error) {
    console.error("[Privacy Middleware] Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: "Privacy check failed" 
    });
  }
};

/**
 * Middleware to ensure only founder can access all user metrics
 * Use this for endpoints that aggregate or list all user metrics
 */
export const requireFounderAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.claims?.sub;

    if (!currentUserId) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Authentication required" 
      });
    }

    const currentUser = await storage.getUser(currentUserId);
    if (!currentUser) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "User not found" 
      });
    }

    // Only allow founder access
    if (currentUser.isFounder !== 1) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "Founder access required" 
      });
    }

    console.log(`[Privacy Audit] Founder ${currentUserId} accessed all user metrics`);
    next();

  } catch (error) {
    console.error("[Founder Access Middleware] Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: "Access check failed" 
    });
  }
};

/**
 * Helper function to filter user metrics based on privacy settings
 * Returns only the metrics the current user is allowed to see
 */
export const filterUserMetricsByPrivacy = (
  metrics: any[],
  currentUserId: string,
  isFounder: boolean
) => {
  return metrics.filter(metric => {
    // Always show user's own metrics
    if (metric.userId === currentUserId) return true;
    
    // Founder can see all metrics
    if (isFounder) return true;
    
    // Otherwise, only show non-private metrics
    return metric.isPrivate === 0;
  });
};