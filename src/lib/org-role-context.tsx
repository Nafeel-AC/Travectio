import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export type OrgRole = "owner" | "dispatcher" | "driver" | null;

interface MembershipRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: string;
}

interface OrgRecord {
  id: string;
  name: string;
  status: string;
}

interface OrgRoleContextValue {
  activeOrgId: string | null;
  role: OrgRole;
  memberships: Array<{ organization: OrgRecord; membership: MembershipRow }>;
  setActiveOrgId: (orgId: string) => void;
  refresh: () => Promise<void>;
}

const OrgRoleContext = createContext<OrgRoleContextValue | undefined>(undefined);

export const OrgRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);
  const [role, setRole] = useState<OrgRole>(null);
  const [memberships, setMemberships] = useState<OrgRoleContextValue["memberships"]>([]);

  const setActiveOrgId = (orgId: string) => {
    setActiveOrgIdState(orgId);
    try {
      localStorage.setItem("travectio.activeOrgId", orgId);
    } catch {}
    // role will be recalculated from memberships below
  };

  const loadMemberships = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMemberships([]);
      setActiveOrgIdState(null);
      setRole(null);
      return;
    }

    const { data: rows, error } = await supabase
      .from("organization_members")
      .select("*, organizations(*)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      console.error("Failed to load memberships", error);
      setMemberships([]);
      return;
    }

    const mapped: OrgRoleContextValue["memberships"] = (rows || []).map((r: any) => ({
      organization: {
        id: r.organizations.id,
        name: r.organizations.name,
        status: r.organizations.status,
      },
      membership: {
        id: r.id,
        organization_id: r.organization_id,
        user_id: r.user_id,
        role: r.role,
        status: r.status,
      },
    }));
    setMemberships(mapped);

    // determine active org
    let nextOrg = activeOrgId;
    if (!nextOrg) {
      try {
        nextOrg = localStorage.getItem("travectio.activeOrgId");
      } catch {}
    }
    if (!nextOrg && mapped.length > 0) {
      nextOrg = mapped[0].organization.id;
    }
    setActiveOrgIdState(nextOrg || null);

    const current = mapped.find(m => m.organization.id === nextOrg);
    setRole((current?.membership.role as OrgRole) || null);
  };

  useEffect(() => {
    loadMemberships();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadMemberships();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!memberships.length) {
      setRole(null);
      return;
    }
    const current = memberships.find(m => m.organization.id === activeOrgId) || memberships[0];
    setRole((current?.membership.role as OrgRole) || null);
  }, [activeOrgId, memberships]);

  const value = useMemo<OrgRoleContextValue>(() => ({
    activeOrgId,
    role,
    memberships,
    setActiveOrgId,
    refresh: loadMemberships,
  }), [activeOrgId, role, memberships]);

  return (
    <OrgRoleContext.Provider value={value}>{children}</OrgRoleContext.Provider>
  );
};

export const useOrgRole = () => {
  const ctx = useContext(OrgRoleContext);
  if (!ctx) throw new Error("useOrgRole must be used within OrgRoleProvider");
  return ctx;
};



