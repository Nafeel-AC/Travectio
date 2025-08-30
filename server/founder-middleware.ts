import type { RequestHandler } from "express";
import { supabaseStorage } from "./supabase-storage";

// Founder email - only this user has complete system access
const FOUNDER_EMAIL = "rrivera@travectiosolutions.com";

/**
 * Middleware to ensure only the founder can access system-wide administrative functions
 */
export const isFounder: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as any;
    
    if (!req.isAuthenticated() || !user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = user.claims.sub;
    const dbUser = await supabaseStorage.getUser(userId);

    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is the founder
    if (dbUser.email !== FOUNDER_EMAIL || !dbUser.isFounder) {
      return res.status(403).json({ 
        message: "Access denied. Founder-level privileges required." 
      });
    }

    next();
  } catch (error) {
    console.error("Founder middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Middleware to ensure users can only access their own data
 * Founders can access all data for system oversight
 */
export const enforceDataIsolation: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as any;
    
    if (!req.isAuthenticated() || !user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = user.claims.sub;
    const dbUser = await supabaseStorage.getUser(userId);

    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }

    // Founder can access all data for system oversight
    if (dbUser.email === FOUNDER_EMAIL && dbUser.isFounder) {
      (req as any).isFounderAccess = true;
      (req as any).currentUserId = userId;
      return next();
    }

    // Regular users can only access their own data
    (req as any).isFounderAccess = false;
    (req as any).currentUserId = userId;
    
    // If accessing specific user data via URL params, ensure it matches current user
    const targetUserId = req.params.userId || req.query.userId;
    if (targetUserId && targetUserId !== userId) {
      return res.status(403).json({ 
        message: "Access denied. You can only access your own data." 
      });
    }

    next();
  } catch (error) {
    console.error("Data isolation middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Set founder status for the designated founder email
 */
export async function ensureFounderSetup() {
  try {
    // Find the founder user by email
    const allUsers = await supabaseStorage.getAllUsers();
    const founderUser = allUsers.find(user => user.email === FOUNDER_EMAIL);

    if (founderUser && !founderUser.isFounder) {
      console.log(`🔧 Setting founder status for ${FOUNDER_EMAIL}`);
      await supabaseStorage.updateUser(founderUser.id, { 
        isFounder: 1,
        isAdmin: 1, // Founders are also admins
        isActive: 1
      });
      console.log(`✅ Founder status set for ${FOUNDER_EMAIL}`);
    } else if (founderUser) {
      console.log(`✅ Founder ${FOUNDER_EMAIL} already configured`);
    } else {
      console.log(`⚠️  Founder ${FOUNDER_EMAIL} not found - will be set when they first log in`);
    }
  } catch (error) {
    console.error("Error setting up founder:", error);
  }
}