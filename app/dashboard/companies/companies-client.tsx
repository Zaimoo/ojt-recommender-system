"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { CompanyCard } from "@/components/company/company-card";
import { Building2, Search, SlidersHorizontal } from "lucide-react";
import type { Company, ProgramId } from "@/types";

interface Props {
  companies: Company[];
  studentProgram: ProgramId | null;
}

const PAGE_SIZE = 9;

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
        <EmptyState
          icon={Building2}
          title="No companies available"
          description="Check back later — your coordinator hasn't added any yet."
          className="rounded-2xl py-20"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches found"
          description="Try a different search or clear your filters."
          className="rounded-2xl py-20"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              isEligible={
                studentProgram !== null &&
                company.eligibility_programs.includes(studentProgram)
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
