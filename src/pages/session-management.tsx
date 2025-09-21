import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useSupabase";
import type { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Shield, Clock, MapPin, Monitor, AlertTriangle, LogOut, Activity, User as UserIcon, CheckCircle, X, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useSessionManagement } from "@/hooks/useSupabase";

interface SessionAuditLog {
  id: string;
  action: string;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string; // matches DB column
  timestamp?: string; // legacy/demo shape fallback
  metadata?: any;
}

interface UserSession {
  id: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: number;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
}

interface SessionStatistics {
  totalActiveSessions: number;
  totalUsers: number;
  recentLogins: number;
  averageSessionDuration: number;
}

export default function SessionManagement() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const typedUser = user as User | null;

  // Supabase-backed session management
  const {
    statistics: sessionStats,
    activeSessions = [],
    auditLogs = [],
    loading: sessionsHookLoading,
    invalidateSession,
    fetchActiveSessions,
    fetchAuditLogs,
    fetchStatistics,
  } = useSessionManagement();

  const auditLogsLoading = sessionsHookLoading && isAuthenticated;
  const sessionsLoading = sessionsHookLoading && isAuthenticated;
  const statsLoading = sessionsHookLoading && !!(isAuthenticated && typedUser?.isAdmin === 1);

  const handleInvalidateSession = async (sessionId: string) => {
    try {
      await invalidateSession(sessionId);
      toast({
        title: "Session Invalidated",
        description: "The session has been successfully invalidated.",
      });
      // Refresh the sessions list
      // The hook should handle this automatically
    } catch (error: any) {
      toast({
        title: "Failed to Invalidate Session",
        description: error.message || "There was an error invalidating the session.",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'admin_access':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'api_access':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'logout':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'timeout':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'admin_access':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'api_access':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const parseUserAgent = (userAgent?: string) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
    
    // Simple user agent parsing
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' :
                   userAgent.includes('Edge') ? 'Edge' : 'Unknown';
    
    const os = userAgent.includes('Windows') ? 'Windows' :
               userAgent.includes('Mac') ? 'macOS' :
               userAgent.includes('Linux') ? 'Linux' :
               userAgent.includes('Android') ? 'Android' :
               userAgent.includes('iOS') ? 'iOS' : 'Unknown';
    
    return { browser, os };
  };

  if (!isAuthenticated || !typedUser) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600">Please log in to view session management.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Session Management</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Monitor your account security and active sessions
          </p>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-8 md:space-y-10">
        <TabsList className={`grid w-full ${typedUser?.isAdmin ? 'grid-cols-3' : 'grid-cols-2'} h-14 md:h-16 bg-slate-800 border border-slate-700 mb-8 p-1.5 gap-1`}>
          <TabsTrigger 
            value="sessions" 
            className="text-sm md:text-base data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 rounded-md h-full flex items-center justify-center font-medium transition-all duration-200"
          >
            <span className="mobile-hide">Active Sessions</span>
            <span className="mobile-show">Sessions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="text-sm md:text-base data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 rounded-md h-full flex items-center justify-center font-medium transition-all duration-200"
          >
            <span className="mobile-hide">Activity Log</span>
            <span className="mobile-show">Activity</span>
          </TabsTrigger>
          {typedUser?.isAdmin === 1 && (
            <TabsTrigger 
              value="statistics" 
              className="text-sm md:text-base data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 rounded-md h-full flex items-center justify-center font-medium transition-all duration-200"
            >
              <span className="mobile-hide">Statistics</span>
              <span className="mobile-show">Stats</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="sessions" className="space-y-4 mt-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Monitor className="h-4 w-4 md:h-5 md:w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Manage your currently active login sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(!activeSessions || (activeSessions as UserSession[]).length === 0) ? (
                    <div className="text-center py-8 text-gray-500">
                      No active sessions found
                    </div>
                  ) : (
                    (activeSessions as UserSession[]).map((session: UserSession) => {
                      const { browser, os } = parseUserAgent(session.userAgent);
                      const isCurrentSession = session.sessionToken; // Simplified check
                      
                      return (
                        <div key={session.id} className="border rounded-lg p-3 md:p-4 space-y-3">
                          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                            <div className="flex items-center gap-3">
                              <Monitor className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm md:text-base">{browser} on {os}</p>
                                <p className="text-xs md:text-sm text-gray-600 truncate">
                                  {session.ipAddress} • Last active {formatDistanceToNow(new Date(session.lastActivity))} ago
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isCurrentSession && (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                  <span className="mobile-hide">Current Session</span>
                                  <span className="mobile-show">Current</span>
                                </Badge>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleInvalidateSession(session.id)}
                                disabled={false}
                                className="touch-target text-xs md:text-sm"
                              >
                                Terminate
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>Session started: {format(new Date(session.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                            <p>Expires: {format(new Date(session.expiresAt), 'MMM dd, yyyy h:mm a')}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 mt-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Activity className="h-4 w-4 md:h-5 md:w-5" />
                Security Activity Log
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Review your recent account activity and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ScrollArea className="h-64 md:h-96">
                  <div className="space-y-3 md:space-y-4">
                    {(!auditLogs || (auditLogs as SessionAuditLog[]).length === 0) ? (
                      <div className="text-center py-8 text-gray-500">
                        No activity logs found
                      </div>
                    ) : (
                      (auditLogs as SessionAuditLog[]).map((log: SessionAuditLog) => (
                        <div key={log.id} className="flex items-start gap-2 md:gap-3 pb-3 md:pb-4">
                          <div className="flex-shrink-0 mt-1">
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex flex-col space-y-1 md:flex-row md:items-center md:gap-2 md:space-y-0">
                              <Badge className={`${getActionColor(log.action)} text-xs`}>
                                {log.action.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-xs md:text-sm text-gray-500">
                                {formatDistanceToNow(new Date(log.createdAt || log.timestamp || ''))} ago
                              </span>
                            </div>
                            {log.endpoint && (
                              <p className="text-xs md:text-sm font-mono text-gray-600 truncate">{log.endpoint}</p>
                            )}
                            <div className="text-xs text-gray-500 space-y-1">
                              {log.ipAddress && (
                                <p className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{log.ipAddress}</span>
                                </p>
                              )}
                              <p className="truncate">{format(new Date(log.createdAt || log.timestamp || ''), 'MMM dd, yyyy h:mm:ss a')}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {typedUser?.isAdmin === 1 && (
          <TabsContent value="statistics" className="space-y-4 mt-8">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Shield className="h-4 w-4 md:h-5 md:w-5" />
                  System Statistics
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Overview of system-wide session and user activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : sessionStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300 text-xs md:text-sm">
                          <span className="mobile-hide">Active Sessions</span>
                          <span className="mobile-show">Sessions</span>
                        </h3>
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                        {(sessionStats as SessionStatistics).totalActiveSessions}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                        <h3 className="font-semibold text-green-700 dark:text-green-300 text-xs md:text-sm">
                          <span className="mobile-hide">Total Users</span>
                          <span className="mobile-show">Users</span>
                        </h3>
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                        {(sessionStats as SessionStatistics).totalUsers}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                        <h3 className="font-semibold text-orange-700 dark:text-orange-300 text-xs md:text-sm">
                          <span className="mobile-hide">Recent Logins</span>
                          <span className="mobile-show">Logins</span>
                        </h3>
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                        {(sessionStats as SessionStatistics).recentLogins}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Last 24 hours</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                        <h3 className="font-semibold text-purple-700 dark:text-purple-300 text-xs md:text-sm">
                          <span className="mobile-hide">Avg Session</span>
                          <span className="mobile-show">Avg Time</span>
                        </h3>
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                        {(sessionStats as SessionStatistics).averageSessionDuration > 0 
                          ? `${Math.round((sessionStats as SessionStatistics).averageSessionDuration / 60)}m`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Unable to load statistics
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}