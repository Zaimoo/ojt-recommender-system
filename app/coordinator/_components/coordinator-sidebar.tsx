"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Settings,
} from "lucide-react";
import { AppSidebar } from "@/components/ui/app-sidebar";
import type { Profile } from "@/types";

type ActiveSection =
  | "dashboard"
  | "students"
  | "companies"
  | "reports"
  | "account";

interface Props {
  profile: Profile | null;
  active: ActiveSection;
  onTabChange?: (
    tab: "dashboard" | "students" | "companies" | "reports",
  ) => void;
}

export function CoordinatorSidebar({ profile, active, onTabChange }: Props) {
  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      onClick: () => onTabChange?.("dashboard"),
      href: onTabChange ? undefined : "/coordinator",
      active: active === "dashboard",
    },
    {
      label: "Students",
      icon: Users,
      onClick: () => onTabChange?.("students"),
      href: onTabChange ? undefined : "/coordinator?tab=students",
      active: active === "students",
    },
    {
      label: "Companies",
      icon: Building2,
      onClick: () => onTabChange?.("companies"),
      href: onTabChange ? undefined : "/coordinator?tab=companies",
      active: active === "companies",
    },
    {
      label: "Reports",
      icon: BarChart3,
      onClick: () => onTabChange?.("reports"),
      href: onTabChange ? undefined : "/coordinator?tab=reports",
      active: active === "reports",
    },
    {
      label: "Account Settings",
      icon: Settings,
      href: "/coordinator/account",
      active: active === "account",
    },
  ];

  return (
    <AppSidebar profile={profile} role="coordinator" navItems={navItems} />
  );
}
