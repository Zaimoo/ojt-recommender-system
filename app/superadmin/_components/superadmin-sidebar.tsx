"use client";

import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  FileText,
  Settings,
} from "lucide-react";
import { AppSidebar } from "@/components/ui/app-sidebar";
import type { Profile } from "@/types";

type ActiveSection =
  | "dashboard"
  | "students"
  | "coordinators"
  | "companies"
  | "audit"
  | "account";

interface Props {
  profile: Profile | null;
  active: ActiveSection;
  onTabChange?: (
    tab:
      | "dashboard"
      | "students"
      | "coordinators"
      | "companies"
      | "audit"
      | "account",
  ) => void;
}

export function SuperadminSidebar({ profile, active, onTabChange }: Props) {
  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      onClick: () => onTabChange?.("dashboard"),
      href: onTabChange ? undefined : "/superadmin",
      active: active === "dashboard",
    },
    {
      label: "Students",
      icon: Users,
      onClick: () => onTabChange?.("students"),
      href: onTabChange ? undefined : "/superadmin?tab=students",
      active: active === "students",
    },
    {
      label: "Coordinators",
      icon: UserCog,
      onClick: () => onTabChange?.("coordinators"),
      href: onTabChange ? undefined : "/superadmin?tab=coordinators",
      active: active === "coordinators",
    },
    {
      label: "Companies",
      icon: Building2,
      onClick: () => onTabChange?.("companies"),
      href: onTabChange ? undefined : "/superadmin?tab=companies",
      active: active === "companies",
    },
    {
      label: "Audit Log",
      icon: FileText,
      onClick: () => onTabChange?.("audit"),
      href: onTabChange ? undefined : "/superadmin?tab=audit",
      active: active === "audit",
    },
    {
      label: "Account Settings",
      icon: Settings,
      onClick: () => onTabChange?.("account"),
      href: onTabChange ? undefined : "/superadmin?tab=account",
      active: active === "account",
    },
  ];

  return <AppSidebar profile={profile} role="superadmin" navItems={navItems} />;
}
