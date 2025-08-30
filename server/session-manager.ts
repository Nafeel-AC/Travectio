import { storage } from "./storage";
import { randomBytes } from "crypto";
import type { InsertUserSession, InsertSessionAuditLog } from "@shared/schema";

export class SessionManager {
  private static readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
  private static readonly ADMIN_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours for admin sessions
  private static readonly INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours inactivity

  /**
   * Create a new session for a user
   */
  static async createSession(userId: string, ipAddress?: string, userAgent?: string, isAdmin: boolean = false): Promise<string> {
    const sessionToken = randomBytes(32).toString('hex');
    const duration = isAdmin ? this.ADMIN_SESSION_DURATION : this.SESSION_DURATION;
    const expiresAt = new Date(Date.now() + duration);

    // Invalidate any existing active sessions for this user (single session policy)
    await this.invalidateUserSessions(userId);

    const sessionData: InsertUserSession = {
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      isActive: 1,
      expiresAt,
    };

    const session = await storage.createUserSession(sessionData);

    // Log session creation
    await this.logActivity(session.id, userId, 'login', undefined, ipAddress, userAgent, {
      sessionDuration: duration,
      isAdmin,
    });

    console.log(`[SessionManager] Created new session for user ${userId}, expires at ${expiresAt.toISOString()}`);
    return sessionToken;
  }

  /**
   * Validate and refresh a session
   */
  static async validateSession(sessionToken: string, ipAddress?: string, userAgent?: string): Promise<{ userId: string; sessionId: string; isValid: boolean }> {
    const session = await storage.getUserSessionByToken(sessionToken);

    if (!session) {
      return { userId: '', sessionId: '', isValid: false };
    }

    const now = new Date();
    const lastActivity = new Date(session.lastActivity || session.createdAt || '');
    const timeSinceActivity = now.getTime() - lastActivity.getTime();

    // Check if session is expired or inactive
    if (now > session.expiresAt || !session.isActive) {
      await this.invalidateSession(session.id, 'expired');
      return { userId: session.userId, sessionId: session.id, isValid: false };
    }

    // Check inactivity timeout
    if (timeSinceActivity > this.INACTIVITY_TIMEOUT) {
      await this.invalidateSession(session.id, 'timeout');
      return { userId: session.userId, sessionId: session.id, isValid: false };
    }

    // Update last activity
    await storage.updateUserSession(session.id, {
      lastActivity: now,
      ipAddress: ipAddress || session.ipAddress,
      userAgent: userAgent || session.userAgent,
    });

    // Log activity
    await this.logActivity(session.id, session.userId, 'activity', undefined, ipAddress, userAgent);

    return { userId: session.userId, sessionId: session.id, isValid: true };
  }

  /**
   * Invalidate a specific session
   */
  static async invalidateSession(sessionId: string, reason: string = 'logout'): Promise<void> {
    const session = await storage.getUserSession(sessionId);
    if (session) {
      await storage.updateUserSession(sessionId, { isActive: 0 });
      await this.logActivity(sessionId, session.userId, reason, undefined, undefined, undefined, {
        reason,
      });
      console.log(`[SessionManager] Invalidated session ${sessionId}, reason: ${reason}`);
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  static async invalidateUserSessions(userId: string): Promise<void> {
    const sessions = await storage.getUserSessions(userId);
    for (const session of sessions) {
      if (session.isActive) {
        await this.invalidateSession(session.id, 'new_login');
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions = await storage.getExpiredSessions();
    let cleanedCount = 0;

    for (const session of expiredSessions) {
      await this.invalidateSession(session.id, 'expired');
      cleanedCount++;
    }

    console.log(`[SessionManager] Cleaned up ${cleanedCount} expired sessions`);
    return cleanedCount;
  }

  /**
   * Log session activity
   */
  static async logActivity(
    sessionId: string,
    userId: string,
    action: string,
    endpoint?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ): Promise<void> {
    const logData: InsertSessionAuditLog = {
      sessionId,
      userId,
      action,
      endpoint,
      ipAddress,
      userAgent,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    };

    await storage.createSessionAuditLog(logData);
  }

  /**
   * Get active sessions for a user
   */
  static async getActiveSessions(userId: string): Promise<any[]> {
    return await storage.getUserActiveSessions(userId);
  }

  /**
   * Get session audit logs for a user
   */
  static async getSessionAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
    return await storage.getSessionAuditLogs(userId, limit);
  }

  /**
   * Get system-wide session statistics (admin only)
   */
  static async getSessionStatistics(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    recentLogins: number;
    averageSessionDuration: number;
  }> {
    return await storage.getSessionStatistics();
  }
}

// Background task to clean up expired sessions every hour
setInterval(async () => {
  try {
    await SessionManager.cleanupExpiredSessions();
  } catch (error) {
    console.error('[SessionManager] Error during cleanup:', error);
  }
}, 60 * 60 * 1000); // Every hour