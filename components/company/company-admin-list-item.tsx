import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Globe } from "lucide-react";
import type { Company } from "@/types";

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

interface Props {
  company: Company;
  /** Display name for whoever added the company (creator or fallback). */
  creatorLabel?: string | null;
  onEdit: () => void;
  onDelete: () => void;
}

/** Company row with view/edit/delete actions for coordinator & superadmin panels. */
export function CompanyAdminListItem({
  company,
  creatorLabel,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{company.name}</p>
            {(company.eligibility_programs.length > 0
              ? company.eligibility_programs
              : ["N/A"]
            ).map((program) => (
              <Badge key={program} variant="outline">
                {program}
              </Badge>
            ))}
          </div>
          {company.company_overview && (
            <p className="text-sm text-slate-500 line-clamp-2">
              {company.company_overview}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {company.required_skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-400">
            {creatorLabel && <span>Added by: {creatorLabel}</span>}
            {company.hr_name && <span>HR: {company.hr_name}</span>}
            {company.email_address && <span>{company.email_address}</span>}
            {company.location_address && <span>{company.location_address}</span>}
            {company.website_url && (
              <a
                href={normalizeUrl(company.website_url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:underline"
              >
                <Globe className="h-3 w-3" /> Website
              </a>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/companyDetails/${company.id}`}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            View
          </Link>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
