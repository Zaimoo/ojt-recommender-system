import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Background utility class for the icon tile, e.g. "bg-blue-50". */
  bg: string;
  /** Text color utility class for the icon, e.g. "text-blue-600". */
  color: string;
}

/** Compact metric tile: icon badge + label + value. */
export function StatCard({ label, value, icon: Icon, bg, color }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}
      >
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
