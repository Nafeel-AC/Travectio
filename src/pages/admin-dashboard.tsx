import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Monitor,
  Settings,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Database,
  Server,
} from "lucide-react";
import { useFounderAccess } from "@/hooks/useFounderAccess";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const { isFounder, isAdmin } = useFounderAccess();

  const [counts, setCounts] = useState({ users: 0, activeSessions: 0, integrations: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const [{ count: usersCount }, { count: activeSessionsCount }, { count: integrationsCount }] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("sessions").select("*", { count: "exact", head: true }).eq("isActive", 1),
          supabase.from("truck_integrations").select("*", { count: "exact", head: true }),
        ]);
        if (isMounted) {
          setCounts({
            users: usersCount || 0,
            activeSessions: activeSessionsCount || 0,
            integrations: integrationsCount || 0,
          });
        }
      } catch (e) {
        // Non-fatal; leave defaults
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick access cards for admin functions
  const adminCards = [
    {
      title: "User Management",
      description: "Manage system users and permissions",
      icon: Users,
      href: "/user-management",
      color: "bg-blue-500",
      count: loading ? "…" : `${counts.users} Users`,
    },
    {
      title: "Session Management",
      description: "Monitor active sessions and security",
      icon: Monitor,
      href: "/session-management",
      color: "bg-green-500",
      count: loading ? "…" : `${counts.activeSessions} Active`,
    },
    {
      title: "System Integrations",
      description: "Manage API connections and integrations",
      icon: Settings,
      href: "/integration-management",
      color: "bg-purple-500",
      count: loading ? "…" : `${counts.integrations} Connected`,
    },
  ];

  // System status indicators
  const systemStatus = [
    {
      name: "Database",
      status: "online",
      icon: Database,
      uptime: "99.9%",
    },
    {
      name: "API Services",
      status: "online",
      icon: Server,
      uptime: "99.8%",
    },
    {
      name: "Authentication",
      status: "online",
      icon: Shield,
      uptime: "100%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-2">
            System administration and management overview
          </p>
        </div>

        <Badge
          variant="outline"
          className={`px-3 py-1 ${
            isFounder
              ? "border-purple-600 text-purple-600"
              : "border-amber-600 text-amber-600"
          }`}
        >
          {isFounder ? (
            <>
              <Shield className="h-4 w-4 mr-1" />
              Founder Access
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-1" />
              Administrator
            </>
          )}
        </Badge>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-1">
                    {card.count}
                  </div>
                  <p className="text-xs text-slate-400">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* System Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription className="text-slate-400">
            Real-time system health and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemStatus.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-slate-400" />
                  <span className="text-white font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">
                    {service.uptime} uptime
                  </span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500 capitalize">
                      {service.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            Recent Administrative Activity
          </CardTitle>
          <CardDescription className="text-slate-400">
            Latest system administration actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
              <Users className="h-4 w-4 text-blue-400" />
              <div className="flex-1">
                <p className="text-white text-sm">New user registration</p>
                <p className="text-slate-400 text-xs">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
              <Monitor className="h-4 w-4 text-green-400" />
              <div className="flex-1">
                <p className="text-white text-sm">Session cleanup completed</p>
                <p className="text-slate-400 text-xs">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
              <Settings className="h-4 w-4 text-purple-400" />
              <div className="flex-1">
                <p className="text-white text-sm">Integration status updated</p>
                <p className="text-slate-400 text-xs">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-slate-400">
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/user-management">
              <Button
                variant="outline"
                className="w-full justify-start text-white border-slate-600 hover:bg-slate-700"
              >
                <Users className="h-4 w-4 mr-2" />
                View All Users
              </Button>
            </Link>
            <Link href="/session-management">
              <Button
                variant="outline"
                className="w-full justify-start text-white border-slate-600 hover:bg-slate-700"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Active Sessions
              </Button>
            </Link>
            <Link href="/integration-management">
              <Button
                variant="outline"
                className="w-full justify-start text-white border-slate-600 hover:bg-slate-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
