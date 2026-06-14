"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/app/actions/company";
import { PROGRAM_OPTIONS } from "@/lib/constants/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CoordinatorSidebar } from "@/app/coordinator/_components/coordinator-sidebar";
import { ReportsPanel } from "@/components/reports/reports-panel";
import { Plus, Pencil, Trash2, X, Building2, Users, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import type { Profile, Company, ProgramId } from "@/types";

interface StudentSummary {
  id: string;
  full_name: string;
  email: string;
  program_id: ProgramId | null;
  contact_number: string | null;
  student_id: string | null;
  created_at: string;
  application_status?: string | null;
  placement_company?: string | null;
}

interface StudentWithTimestamp extends StudentSummary {
  created_at: string;
}

interface CompanyCreator {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  profile: Profile | null;
  companies: Company[];
  companyCreators: Record<string, CompanyCreator>;
  allStudents: StudentSummary[];
  latestStudents: StudentWithTimestamp[];
  initialTab?: string;
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function CoordinatorPanelClient({
  profile,
  companies,
  companyCreators,
  allStudents,
  latestStudents,
  initialTab,
}: Props) {
  const skillSuggestions = Array.from(
    new Set(companies.flatMap((c) => c.required_skills ?? [])),
  ).sort((a, b) => a.localeCompare(b));

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "students" | "companies" | "reports"
  >(
    initialTab === "students" ||
      initialTab === "companies" ||
      initialTab === "reports"
      ? initialTab
      : "dashboard",
  );
  const [studentsPage, setStudentsPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [companyFieldErrors, setCompanyFieldErrors] = useState<{
    contact_number?: string;
    website_url?: string;
  }>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<ProgramId[]>([]);
  const [requiredSkillsInput, setRequiredSkillsInput] = useState("");
  const requiredSkillsRef = useRef<HTMLInputElement | null>(null);
  const [requiredSkillHighlightIndex, setRequiredSkillHighlightIndex] =
    useState(0);

  function validateCompanyFields(formData: FormData) {
    const errors: { contact_number?: string; website_url?: string } = {};
    const contact = (formData.get("contact_number") as string)?.trim();
    const website = (formData.get("website_url") as string)?.trim();

    if (contact && contact.replace(/\D/g, "").length !== 11) {
      errors.contact_number =
        "Invalid format. Contact number should be 11 digits long.";
    }
    if (website) {
      try {
        new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
      } catch {
        errors.website_url =
          "Please enter a valid URL (e.g. https://example.com).";
      }
    }
    return errors;
  }

  async function handleCreate(formData: FormData) {
    const errors = validateCompanyFields(formData);
    if (Object.keys(errors).length > 0) {
      setCompanyFieldErrors(errors);
      return;
    }
    setCompanyFieldErrors({});
    const res = await createCompany(formData);
    if ("error" in res) {
      setFormMsg(res.error);
      return;
    }
    setFormMsg("Company created!");
    setShowForm(false);
    setRequiredSkillsInput("");
  }

  async function handleUpdate(formData: FormData) {
    const errors = validateCompanyFields(formData);
    if (Object.keys(errors).length > 0) {
      setCompanyFieldErrors(errors);
      return;
    }
    setCompanyFieldErrors({});
    const res = await updateCompany(formData);
    if ("error" in res) {
      setFormMsg(res.error);
      return;
    }
    setFormMsg("Company updated!");
    setEditingId(null);
  }

  async function executeDeleteCompany(companyId: string) {
    const fd = new FormData();
    fd.append("id", companyId);
    await deleteCompany(fd);
  }

  function toggleProgram(program: ProgramId) {
    setSelectedPrograms((prev) =>
      prev.includes(program)
        ? prev.filter((p) => p !== program)
        : [...prev, program],
    );
  }

  const editingCompany = companies.find((c) => c.id === editingId);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusBadgeVariant(status: string | null) {
    switch (status) {
      case "accepted":
        return "success";
      case "rejected":
        return "destructive";
      case "under_review":
        return "warning";
      case "submitted":
        return "secondary";
      default:
        return "outline";
    }
  }

  function statusLabel(status: string | null) {
    if (!status) return "No applications";
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getActiveSkillToken(value: string) {
    const i = value.lastIndexOf(",");
    return (i >= 0 ? value.slice(i + 1) : value).trim();
  }

  function applySkillSuggestion(suggestion: string) {
    const i = requiredSkillsInput.lastIndexOf(",");
    let prefix = i >= 0 ? requiredSkillsInput.slice(0, i + 1).trimEnd() : "";
    if (prefix) prefix = `${prefix} `;
    setRequiredSkillsInput(`${prefix}${suggestion}, `);
    setRequiredSkillHighlightIndex(0);
    requestAnimationFrame(() => requiredSkillsRef.current?.focus());
  }

  const activeSkillToken = getActiveSkillToken(requiredSkillsInput);
  const selectedSkills = requiredSkillsInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const filteredSkillSuggestions = skillSuggestions
    .filter(
      (s) =>
        activeSkillToken &&
        s.toLowerCase().includes(activeSkillToken.toLowerCase()) &&
        !selectedSkills.includes(s),
    )
    .slice(0, 8);

  const clampedHighlightIndex =
    requiredSkillHighlightIndex >= filteredSkillSuggestions.length
      ? 0
      : requiredSkillHighlightIndex;

  function handleRequiredSkillsKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (filteredSkillSuggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setRequiredSkillHighlightIndex((p) =>
        p + 1 >= filteredSkillSuggestions.length ? 0 : p + 1,
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setRequiredSkillHighlightIndex((p) =>
        p - 1 < 0 ? filteredSkillSuggestions.length - 1 : p - 1,
      );
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const s = filteredSkillSuggestions[clampedHighlightIndex];
      if (s) applySkillSuggestion(s);
    }
    if (event.key === "Escape") setRequiredSkillHighlightIndex(0);
  }

  const tabTitles = {
    dashboard: "Dashboard",
    students: "All Students",
    companies: "Companies",
    reports: "Reports",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <CoordinatorSidebar
        profile={profile}
        active={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">
            {tabTitles[activeTab]}
          </h1>
          {activeTab === "companies" && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setSelectedPrograms([]);
                setRequiredSkillsInput("");
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Company
            </Button>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          {/* ── Dashboard Tab ─────────────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="mx-auto max-w-5xl space-y-6">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Companies</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {companies.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                    <Users className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      Registered Students
                    </p>
                    <p className="text-3xl font-bold text-slate-900">
                      {allStudents.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Latest students */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <p className="font-semibold text-slate-900">
                    Latest Student Signups
                  </p>
                  <p className="text-xs text-slate-500">
                    5 most recent registrations
                  </p>
                </div>

                {latestStudents.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-slate-400">
                    No students yet.
                  </p>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 w-64">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {latestStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 align-top font-mono text-slate-500">
                              {student.student_id ?? student.id}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <p className="text-sm font-medium text-slate-900">
                                {student.full_name || "—"}
                              </p>
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500 w-64 break-all">
                              {student.email}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <Badge variant="secondary">
                                {student.program_id || "N/A"}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500">
                              {student.contact_number || "—"}
                            </td>
                            <td className="px-6 py-3 align-top text-right text-xs text-slate-400">
                              {formatDate(student.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Students Tab ──────────────────────────────── */}
          {activeTab === "students" && (() => {
            const PAGE_SIZE = 10;
            const totalStudentPages = Math.ceil(allStudents.length / PAGE_SIZE);
            const pagedStudents = allStudents.slice(
              (studentsPage - 1) * PAGE_SIZE,
              studentsPage * PAGE_SIZE,
            );
            return (
            <div className="mx-auto max-w-5xl space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">All Students</p>
                    <p className="text-xs text-slate-500">
                      {allStudents.length} registered
                    </p>
                  </div>
                </div>

                {allStudents.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-slate-400">
                    No students yet.
                  </p>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 w-64">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Placement
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {pagedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 align-top font-mono text-slate-500">
                              {student.student_id ?? student.id}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <p className="text-sm font-medium text-slate-900">
                                {student.full_name || "—"}
                              </p>
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500 w-64 break-all">
                              {student.email}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <Badge variant="secondary">
                                {student.program_id || "N/A"}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500">
                              {student.contact_number || "—"}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <Badge
                                variant={statusBadgeVariant(
                                  student.application_status ?? null,
                                )}
                              >
                                {statusLabel(
                                  student.application_status ?? null,
                                )}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 align-top">
                              {student.placement_company ? (
                                <span className="text-sm font-medium text-slate-900">
                                  {student.placement_company}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Not placed
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3 align-top text-right text-xs text-slate-400">
                              {formatDate(student.created_at)}
                            </td>
                            <td className="px-6 py-3 align-top text-right">
                              <Link
                                href={`/coordinator/students/${student.id}`}
                                className="rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {totalStudentPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={studentsPage === 1}
                    onClick={() => setStudentsPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {studentsPage} of {totalStudentPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={studentsPage === totalStudentPages}
                    onClick={() => setStudentsPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            );
          })()}

          {/* ── Companies Tab ─────────────────────────────── */}
          {activeTab === "companies" && (
            <div className="mx-auto max-w-5xl space-y-4">
              {formMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {formMsg}
                </div>
              )}

              {/* Company list */}
              {companies.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                  <Building2 className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-medium text-slate-500">No companies yet</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Click &quot;Add Company&quot; to get started
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {companies.map((company) => {
                  const creator = company.created_by
                    ? companyCreators[company.created_by]
                    : null;
                  const creatorLabel = creator
                    ? creator.full_name || creator.email
                    : company.created_by_name;
                  return (
                    <div
                      key={company.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {company.name}
                            </p>
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
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-400">
                            {creatorLabel && (
                              <span>Added by: {creatorLabel}</span>
                            )}
                            {company.hr_name && (
                              <span>HR: {company.hr_name}</span>
                            )}
                            {company.email_address && (
                              <span>{company.email_address}</span>
                            )}
                            {company.location_address && (
                              <span>{company.location_address}</span>
                            )}
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
                            onClick={() => {
                              setEditingId(company.id);
                              setShowForm(false);
                              setSelectedPrograms(company.eligibility_programs);
                              setRequiredSkillsInput(
                                company.required_skills.join(", "),
                              );
                            }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDialog({
                                title: "Delete company",
                                message: `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
                                onConfirm: () => executeDeleteCompany(company.id),
                              })
                            }
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Reports Tab ───────────────────────────────── */}
          {activeTab === "reports" && (
            <ReportsPanel
              role="coordinator"
              lockedProgram={profile?.program_id ?? null}
            />
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirmDialog !== null}
        title={confirmDialog?.title ?? ""}
        message={confirmDialog?.message ?? ""}
        onConfirm={() => {
          confirmDialog?.onConfirm();
          setConfirmDialog(null);
        }}
        onCancel={() => setConfirmDialog(null)}
      />

      {/* ── Company Create / Edit Modal ────────────────── */}
      {(showForm || editingId) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4"
          onClick={() => {
            setShowForm(false);
            setEditingId(null);
            setSelectedPrograms([]);
            setRequiredSkillsInput("");
            setCompanyFieldErrors({});
          }}
        >
          <div
            className="relative my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                {editingId ? "Edit Company" : "New Company"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setSelectedPrograms([]);
                  setRequiredSkillsInput("");
                  setCompanyFieldErrors({});
                }}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formMsg && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {formMsg}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await (editingId ? handleUpdate : handleCreate)(fd);
              }}
              className="space-y-4"
            >
              {editingId && (
                <input type="hidden" name="id" value={editingId} />
              )}
              <input
                type="hidden"
                name="existing_logo_url"
                value={editingCompany?.logo_url ?? ""}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input
                    name="name"
                    required
                    defaultValue={editingCompany?.name ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>HR Name</Label>
                  <Input
                    name="hr_name"
                    placeholder="Jane Doe"
                    defaultValue={editingCompany?.hr_name ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Company Email</Label>
                  <Input
                    name="email_address"
                    type="email"
                    required
                    placeholder="hr@company.com"
                    defaultValue={editingCompany?.email_address ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Number</Label>
                  <Input
                    name="contact_number"
                    placeholder="+63 9xx xxx xxxx"
                    defaultValue={editingCompany?.contact_number ?? ""}
                    aria-invalid={!!companyFieldErrors.contact_number}
                    onChange={() =>
                      setCompanyFieldErrors((p) => ({ ...p, contact_number: undefined }))
                    }
                  />
                  {companyFieldErrors.contact_number ? (
                    <p className="text-xs text-red-600">{companyFieldErrors.contact_number}</p>
                  ) : (
                    <p className="text-xs text-slate-400">11 digits, e.g. 09171234567</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Location Address</Label>
                  <Input
                    name="location_address"
                    placeholder="City, Province"
                    defaultValue={editingCompany?.location_address ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Website / Social Link</Label>
                  <Input
                    name="website_url"
                    placeholder="https://example.com"
                    defaultValue={editingCompany?.website_url ?? ""}
                    aria-invalid={!!companyFieldErrors.website_url}
                    onChange={() =>
                      setCompanyFieldErrors((p) => ({ ...p, website_url: undefined }))
                    }
                  />
                  {companyFieldErrors.website_url && (
                    <p className="text-xs text-red-600">{companyFieldErrors.website_url}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Company Picture (optional)</Label>
                  <Input
                    type="file"
                    name="company_image"
                    accept="image/*"
                  />
                  {editingCompany?.logo_url && (
                    <p className="text-xs text-slate-400">
                      Current image exists. Upload to replace.
                    </p>
                  )}
                </div>
                <div className="relative space-y-1.5">
                  <Label>Required Skills (comma-separated)</Label>
                  <Input
                    required
                    name="required_skills"
                    placeholder="React, Node.js, SQL"
                    value={requiredSkillsInput}
                    onChange={(e) => {
                      setRequiredSkillsInput(e.target.value);
                      setRequiredSkillHighlightIndex(0);
                    }}
                    onKeyDown={handleRequiredSkillsKeyDown}
                    ref={requiredSkillsRef}
                  />
                  {filteredSkillSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                      {filteredSkillSuggestions.map((skill, index) => (
                        <button
                          key={skill}
                          type="button"
                          className={`block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 ${index === clampedHighlightIndex ? "bg-slate-100" : ""}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() =>
                            setRequiredSkillHighlightIndex(index)
                          }
                          onClick={() => applySkillSuggestion(skill)}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Company Overview</Label>
                <textarea
                  name="company_overview"
                  rows={3}
                  defaultValue={editingCompany?.company_overview ?? ""}
                  className="flex w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Eligible Programs</Label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {PROGRAM_OPTIONS.map((program) => {
                    const isSelected = selectedPrograms.includes(program);
                    return (
                      <button
                        key={program}
                        type="button"
                        onClick={() => toggleProgram(program)}
                        className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
                        }`}
                      >
                        {program}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400">
                  Click to select/deselect programs.
                </p>
                {selectedPrograms.map((program) => (
                  <input
                    key={program}
                    type="hidden"
                    name="eligibility_programs"
                    value={program}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setSelectedPrograms([]);
                    setRequiredSkillsInput("");
                    setCompanyFieldErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingId ? "Update Company" : "Create Company"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
