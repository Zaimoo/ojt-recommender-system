"use client";

import { useRef, useState } from "react";
import { SuperadminSidebar } from "@/app/superadmin/_components/superadmin-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AccountForm } from "@/app/account/account-form";
import { ReportsPanel } from "@/components/reports/reports-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { CompanyAdminListItem } from "@/components/company/company-admin-list-item";
import {
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/app/actions/company";
import {
  createCoordinatorAccount,
  updateCoordinatorAccount,
  deleteCoordinatorAccount,
  setCoordinatorActive,
} from "@/app/actions/superadmin";
import { PROGRAM_OPTIONS } from "@/lib/constants/programs";
import {
  Users,
  UserCog,
  Building2,
  FileText,
  Plus,
  X,
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
  is_active: boolean;
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
    | "reports"
    | "audit"
    | "account"
  >(
    initialTab === "students" ||
      initialTab === "coordinators" ||
      initialTab === "companies" ||
      initialTab === "reports" ||
      initialTab === "audit" ||
      initialTab === "account"
      ? initialTab
      : "dashboard",
  );

  const [showCoordinatorForm, setShowCoordinatorForm] = useState(false);
  const [editingCoordinatorId, setEditingCoordinatorId] = useState<
    string | null
  >(null);
  const [coordinatorFormMsg, setCoordinatorFormMsg] = useState<string | null>(
    null,
  );
  const [coordinatorContactError, setCoordinatorContactError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [companyFieldErrors, setCompanyFieldErrors] = useState<{
    contact_number?: string;
    website_url?: string;
  }>({});
  const [selectedPrograms, setSelectedPrograms] = useState<ProgramId[]>([]);
  const [requiredSkillsInput, setRequiredSkillsInput] = useState("");
  const requiredSkillsRef = useRef<HTMLInputElement | null>(null);
  const [requiredSkillHighlightIndex, setRequiredSkillHighlightIndex] =
    useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [auditPage, setAuditPage] = useState(1);

  function validateCoordinatorContact(formData: FormData): boolean {
    const contactNumber = (formData.get("contact_number") as string)?.trim();
    if (contactNumber) {
      const digits = contactNumber.replace(/\D/g, "");
      if (digits.length !== 11) {
        setCoordinatorContactError(
          "Invalid format. Contact number should be 11 digits long.",
        );
        return false;
      }
    }
    setCoordinatorContactError(null);
    return true;
  }

  async function handleCreateCoordinator(formData: FormData) {
    if (!validateCoordinatorContact(formData)) return;
    const res = await createCoordinatorAccount(formData);
    if ("error" in res) {
      setCoordinatorFormMsg(res.error);
      return;
    }
    setCoordinatorFormMsg("Coordinator created successfully!");
    setShowCoordinatorForm(false);
    setEditingCoordinatorId(null);
  }

  async function handleUpdateCoordinator(formData: FormData) {
    if (!validateCoordinatorContact(formData)) return;
    const res = await updateCoordinatorAccount(formData);
    if ("error" in res) {
      setCoordinatorFormMsg(res.error);
      return;
    }
    setCoordinatorFormMsg("Coordinator updated successfully!");
    setShowCoordinatorForm(false);
    setEditingCoordinatorId(null);
  }

  async function executeDeleteCoordinator(coordinatorId: string, email: string) {
    const fd = new FormData();
    fd.append("id", coordinatorId);
    fd.append("email", email);
    const res = await deleteCoordinatorAccount(fd);
    if ("error" in res) {
      setCoordinatorFormMsg(res.error);
      return;
    }
    setCoordinatorFormMsg("Coordinator deleted successfully!");
  }

  async function handleToggleCoordinatorActive(
    coordinatorId: string,
    nextActive: boolean,
  ) {
    const fd = new FormData();
    fd.append("id", coordinatorId);
    fd.append("is_active", String(nextActive));
    const res = await setCoordinatorActive(fd);
    if ("error" in res) {
      setCoordinatorFormMsg(res.error);
      return;
    }
    setCoordinatorFormMsg(
      nextActive
        ? "Coordinator activated successfully!"
        : "Coordinator deactivated successfully!",
    );
  }

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

  const editingCoordinator = coordinators.find(
    (coordinator) => coordinator.id === editingCoordinatorId,
  );

  const tabTitles = {
    dashboard: "Dashboard",
    students: "Students",
    coordinators: "Coordinators",
    companies: "Companies",
    reports: "Reports",
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
                setEditingCoordinatorId(null);
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

              {/* ── Analytics ─────────────────────────────── */}
              {(() => {
                const programLabels: Record<string, string> = {
                  BSIS: "BSIS", BSIT: "BSIT", BSCS: "BSCS", BSCA: "BSCA",
                };
                const programColors: Record<string, string> = {
                  BSIS: "bg-blue-500", BSIT: "bg-violet-500",
                  BSCS: "bg-emerald-500", BSCA: "bg-amber-500",
                };
                const programCounts = Object.fromEntries(
                  Object.keys(programLabels).map((p) => [
                    p,
                    students.filter((s) => s.program_id === p).length,
                  ]),
                );
                const unassigned = students.filter((s) => !s.program_id).length;
                const maxCount = Math.max(...Object.values(programCounts), unassigned, 1);

                const skillCounts: Record<string, number> = {};
                companies.forEach((c) =>
                  c.required_skills.forEach((sk) => {
                    skillCounts[sk] = (skillCounts[sk] ?? 0) + 1;
                  }),
                );
                const topSkills = Object.entries(skillCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10);

                function formatAction(action: string) {
                  return action
                    .replace("company.create", "Created company")
                    .replace("company.update", "Updated company")
                    .replace("company.delete", "Deleted company")
                    .replace("coordinator.create", "Created coordinator")
                    .replace("coordinator.update", "Updated coordinator")
                    .replace("coordinator.delete", "Deleted coordinator")
                    .replace("application.status.update", "Updated application")
                    .replace(/\./g, " ");
                }

                return (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Students by program */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="mb-4 font-semibold text-slate-900">
                        Students by Program
                      </p>
                      <div className="space-y-3">
                        {Object.entries(programLabels).map(([key, label]) => (
                          <div key={key}>
                            <div className="mb-1 flex justify-between text-xs text-slate-500">
                              <span>{label}</span>
                              <span className="font-medium text-slate-700">
                                {programCounts[key]}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${programColors[key]}`}
                                style={{
                                  width: `${(programCounts[key] / maxCount) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        {unassigned > 0 && (
                          <div>
                            <div className="mb-1 flex justify-between text-xs text-slate-500">
                              <span>Unassigned</span>
                              <span className="font-medium text-slate-700">
                                {unassigned}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-2 rounded-full bg-slate-400 transition-all duration-500"
                                style={{
                                  width: `${(unassigned / maxCount) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent activity */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="mb-4 font-semibold text-slate-900">
                        Recent Activity
                      </p>
                      {auditLogs.length === 0 ? (
                        <p className="text-sm text-slate-400">No activity yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {auditLogs.slice(0, 6).map((log) => (
                            <div key={log.id} className="flex items-start gap-3">
                              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                              <div className="min-w-0">
                                <p className="truncate text-sm text-slate-700">
                                  {formatAction(log.action)}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {log.actor?.full_name || log.actor?.email || "System"}{" "}
                                  · {formatDateTime(log.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top required skills */}
                    {topSkills.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <p className="mb-4 font-semibold text-slate-900">
                          Top Required Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {topSkills.map(([skill, count]) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                            >
                              {skill}
                              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                                {count}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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

          {activeTab === "coordinators" && (
            <div className="mx-auto max-w-6xl space-y-4">
              {coordinatorFormMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {coordinatorFormMsg}
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
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 w-64">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 w-24">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                            Actions
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
                            <td className="px-6 py-3 align-top text-slate-500 w-64 break-all">
                              {coordinator.email}
                            </td>
                            <td className="px-6 py-3 align-top w-24">
                              <Badge variant="secondary">
                                {coordinator.program_id || "N/A"}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 align-top text-slate-500">
                              {coordinator.contact_number || "—"}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <Badge
                                variant={
                                  coordinator.is_active
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {coordinator.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 align-top text-xs text-slate-400">
                              {formatDate(coordinator.created_at)}
                            </td>
                            <td className="px-6 py-3 align-top text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDialog({
                                    title: coordinator.is_active
                                      ? "Deactivate coordinator"
                                      : "Activate coordinator",
                                    message: coordinator.is_active
                                      ? `Deactivate "${coordinator.full_name || coordinator.email}"? They will be signed out and unable to log in until reactivated.`
                                      : `Activate "${coordinator.full_name || coordinator.email}"? They will be able to log in again.`,
                                    onConfirm: () =>
                                      handleToggleCoordinatorActive(
                                        coordinator.id,
                                        !coordinator.is_active,
                                      ),
                                  })
                                }
                                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                                  coordinator.is_active
                                    ? "text-amber-600 hover:bg-amber-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {coordinator.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCoordinatorId(coordinator.id);
                                  setShowCoordinatorForm(false);
                                  setCoordinatorFormMsg(null);
                                }}
                                className="ml-2 rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDialog({
                                    title: "Delete coordinator",
                                    message: `Are you sure you want to delete "${coordinator.full_name || coordinator.email}"? This action cannot be undone.`,
                                    onConfirm: () =>
                                      executeDeleteCoordinator(
                                        coordinator.id,
                                        coordinator.email,
                                      ),
                                  })
                                }
                                className="ml-2 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
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
                </div>
              )}

              {/* Company list */}
              {companies.length === 0 && (
                <EmptyState
                  icon={Building2}
                  title="No companies yet"
                  description='Click "Add Company" to get started'
                />
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
                    <CompanyAdminListItem
                      key={company.id}
                      company={company}
                      creatorLabel={creatorLabel}
                      onEdit={() => {
                        setEditingId(company.id);
                        setShowForm(false);
                        setSelectedPrograms(company.eligibility_programs);
                        setRequiredSkillsInput(
                          company.required_skills.join(", "),
                        );
                      }}
                      onDelete={() =>
                        setConfirmDialog({
                          title: "Delete company",
                          message: `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
                          onConfirm: () => executeDeleteCompany(company.id),
                        })
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "reports" && <ReportsPanel role="superadmin" />}

          {activeTab === "audit" && (() => {
            const AUDIT_PAGE_SIZE = 10;
            const totalAuditPages = Math.ceil(auditLogs.length / AUDIT_PAGE_SIZE);
            const pagedAuditLogs = auditLogs.slice(
              (auditPage - 1) * AUDIT_PAGE_SIZE,
              auditPage * AUDIT_PAGE_SIZE,
            );
            return (
            <div className="mx-auto max-w-6xl space-y-4">
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
                        {pagedAuditLogs.map((log) => (
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

              <Pagination
                page={auditPage}
                totalPages={totalAuditPages}
                onPageChange={setAuditPage}
              />
            </div>
            );
          })()}

          {activeTab === "account" && (
            <div className="mx-auto max-w-2xl">
              <AccountForm profile={profile} />
            </div>
          )}
        </main>
      </div>

      {/* ── Coordinator Create / Edit Modal ───────────── */}
      {(showCoordinatorForm || editingCoordinatorId) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4"
          onClick={() => {
            setShowCoordinatorForm(false);
            setEditingCoordinatorId(null);
            setCoordinatorContactError(null);
          }}
        >
          <div
            className="relative my-8 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                {editingCoordinatorId ? "Edit Coordinator" : "New Coordinator"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowCoordinatorForm(false);
                  setEditingCoordinatorId(null);
                  setCoordinatorContactError(null);
                }}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {coordinatorFormMsg && !coordinatorFormMsg.includes("successfully") && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {coordinatorFormMsg}
              </div>
            )}

            <form
              action={
                editingCoordinatorId
                  ? handleUpdateCoordinator
                  : handleCreateCoordinator
              }
              className="space-y-4"
            >
              {editingCoordinatorId && (
                <input type="hidden" name="id" value={editingCoordinatorId} />
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="coordinator@university.edu"
                    defaultValue={editingCoordinator?.email ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    name="password"
                    type="password"
                    required={!editingCoordinatorId}
                    placeholder={
                      editingCoordinatorId
                        ? "Leave blank to keep current"
                        : "Minimum 6 characters"
                    }
                    minLength={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    name="full_name"
                    required
                    placeholder="Jane Doe"
                    defaultValue={editingCoordinator?.full_name ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Program</Label>
                  <select
                    name="program_id"
                    required
                    defaultValue={editingCoordinator?.program_id ?? ""}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a program...</option>
                    {PROGRAM_OPTIONS.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Contact Number</Label>
                  <Input
                    name="contact_number"
                    placeholder="+63 9xx xxx xxxx"
                    defaultValue={editingCoordinator?.contact_number ?? ""}
                    aria-invalid={!!coordinatorContactError}
                    onChange={() => setCoordinatorContactError(null)}
                  />
                  {coordinatorContactError ? (
                    <p className="text-xs text-red-600">{coordinatorContactError}</p>
                  ) : (
                    <p className="text-xs text-slate-400">11 digits, e.g. 09171234567</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCoordinatorForm(false);
                    setEditingCoordinatorId(null);
                    setCoordinatorContactError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingCoordinatorId ? "Update Coordinator" : "Create Coordinator"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
