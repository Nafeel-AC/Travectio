import { RequestHandler } from "express";
import { SessionManager } from "./session-manager";

/**
 * Enhanced session middleware that integrates with request authentication
 */
export const sessionMiddleware: RequestHandler = async (req: any, res, next) => {
  // Skip session tracking for non-API routes and health checks
  if (!req.path.startsWith('/api') || req.path === '/api/health') {
    return next();
  }

  try {
    // Extract session information if user is authenticated
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      const sessionToken = req.session?.passport?.user?.sessionToken;
      
      if (sessionToken) {
        // Validate and refresh session
        const sessionValidation = await SessionManager.validateSession(
          sessionToken,
          req.ip,
          req.get('User-Agent')
        );

        if (sessionValidation.isValid) {
          req.sessionId = sessionValidation.sessionId;
          
          // Log API endpoint access
          await SessionManager.logActivity(
            sessionValidation.sessionId,
            userId,
            'api_access',
            req.path,
            req.ip,
            req.get('User-Agent'),
            {
              method: req.method,
              query: req.query,
              timestamp: new Date().toISOString(),
            }
          );
        } else {
          // Session expired or invalid, but don't block the request
          // Let the existing auth middleware handle it
          console.log(`[SessionMiddleware] Invalid session for user ${userId}, token: ${sessionToken}`);
        }
      }
    }
  } catch (error) {
    console.error('[SessionMiddleware] Error processing session:', error);
    // Don't block the request on session middleware errors
  }

  next();
};

/**
 * Middleware to create session on login
 */
export const createSessionOnLogin = async (userId: string, req: any): Promise<string> => {
  try {
    const user = await require("./storage").storage.getUser(userId);
    const isAdmin = user?.isAdmin || false;
    
    const sessionToken = await SessionManager.createSession(
      userId,
      req.ip,
      req.get('User-Agent'),
      isAdmin
    );
    
    // Store session token in passport session
    if (req.session && req.session.passport && req.session.passport.user) {
      req.session.passport.user.sessionToken = sessionToken;
    }
    
    return sessionToken;
  } catch (error) {
    console.error('[SessionMiddleware] Error creating session on login:', error);
    throw error;
  }
};

/**
 * Middleware to handle logout and session cleanup
 */
export const handleLogout = async (req: any): Promise<void> => {
  try {
    if (req.sessionId) {
      await SessionManager.invalidateSession(req.sessionId, 'logout');
    }
    
    // Clean up session token from passport session
    if (req.session && req.session.passport && req.session.passport.user) {
      delete req.session.passport.user.sessionToken;
    }
  } catch (error) {
    console.error('[SessionMiddleware] Error handling logout:', error);
  }
};