import session from "express-session";
import type { Express, RequestHandler } from "express";
import { supabase, supabaseAdmin } from "./supabase";
import { supabaseStorage } from "./supabase-storage";
import dotenv from 'dotenv';

dotenv.config();

// Supabase authentication configuration
console.log('[Auth] Using Supabase authentication system');

export function getSession(): RequestHandler {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Determine if we should use secure cookies based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const useSecureCookies = isProduction;
  
  console.log(`[Session Config] Environment: ${process.env.NODE_ENV}, Secure cookies: ${useSecureCookies}`);
  
  // Use memory store for sessions (Supabase handles user sessions separately)
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      httpOnly: true,
      secure: useSecureCookies,
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

async function upsertUser(userData: any) {
  try {
    const email = userData.email;
    const userId = userData.id;
    
    console.log(`[Auth] Processing user upsert for: ${email} (ID: ${userId})`);
    
    // Check if this is the founder email
    const isFounderEmail = email === "rrivera@travectiosolutions.com";
    
    await supabaseStorage.upsertUser({
      id: userId,
      email: email,
      firstName: userData.user_metadata?.first_name || userData.email?.split('@')[0] || '',
      lastName: userData.user_metadata?.last_name || '',
      profileImageUrl: userData.user_metadata?.avatar_url,
      // Set founder and admin status for the designated founder email
      ...(isFounderEmail && {
        isFounder: 1,
        isAdmin: 1,
        isActive: 1
      })
    });
    
    if (isFounderEmail) {
      console.log(`🔧 Founder access granted to ${email}`);
    } else {
      console.log(`✅ User account processed: ${email}`);
    }
    
    return userId;
  } catch (error) {
    console.error("[Auth] Error during user upsert:", error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Middleware to handle Supabase authentication
  app.use(async (req, res, next) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Verify the JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          console.log('[Auth] Invalid or expired token');
          return next();
        }
        
        // Get or create user in our system
        const userId = await upsertUser(user);
        
        // Set user info in request
        (req as any).user = {
          id: userId,
          email: user.email,
          claims: {
            sub: userId,
            email: user.email,
            first_name: user.user_metadata?.first_name,
            last_name: user.user_metadata?.last_name
          }
        };
        
        // Create or update user session
        await supabaseStorage.createUserSession({
          id: `session_${Date.now()}`,
          userId: userId,
          sessionToken: token,
          isActive: 1,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: req.headers['user-agent'] || '',
          ipAddress: req.ip || req.connection.remoteAddress || '',
          lastActivity: new Date()
        });
        
        console.log(`[Auth] User authenticated: ${user.email}`);
      }
    } catch (error) {
      console.error('[Auth] Error in auth middleware:', error);
    }
    
    next();
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware to check if user is founder/admin
export function requireFounderAccess(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user is founder (this would need to be implemented based on your user structure)
  // For now, we'll check the email
  const isFounder = req.user.email === "rrivera@travectiosolutions.com";
  
  if (!isFounder) {
    return res.status(403).json({ error: 'Founder access required' });
  }
  
  next();
}

// Function to get current user from request
export function getCurrentUser(req: any) {
  return req.user;
}

// Function to logout user
export async function logoutUser(req: any) {
  if (req.user) {
    try {
      // Invalidate session in Supabase
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await supabase.auth.signOut();
        
        // Mark session as inactive in our system
        // This would need to be implemented based on your session tracking
        console.log(`[Auth] User logged out: ${req.user.email}`);
      }
    } catch (error) {
      console.error('[Auth] Error during logout:', error);
    }
  }
}
