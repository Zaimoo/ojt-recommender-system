"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SuperadminSidebar } from "@/app/superadmin/_components/superadmin-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AccountForm } from "@/app/account/account-form";
import {
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/app/actions/company";
import { createCoordinatorAccount } from "@/app/actions/superadmin";
import { PROGRAM_OPTIONS } from "@/lib/constants/programs";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  Globe,
} from "lucide-react";
import type { Profile, ProgramId, Company } from "@/types";

interface StudentSummary {
  id: string;
  full_name: string | null;
  email: string;
  program_id: ProgramId | null;
  contact_number: string | null;
  student_id: string | null;
  created_at: string;
}

interface CoordinatorSummary {
  id: string;
  full_name: string | null;
  email: string;
  program_id: ProgramId | null;
  contact_number: string | null;
  created_at: string;
}

interface CompanyCreator {
  id: string;
  full_name: string | null;
  email: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
  details: Record<string, unknown> | null;
}

interface Props {
  profile: Profile | null;
  students: StudentSummary[];
  coordinators: CoordinatorSummary[];
  companies: Company[];
  companyCreators: Record<string, CompanyCreator>;
  auditLogs: AuditLogEntry[];
  initialTab?: string;
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SuperadminPanelClient({
  profile,
  students,
  coordinators,
  companies,
  companyCreators,
  auditLogs,
  initialTab,
}: Props) {
  const skillSuggestions = Array.from(
    new Set(companies.flatMap((c) => c.required_skills ?? [])),
  ).sort((a, b) => a.localeCompare(b));

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "students"
    | "coordinators"
    | "companies"
    | "audit"
    | "account"
  >(
    initialTab === "students" ||
      initialTab === "coordinators" ||
      initialTab === "companies" ||
      initialTab === "audit" ||
      initialTab === "account"
      ? initialTab
      : "dashboard",
  );

  const [showCoordinatorForm, setShowCoordinatorForm] = useState(false);
  const [coordinatorFormMsg, setCoordinatorFormMsg] = useState<string | null>(
    null,
  );

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<ProgramId[]>([]);
  const [requiredSkillsInput, setRequiredSkillsInput] = useState("");
  const requiredSkillsRef = useRef<HTMLInputElement | null>(null);
  const [requiredSkillHighlightIndex, setRequiredSkillHighlightIndex] =
    useState(0);

  async function handleCreateCoordinator(formData: FormData) {
    const res = await createCoordinatorAccount(formData);
    if ("error" in res) {
      setCoordinatorFormMsg(res.error);
      return;
    }
    setCoordinatorFormMsg("Coordinator created successfully!");
    setShowCoordinatorForm(false);
  }

  async function handleCreate(formData: FormData) {
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
    const res = await updateCompany(formData);
    if ("error" in res) {
      setFormMsg(res.error);
      return;
    }
    setFormMsg("Company updated!");
    setEditingId(null);
  }

  async function handleDelete(formData: FormData) {
    if (!confirm("Delete this company?")) return;
    await deleteCompany(formData);
  }

  function toggleProgram(program: ProgramId) {
    setSelectedPrograms((prev) =>
      prev.includes(program)
        ? prev.filter((p) => p !== program)
        : [...prev, program],
    );
  }

  const editingCompany = companies.find((c) => c.id === editingId);

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
    students: "Students",
    coordinators: "Coordinators",
    companies: "Companies",
    audit: "Audit Log",
    account: "Account Settings",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <SuperadminSidebar
        profile={profile}
        active={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">
            {tabTitles[activeTab]}
          </h1>
          {activeTab === "coordinators" && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setShowCoordinatorForm(true);
                setCoordinatorFormMsg(null);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Coordinator
            </Button>
          )}
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
          {activeTab === "dashboard" && (
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Total Students",
                    value: students.length,
                    icon: Users,
                    bg: "bg-emerald-50",
                    color: "text-emerald-600",
                  },
                  {
                    label: "Total Coordinators",
                    value: coordinators.length,
                    icon: UserCog,
                    bg: "bg-blue-50",
                    color: "text-blue-600",
                  },
                  {
                    label: "Total Companies",
                    value: companies.length,
                    icon: Building2,
                    bg: "bg-violet-50",
                    color: "text-violet-600",
                  },
                  {
                    label: "Audit Events",
                    value: auditLogs.length,
                    icon: FileText,
                    bg: "bg-slate-100",
                    color: "text-slate-600",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}
                    >
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-slate-500" />
                  <p className="text-sm text-slate-600">
                    Coordinator accounts can be added from the Coordinators tab.
                    Companies can be added from the Companies tab.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="mx-auto max-w-6xl">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <p className="font-semibold text-slate-900">All Students</p>
                  <p className="text-xs text-slate-500">
                    {students.length} registered
                  </p>
                </div>

                {students.length === 0 ? (
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
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
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
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 align-top font-mono text-slate-500">
                              {student.student_id ?? student.id}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <p className="text-sm font-medium text-slate-900">
                                {student.full_name || "—"}
                              </p>
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500">
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

          {activeTab === "coordinators" && (
            <div className="mx-auto max-w-6xl space-y-4">
              {coordinatorFormMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {coordinatorFormMsg}
                </div>
              )}

              {showCoordinatorForm && (
                <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold text-slate-900">
                      New Coordinator
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCoordinatorForm(false);
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form action={handleCreateCoordinator} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input
                          name="email"
                          type="email"
                          required
                          placeholder="coordinator@university.edu"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Password</Label>
                        <Input
                          name="password"
                          type="password"
                          required
                          placeholder="Minimum 6 characters"
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Full Name</Label>
                        <Input
                          name="full_name"
                          required
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Program</Label>
                        <select
                          name="program_id"
                          required
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select a program...</option>
                          {PROGRAM_OPTIONS.map((program) => (
                            <option key={program} value={program}>
                              {program}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Contact Number</Label>
                        <Input
                          name="contact_number"
                          placeholder="+63 9xx xxx xxxx"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Create Coordinator
                    </Button>
                  </form>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <p className="font-semibold text-slate-900">
                    All Coordinators
                  </p>
                  <p className="text-xs text-slate-500">
                    {coordinators.length} total
                  </p>
                </div>

                {coordinators.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-slate-400">
                    No coordinators yet.
                  </p>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
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
                        {coordinators.map((coordinator) => (
                          <tr
                            key={coordinator.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-6 py-3 align-top">
                              <p className="text-sm font-medium text-slate-900">
                                {coordinator.full_name || "—"}
                              </p>
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500">
                              {coordinator.email}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <Badge variant="secondary">
                                {coordinator.program_id || "N/A"}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500">
                              {coordinator.contact_number || "—"}
                            </td>
                            <td className="px-6 py-3 align-top text-right text-xs text-slate-400">
                              {formatDate(coordinator.created_at)}
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

          {activeTab === "companies" && (
            <div className="mx-auto max-w-6xl space-y-4">
              {formMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {formMsg}
                </div>
              )}

              {/* Add / Edit Form */}
              {(showForm || editingId) && (
                <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
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
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form
                    action={editingId ? handleUpdate : handleCreate}
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
                        />
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
                          placeholder="https://..."
                          defaultValue={editingCompany?.website_url ?? ""}
                        />
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
                      <Textarea
                        name="company_overview"
                        rows={3}
                        defaultValue={editingCompany?.company_overview ?? ""}
                        placeholder="What does the company do?"
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

                    <Button
                      type="submit"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {editingId ? "Update Company" : "Create Company"}
                    </Button>
                  </form>
                </div>
              )}

              {/* Company list */}
              {companies.length === 0 && !showForm && !editingId && (
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
                            {creator && (
                              <span>
                                Added by: {creator.full_name || creator.email}
                              </span>
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
                          <form action={handleDelete}>
                            <input type="hidden" name="id" value={company.id} />
                            <button
                              type="submit"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="mx-auto max-w-6xl">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <p className="font-semibold text-slate-900">Audit Log</p>
                  <p className="text-xs text-slate-500">
                    {auditLogs.length} entries
                  </p>
                </div>

                {auditLogs.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-slate-400">
                    No audit events yet.
                  </p>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Actor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Entity
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 align-top">
                              <p className="text-sm font-medium text-slate-900">
                                {log.actor?.full_name ||
                                  log.actor?.email ||
                                  "System"}
                              </p>
                              {log.actor?.email && (
                                <p className="text-xs text-slate-400">
                                  {log.actor.email}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500">
                              {log.action}
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500">
                              {log.entity_type}
                              {log.entity_id ? ` · ${log.entity_id}` : ""}
                            </td>
                            <td className="px-6 py-3 align-top text-right text-xs text-slate-400">
                              {formatDateTime(log.created_at)}
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

          {activeTab === "account" && (
            <div className="mx-auto max-w-2xl">
              <AccountForm profile={profile} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
