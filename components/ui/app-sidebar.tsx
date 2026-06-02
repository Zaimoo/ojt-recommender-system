"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/app/actions/auth";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { Profile } from "@/types";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  active: boolean;
}

interface Props {
  profile: Profile | null;
  role: "student" | "coordinator" | "superadmin";
  navItems: NavItem[];
}

export function AppSidebar({ profile, role, navItems }: Props) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {}
      return next;
    });
  }

  const displayName = profile?.full_name || profile?.email || "User";
  const initials = displayName[0]?.toUpperCase() ?? "U";
  const roleLabel =
    role === "superadmin"
      ? "Super Admin"
      : role === "coordinator"
        ? "Coordinator"
        : "Student";

  return (
    <aside
      className="relative flex h-screen flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-200 ease-in-out shrink-0"
      style={{ width: collapsed ? 64 : 256 }}
    >
      {/* ── Top: Logo + Collapse button ─────────────────── */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          {!collapsed && (
            <>
              {/* Logo mark */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"
                    fill="white"
                    fillOpacity="0.3"
                    stroke="white"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  OJT Recommender
                </p>
                <p className="truncate text-xs text-slate-500">
                  {roleLabel} Portal
                </p>
              </div>
            </>
          )}
        </div>

        {/* Collapse button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const baseClass =
            "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all";
          const activeClass = "bg-blue-600 text-white shadow-sm";
          const idleClass =
            "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
          const className = `${baseClass} ${item.active ? activeClass : idleClass}`;

          const content = (
            <>
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="sidebar-tooltip group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </>
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={className}
            >
              {content}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom: User + Sign Out ──────────────────────── */}
      <div className="shrink-0 border-t border-slate-100 p-3 space-y-2">
        {/* User pill */}
        <div
          className={`flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <form action={signOut} className="w-full">
          <button
            type="submit"
            title="Sign Out"
            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Sign Out</span>}
            {collapsed && (
              <span className="sidebar-tooltip group-hover:opacity-100">
                Sign Out
              </span>
            )}
          </button>
        </form>
      </div>
    </aside>
  );
}
