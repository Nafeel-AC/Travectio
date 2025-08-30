import session from "express-session";
import type { Express, RequestHandler } from "express";
import { supabase } from "./supabase";
import { storage } from "./storage";
import connectPgSimple from 'connect-pg-simple';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Supabase authentication configuration
console.log('[Auth] Using Supabase authentication system');

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Determine if we should use secure cookies based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const useSecureCookies = isProduction;
  
  console.log(`[Session Config] Environment: ${process.env.NODE_ENV}, Secure cookies: ${useSecureCookies}`);
  
  const databaseUrl = process.env.DATABASE_URL;

  // Use Postgres-backed session store when DATABASE_URL is available
  if (databaseUrl) {
    const PgSession = connectPgSimple(session as any);
    const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

    return session({
      store: new PgSession({ pool }),
      secret: process.env.SESSION_SECRET!,
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

  // Fallback to default (in-memory) session store for local/dev environments
  return session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      httpOnly: true,
      secure: useSecureCookies, // Only use secure cookies in production
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
    
    await storage.upsertUser({
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

  // Middleware to check Supabase authentication
  app.use(async (req: any, res: any, next: any) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Verify the JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (user && !error) {
          // User is authenticated, add to request
          req.user = {
            id: user.id,
            email: user.email,
            firstName: user.user_metadata?.first_name || user.email?.split('@')[0] || '',
            lastName: user.user_metadata?.last_name || '',
            profileImageUrl: user.user_metadata?.avatar_url,
            isFounder: user.email === "rrivera@travectiosolutions.com" ? 1 : 0,
            isAdmin: user.email === "rrivera@travectiosolutions.com" ? 1 : 0,
            isActive: 1
          };
          
          // Upsert user in local storage
          await upsertUser(user);
        }
      }
      
      next();
    } catch (error) {
      console.error('[Auth] Error in auth middleware:', error);
      next();
    }
  });

  // Development mode authentication (for testing without Supabase Auth)
  if (process.env.NODE_ENV === 'development') {
    app.use((req: any, res: any, next: any) => {
      // Check if this is a demo mode request (has demo_user_id query param)
      const isDemoRequest = req.query.demo_user_id === 'demo-user-001';
      
      if (isDemoRequest) {
        // Demo mode: use demo user
        req.user = {
          claims: {
            sub: 'demo-user-001',
            email: 'demo@travectiosolutions.com'
          }
        };
        console.log(`[Auth Debug] Using demo user for demo mode request`);
        return next();
      }
      
      // If user is already authenticated via session, use that
      if (req.user && req.user.claims?.sub) {
        console.log(`[Auth Debug] Using existing authenticated user:`, req.user.claims.email);
        return next();
      }
      
      // For development, check for user switching via query parameter or default to founder
      const switchUser = req.query.dev_user as string;
      let devUser;
      
      if (switchUser === 'customer') {
        // Use customer user for testing data isolation
        devUser = {
          sub: '45655610', // travectiosolutionsinc user ID
          email: 'travectiosolutionsinc@gmail.com'
        };
        console.log(`[Auth Debug] Using customer user for development testing`);
      } else {
        // Default to founder for development
        devUser = {
          sub: '45506370', // Founder user ID from database
          email: 'rrivera@travectiosolutions.com'
        };
        console.log(`[Auth Debug] Using founder user for development (default)`);
      }
      
      req.user = {
        claims: devUser
      };
      return next();
    });
  }

  // Simple login endpoint that redirects to Supabase Auth
  app.get('/auth/login', (req, res) => {
    const redirectUrl = `${req.protocol}://${req.get('host')}/auth/callback`;
    const loginUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
    res.redirect(loginUrl);
  });
  
  // Callback endpoint for Supabase Auth
  app.get('/auth/callback', (req, res) => {
    // Handle the callback from Supabase
    res.redirect('/');
  });

  // Logout endpoint
  app.get('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('[Auth] Error during logout:', err);
      }
      res.redirect('/');
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res: any, next: any) => {
  // Development mode: handle authentication more gracefully
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth Debug] Processing request for:`, req.path);
    
    // Check if this is a demo mode request (has demo_user_id query param)
    const isDemoRequest = req.query.demo_user_id === 'demo-user-001';
    
    if (isDemoRequest) {
      // Demo mode: use demo user
      req.user = {
        claims: {
          sub: 'demo-user-001',
          email: 'demo@travectiosolutions.com'
        }
      };
      console.log(`[Auth Debug] Using demo user for demo mode request`);
      return next();
    }
    
    // If user is already authenticated via session, use that
    if (req.user && req.user.claims?.sub) {
      console.log(`[Auth Debug] Using existing authenticated user:`, req.user.claims.email);
      return next();
    }
    
    // For development, check for user switching via query parameter or default to founder
    const switchUser = req.query.dev_user as string;
    let devUser;
    
    if (switchUser === 'customer') {
      // Use customer user for testing data isolation
      devUser = {
        sub: '45655610', // travectiosolutionsinc user ID
        email: 'travectiosolutionsinc@gmail.com'
      };
      console.log(`[Auth Debug] Using customer user for development testing`);
    } else {
      // Default to founder for development
      devUser = {
        sub: '45506370', // Founder user ID from database
        email: 'rrivera@travectiosolutions.com'
      };
      console.log(`[Auth Debug] Using founder user for development (default)`);
    }
    
    req.user = {
      claims: devUser
    };
    return next();
  }
  
  const user = req.user;
  
  console.log(`[Auth Debug] isAuthenticated check:`, {
    hasUser: !!user,
    userClaims: !!user?.claims,
  });

  // Check if user is authenticated
  if (!user?.claims?.sub) {
    console.log(`[Auth Debug] Failed basic authentication check`);
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log(`[Auth Debug] Authentication successful for user:`, user.claims.email);
  return next();
};