"use client";

import { LayoutDashboard, Sparkles, FileText, Settings } from "lucide-react";
import { AppSidebar } from "@/components/ui/app-sidebar";
import type { Profile } from "@/types";

type ActiveSection =
  | "dashboard"
  | "applications"
  | "recommendations"
  | "account";

interface Props {
  profile: Profile | null;
  active: ActiveSection;
}

export function StudentSidebar({ profile, active }: Props) {
  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: active === "dashboard",
    },
    {
      label: "Recommendations",
      icon: Sparkles,
      href: "/dashboard/recommendations",
      active: active === "recommendations",
    },
    {
      label: "Applications",
      icon: FileText,
      href: "/dashboard/applications",
      active: active === "applications",
    },
    {
      label: "Account Settings",
      icon: Settings,
      href: "/dashboard/account",
      active: active === "account",
    },
  ];

  return <AppSidebar profile={profile} role="student" navItems={navItems} />;
}
