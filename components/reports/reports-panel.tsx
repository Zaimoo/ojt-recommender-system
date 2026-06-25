"use client";

import { useState } from "react";
import {
  generateReport,
  type ReportData,
  type SkillCount,
} from "@/app/actions/reports";
import { PROGRAM_OPTIONS } from "@/lib/constants/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  Users,
  GraduationCap,
  XCircle,
  Building2,
  FileText,
  Clock,
  Download,
  BarChart3,
} from "lucide-react";
import { downloadReportPdf } from "@/lib/reports/generate-pdf";
import type { ProgramId } from "@/types";

interface Props {
  role: "coordinator" | "superadmin";
  /** Coordinator's assigned program; when set, the program filter is locked. */
  lockedProgram?: ProgramId | null;
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="report-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <p className="font-semibold text-slate-900">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SkillBars({ skills }: { skills: SkillCount[] }) {
  if (skills.length === 0) {
    return <p className="text-sm text-slate-400">No skills recorded.</p>;
  }
  const max = Math.max(...skills.map((s) => s.count), 1);
  return (
    <div className="space-y-2.5">
      {skills.map((s) => (
        <div key={s.skill}>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span className="truncate">{s.skill}</span>
            <span className="font-medium text-slate-700">{s.count}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsPanel({ role, lockedProgram }: Props) {
  const [startDate, setStartDate] = useState(isoDaysAgo(180));
  const [endDate, setEndDate] = useState(isoDaysAgo(0));
  const [program, setProgram] = useState<ProgramId | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  const programLocked = role === "coordinator";

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const res = await generateReport({
      startDate,
      endDate,
      program: programLocked ? undefined : program,
    });
    setLoading(false);
    if ("error" in res) {
      setError(res.error);
      setReport(null);
      return;
    }
    setReport(res.data);
  }

  const programLabel = report
    ? report.meta.program === "ALL"
      ? "All Programs"
      : report.meta.program
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Controls ──────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Program</Label>
            {programLocked ? (
              <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                {lockedProgram ?? "Your program"}
              </div>
            ) : (
              <select
                value={program}
                onChange={(e) =>
                  setProgram(e.target.value as ProgramId | "ALL")
                }
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option value="ALL">All Programs</option>
                {PROGRAM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <BarChart3 className="mr-1.5 h-4 w-4" />
            {loading ? "Generating…" : "Generate Report"}
          </Button>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {!report && !loading && (
        <EmptyState
          icon={FileText}
          title="No report generated yet"
          description="Choose a date range and program, then click Generate Report."
          className="print:hidden"
        />
      )}

      {report && (
        <div id="report-print-area" className="space-y-6">
          {/* Print-only document header (clean title block on the PDF). */}
          <div className="print-only mb-4 border-b border-slate-300 pb-4 text-center">
            <p className="text-xl font-bold text-slate-900">
              OJT Program Report
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {programLabel} · {formatDate(report.meta.startDate)} –{" "}
              {formatDate(report.meta.endDate)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Generated {formatDate(report.meta.generatedAt)} · OJT Company
              Recommendation System
            </p>
          </div>

          {/* On-screen report header + export action (not printed). */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div>
              <p className="text-base font-semibold text-slate-900">
                OJT Report — {programLabel}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(report.meta.startDate)} –{" "}
                {formatDate(report.meta.endDate)} · Generated{" "}
                {formatDate(report.meta.generatedAt)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReportPdf(report)}
            >
              <Download className="mr-1.5 h-4 w-4" /> Download PDF
            </Button>
          </div>

          {/* 1. Student Overview */}
          <SectionCard
            title="1. Student Overview"
            subtitle="Students enrolled in OJT during the selected period"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Enrolled in OJT"
                value={report.studentOverview.enrolled}
                icon={Users}
                bg="bg-blue-50"
                color="text-blue-600"
              />
            </div>
          </SectionCard>

          {/* 2. Company Placement Summary */}
          <SectionCard
            title="2. Company Placement Summary"
            subtitle={`${report.companyPlacement.companiesParticipated} ${
              report.companyPlacement.companiesParticipated === 1
                ? "company"
                : "companies"
            } where students were placed`}
          >
            {report.companyPlacement.perCompany.length === 0 ? (
              <p className="text-sm text-slate-400">
                No students were placed in this period.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        Company
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                        Students Placed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.companyPlacement.perCompany.map((c) => (
                      <tr key={c.company}>
                        <td className="px-4 py-2.5 text-slate-700">
                          {c.company}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                          {c.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* 3. OJT Placement Details */}
          <SectionCard
            title="3. OJT Placement Details"
            subtitle="Students placed during the selected period and when they started"
          >
            {report.placementDetails.length === 0 ? (
              <p className="text-sm text-slate-400">
                No students started OJT in this period.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2.5">ID No.</th>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Contact</th>
                      <th className="px-4 py-2.5">Company</th>
                      <th className="px-4 py-2.5 text-right">Start Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.placementDetails.map((p, i) => (
                      <tr key={`${p.studentId}-${p.company}-${i}`}>
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-slate-500">
                          {p.studentId}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {p.student}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {p.email}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">
                          {p.contact}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {p.company}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-700">
                          {formatDate(p.startDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* 4. Application Summary */}
          <SectionCard
            title="4. Application Summary"
            subtitle="Applications submitted during the selected period"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Submitted"
                value={report.applications.total}
                icon={FileText}
                bg="bg-slate-100"
                color="text-slate-600"
              />
              <StatCard
                label="Accepted"
                value={report.applications.accepted}
                icon={GraduationCap}
                bg="bg-emerald-50"
                color="text-emerald-600"
              />
              <StatCard
                label="Rejected"
                value={report.applications.rejected}
                icon={XCircle}
                bg="bg-red-50"
                color="text-red-600"
              />
              <StatCard
                label="Pending"
                value={report.applications.pending}
                icon={Clock}
                bg="bg-amber-50"
                color="text-amber-600"
              />
            </div>
          </SectionCard>

          {/* 4. Skills Summary */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="5. Most Common Student Skills"
              subtitle="Submitted by students placed this period"
            >
              <SkillBars skills={report.skills.topStudentSkills} />
            </SectionCard>
            <SectionCard
              title="6. Most In-Demand Company Skills"
              subtitle="Required across participating companies"
            >
              <SkillBars skills={report.skills.topCompanySkills} />
            </SectionCard>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Building2 className="h-3.5 w-3.5" />
            Report scoped to {programLabel}.
          </p>
        </div>
      )}
    </div>
  );
}
