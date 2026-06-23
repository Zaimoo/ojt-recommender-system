"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Search,
  MapPin,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import type { Company, ProgramId } from "@/types";

interface Props {
  companies: Company[];
  studentProgram: ProgramId | null;
}

const PAGE_SIZE = 9;

// A small palette so logo-less cards still feel distinct and modern.
const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function CompaniesClient({ companies, studentProgram }: Props) {
  const [query, setQuery] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((company) => {
      if (
        eligibleOnly &&
        studentProgram &&
        !company.eligibility_programs.includes(studentProgram)
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        company.name,
        company.company_overview,
        company.location_address ?? "",
        ...company.required_skills,
        ...company.eligibility_programs,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [companies, query, eligibleOnly, studentProgram]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function resetToFirstPage() {
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by name, skill, or location"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {studentProgram && (
            <button
              type="button"
              onClick={() => {
                setEligibleOnly((v) => !v);
                resetToFirstPage();
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                eligibleOnly
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Eligible for {studentProgram}
            </button>
          )}
          <span className="hidden text-sm text-slate-500 sm:inline">
            {filtered.length}{" "}
            {filtered.length === 1 ? "company" : "companies"}
          </span>
        </div>
      </div>

      {/* Empty states */}
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <Building2 className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">No companies available</p>
          <p className="mt-1 text-sm text-slate-400">
            Check back later — your coordinator hasn&apos;t added any yet.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <Search className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">No matches found</p>
          <p className="mt-1 text-sm text-slate-400">
            Try a different search or clear your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((company) => {
            const isEligible =
              studentProgram !== null &&
              company.eligibility_programs.includes(studentProgram);
            const initial = company.name.trim()[0]?.toUpperCase() ?? "?";

            return (
              <Link
                key={company.id}
                href={`/companyDetails/${company.id}?from=companies`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
              >
                {/* Banner */}
                <div className="relative h-28 overflow-hidden">
                  {company.logo_url ? (
                    <Image
                      src={company.logo_url}
                      alt={`${company.name} logo`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(
                        company.name,
                      )}`}
                    >
                      <span className="text-4xl font-bold text-white/90">
                        {initial}
                      </span>
                    </div>
                  )}
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
                        <span className="truncate">
                          {company.location_address}
                        </span>
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
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {safePage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
