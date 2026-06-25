import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/company/company-logo";
import { MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Company } from "@/types";

interface Props {
  company: Company;
  isEligible: boolean;
  /** Destination for the card link (defaults to the public details page). */
  href?: string;
}

/** Grid card summarizing a company, used in the student company browser. */
export function CompanyCard({
  company,
  isEligible,
  href = `/companyDetails/${company.id}?from=companies`,
}: Props) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
    >
      {/* Banner */}
      <div className="relative h-28">
        <CompanyLogo
          name={company.name}
          logoUrl={company.logo_url}
          className="h-full w-full"
          sizes="(max-width: 1024px) 100vw, 33vw"
          initialClassName="text-4xl text-white/90"
          imageClassName="transition-transform duration-300 group-hover:scale-105"
        />
        {isEligible && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-emerald-600 shadow-sm backdrop-blur">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Eligible
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
            {company.name}
          </h3>
          {company.location_address && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{company.location_address}</span>
            </p>
          )}
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
          {company.company_overview || "No description provided."}
        </p>

        {company.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {company.required_skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {company.required_skills.length > 3 && (
              <span className="text-xs text-slate-400">
                +{company.required_skills.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex flex-wrap gap-1">
            {(company.eligibility_programs.length > 0
              ? company.eligibility_programs
              : (["N/A"] as const)
            ).map((program) => (
              <Badge key={program} variant="outline" className="text-xs">
                {program}
              </Badge>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
            View
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
