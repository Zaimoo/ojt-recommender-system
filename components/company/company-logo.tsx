import Image from "next/image";
import { cn } from "@/lib/utils";

// A small palette so logo-less companies still feel distinct and modern.
const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];

/** Deterministic gradient so a given company always gets the same color. */
export function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

interface Props {
  name: string;
  logoUrl: string | null;
  /** Sizing/shape classes for the logo box (e.g. "h-28", "h-20 w-20 rounded-2xl"). */
  className?: string;
  /** Classes for the fallback initial (size + color). */
  initialClassName?: string;
  /** Extra classes for the logo image itself (e.g. hover transforms). */
  imageClassName?: string;
  /** Passed to next/image `sizes` for the fill image. */
  sizes?: string;
}

/** Company logo image, falling back to a gradient tile with the initial. */
export function CompanyLogo({
  name,
  logoUrl,
  className,
  initialClassName = "text-4xl text-white",
  imageClassName,
  sizes,
}: Props) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
          unoptimized
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(
            name,
          )}`}
        >
          <span className={`font-bold ${initialClassName}`}>{initial}</span>
        </div>
      )}
    </div>
  );
}
