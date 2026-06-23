import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Override the outer container (e.g. rounded/padding/print) classes. */
  className?: string;
}

/** Dashed-border placeholder shown when a list or panel has no content. */
export function EmptyState({ icon: Icon, title, description, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center",
        className,
      )}
    >
      <Icon className="mb-3 h-10 w-10 text-slate-300" />
      <p className="font-medium text-slate-500">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      )}
    </div>
  );
}
