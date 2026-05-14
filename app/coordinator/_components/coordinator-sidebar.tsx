"use client";

import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut } from "lucide-react";
import type { Profile } from "@/types";

type ActiveSection = "dashboard" | "students" | "companies" | "account";

interface Props {
  profile: Profile | null;
  active: ActiveSection;
  onTabChange?: (tab: "dashboard" | "students" | "companies") => void;
}

export function CoordinatorSidebar({ profile, active, onTabChange }: Props) {
  const linkBase =
    "-mx-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all";
  const linkActive = "bg-blue-50 text-blue-700 shadow-sm";
  const linkIdle = "text-slate-700 hover:bg-slate-50 hover:text-slate-900";

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center gap-3 pb-4">
          <div className="rounded-lg border border-slate-200 bg-white p-2 text-blue-600 shadow-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Coordinator Panel
            </h1>
            <p className="text-xs text-slate-500">OJT Recommender</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {(profile?.full_name || profile?.email || "U")?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {profile?.full_name || profile?.email || "User"}
            </p>
            <p className="truncate text-xs text-slate-500">Coordinator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {onTabChange ? (
          <>
            <button
              type="button"
              onClick={() => onTabChange("dashboard")}
              className={`w-full text-left ${linkBase} ${active === "dashboard" ? linkActive : linkIdle}`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onTabChange("students")}
              className={`w-full text-left ${linkBase} ${active === "students" ? linkActive : linkIdle}`}
            >
              Students
            </button>
            <button
              type="button"
              onClick={() => onTabChange("companies")}
              className={`w-full text-left ${linkBase} ${active === "companies" ? linkActive : linkIdle}`}
            >
              Companies
            </button>
            <Link
              href="/coordinator/account"
              className={`${linkBase} ${active === "account" ? linkActive : linkIdle}`}
            >
              Account Settings
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/coordinator"
              className={`${linkBase} ${active === "dashboard" ? linkActive : linkIdle}`}
            >
              Dashboard
            </Link>
            <Link
              href="/coordinator?tab=students"
              className={`${linkBase} ${active === "students" ? linkActive : linkIdle}`}
            >
              Students
            </Link>
            <Link
              href="/coordinator?tab=companies"
              className={`${linkBase} ${active === "companies" ? linkActive : linkIdle}`}
            >
              Companies
            </Link>
            <Link
              href="/coordinator/account"
              className={`${linkBase} ${active === "account" ? linkActive : linkIdle}`}
            >
              Account Settings
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <form action={signOut} className="w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            type="submit"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </form>
      </div>
    </aside>
  );
}
