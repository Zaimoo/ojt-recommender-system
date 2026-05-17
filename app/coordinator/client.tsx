"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
import {
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/app/actions/company";
import { PROGRAM_OPTIONS } from "@/lib/constants/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  X,
  LayoutDashboard,
  GraduationCap,
} from "lucide-react";
import { CoordinatorSidebar } from "@/app/coordinator/_components/coordinator-sidebar";
import type { Profile, Company, ProgramId } from "@/types";

interface StudentSummary {
  id: string;
  full_name: string;
  email: string;
  program_id: ProgramId | null;
  contact_number: string | null;
  student_id: string | null;
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

export function CoordinatorPanelClient({
  profile,
  companies,
  companyCreators,
  allStudents,
  latestStudents,
  initialTab,
}: Props) {
  const skillSuggestions = Array.from(
    new Set(companies.flatMap((company) => company.required_skills ?? [])),
  ).sort((a, b) => a.localeCompare(b));
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "students" | "companies"
  >(
    initialTab === "students" || initialTab === "companies"
      ? initialTab
      : "dashboard",
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<ProgramId[]>([]);
  const [requiredSkillsInput, setRequiredSkillsInput] = useState("");
  const requiredSkillsRef = useRef<HTMLInputElement | null>(null);
  const [requiredSkillHighlightIndex, setRequiredSkillHighlightIndex] =
    useState(0);

  async function handleCreate(formData: FormData) {
    const res = await createCompany(formData);
    if ("error" in res) {
      setFormMsg(res.error);
      return;
    }

    setFormMsg("Company created!");
    setShowForm(false);
    setRequiredSkillsInput("");
    setRequiredSkillHighlightIndex(0);
  }

  async function handleUpdate(formData: FormData) {
    const res = await updateCompany(formData);
    if ("error" in res) {
      setFormMsg(res.error);
      return;
    }

    setFormMsg("Company updated!");
    setEditingId(null);
    setRequiredSkillHighlightIndex(0);
  }

  async function handleDelete(formData: FormData) {
    if (!confirm("Delete this company?")) return;
    await deleteCompany(formData);
  }

  function toggleProgram(program: ProgramId) {
    setSelectedPrograms((prev) =>
      prev.includes(program)
        ? prev.filter((item) => item !== program)
        : [...prev, program],
    );
  }

  const editingCompany = companies.find((c) => c.id === editingId);
  useEffect(() => {
    setRequiredSkillsInput(editingCompany?.required_skills?.join(", ") ?? "");
  }, [editingCompany]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  function resolveCreator(company: Company): CompanyCreator | null {
    if (!company.created_by) return null;
    return companyCreators[company.created_by] ?? null;
  }

  function getActiveSkillToken(value: string) {
    const lastCommaIndex = value.lastIndexOf(",");
    const token = lastCommaIndex >= 0 ? value.slice(lastCommaIndex + 1) : value;
    return token.trim();
  }

  function applySkillSuggestion(suggestion: string) {
    const lastCommaIndex = requiredSkillsInput.lastIndexOf(",");
    let prefix = "";
    if (lastCommaIndex >= 0) {
      prefix = requiredSkillsInput.slice(0, lastCommaIndex + 1).trimEnd();
      prefix = prefix ? `${prefix} ` : "";
    }
    const nextValue = `${prefix}${suggestion}, `;
    setRequiredSkillsInput(nextValue);
    setRequiredSkillHighlightIndex(0);
    requestAnimationFrame(() => requiredSkillsRef.current?.focus());
  }

  const activeSkillToken = getActiveSkillToken(requiredSkillsInput);
  const selectedSkills = requiredSkillsInput
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  const filteredSkillSuggestions = skillSuggestions
    .filter((skill) => {
      if (!activeSkillToken) return false;
      const matches = skill
        .toLowerCase()
        .includes(activeSkillToken.toLowerCase());
      return matches && !selectedSkills.includes(skill);
    })
    .slice(0, 8);

  useEffect(() => {
    if (filteredSkillSuggestions.length === 0) {
      setRequiredSkillHighlightIndex(0);
      return;
    }
    setRequiredSkillHighlightIndex(0);
  }, [activeSkillToken, filteredSkillSuggestions.length]);

  function handleRequiredSkillsKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (filteredSkillSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setRequiredSkillHighlightIndex((prev) =>
        prev + 1 >= filteredSkillSuggestions.length ? 0 : prev + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setRequiredSkillHighlightIndex((prev) =>
        prev - 1 < 0 ? filteredSkillSuggestions.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = filteredSkillSuggestions[requiredSkillHighlightIndex];
      if (selected) applySkillSuggestion(selected);
    }

    if (event.key === "Escape") {
      setRequiredSkillHighlightIndex(0);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CoordinatorSidebar
        profile={profile}
        active={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "students" && "All Students"}
              {activeTab === "companies" && "Companies"}
            </h2>
          </div>
        </header>

        <main className="space-y-6 p-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Companies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{companies.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">
                      Registered Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{allStudents.length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Latest Student Signups
                  </CardTitle>
                  <CardDescription>5 most recent registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  {latestStudents.length === 0 ? (
                    <p className="text-sm text-slate-500">No students yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-slate-500">
                            <th className="pb-2 pr-4">Name</th>
                            <th className="pb-2 pr-4">Email</th>
                            <th className="pb-2 pr-4">Program</th>
                            <th className="pb-2 pr-4">Contact</th>
                            <th className="pb-2 pr-4">Student ID</th>
                            <th className="pb-2">Signup Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {latestStudents.map((student) => (
                            <tr
                              key={student.id}
                              className="border-b last:border-0"
                            >
                              <td className="py-2 pr-4 font-medium">
                                {student.full_name || "-"}
                              </td>
                              <td className="py-2 pr-4 text-slate-600">
                                {student.email}
                              </td>
                              <td className="py-2 pr-4">
                                <Badge variant="secondary">
                                  {student.program_id || "N/A"}
                                </Badge>
                              </td>
                              <td className="py-2 pr-4 text-slate-600">
                                {student.contact_number || "-"}
                              </td>
                              <td className="py-2 pr-4 text-slate-600">
                                {student.student_id || "-"}
                              </td>
                              <td className="py-2 text-slate-600">
                                {formatDate(student.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Students Tab */}
          {activeTab === "students" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Students</CardTitle>
                <CardDescription>
                  Complete list of registered students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allStudents.length === 0 ? (
                  <p className="text-sm text-slate-500">No students yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-slate-500">
                          <th className="pb-2 pr-4">Name</th>
                          <th className="pb-2 pr-4">Email</th>
                          <th className="pb-2 pr-4">Program</th>
                          <th className="pb-2 pr-4">Contact</th>
                          <th className="pb-2">Student ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStudents.map((student) => (
                          <tr
                            key={student.id}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 pr-4 font-medium">
                              {student.full_name || "-"}
                            </td>
                            <td className="py-2 pr-4">{student.email}</td>
                            <td className="py-2 pr-4">
                              <Badge variant="secondary">
                                {student.program_id || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-2 pr-4 text-slate-600">
                              {student.contact_number || "-"}
                            </td>
                            <td className="py-2 text-slate-600">
                              {student.student_id || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Companies Tab */}
          {activeTab === "companies" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Company Listings</CardTitle>
                  <CardDescription>
                    Manage OJT partner companies
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setSelectedPrograms([]);
                    setRequiredSkillsInput("");
                  }}
                  size="sm"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Company
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formMsg && <p className="text-sm text-green-600">{formMsg}</p>}

                {(showForm || editingId) && (
                  <form
                    action={editingId ? handleUpdate : handleCreate}
                    className="space-y-4 rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {editingId ? "Edit Company" : "New Company"}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowForm(false);
                          setEditingId(null);
                          setSelectedPrograms([]);
                          setRequiredSkillsInput("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {editingId && (
                      <input type="hidden" name="id" value={editingId} />
                    )}
                    <input
                      type="hidden"
                      name="existing_logo_url"
                      value={editingCompany?.logo_url ?? ""}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 relative">
                        <Label>Company Name</Label>
                        <Input
                          name="name"
                          required
                          defaultValue={editingCompany?.name ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>HR Name</Label>
                        <Input
                          name="hr_name"
                          placeholder="Jane Doe"
                          defaultValue={editingCompany?.hr_name ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Company Email</Label>
                        <Input
                          name="email_address"
                          type="email"
                          placeholder="hr@company.com"
                          defaultValue={editingCompany?.email_address ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input
                          name="contact_number"
                          placeholder="+63 9xx xxx xxxx"
                          defaultValue={editingCompany?.contact_number ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Location Address</Label>
                        <Input
                          name="location_address"
                          placeholder="City, Province"
                          defaultValue={editingCompany?.location_address ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Website / Social Link</Label>
                        <Input
                          name="website_url"
                          placeholder="https://..."
                          defaultValue={editingCompany?.website_url ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Company Picture (optional)</Label>
                        <Input
                          type="file"
                          name="company_image"
                          accept="image/*"
                        />
                        {editingCompany?.logo_url && (
                          <p className="text-xs text-slate-500">
                            Current image exists. Upload a new file to replace
                            it.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 relative">
                        <Label>Required Skills (comma-separated)</Label>
                        <Input
                          name="required_skills"
                          placeholder="React, Node.js, SQL"
                          value={requiredSkillsInput}
                          onChange={(event) => {
                            setRequiredSkillsInput(event.target.value);
                            setRequiredSkillHighlightIndex(0);
                          }}
                          onKeyDown={handleRequiredSkillsKeyDown}
                          ref={requiredSkillsRef}
                        />
                        {filteredSkillSuggestions.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-sm">
                            {filteredSkillSuggestions.map((skill, index) => (
                              <button
                                key={skill}
                                type="button"
                                className={`block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 ${
                                  index === requiredSkillHighlightIndex
                                    ? "bg-slate-100"
                                    : ""
                                }`}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() =>
                                  setRequiredSkillHighlightIndex(index)
                                }
                                onClick={() => applySkillSuggestion(skill)}
                                aria-selected={
                                  index === requiredSkillHighlightIndex
                                }
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Company Overview</Label>
                      <Textarea
                        name="company_overview"
                        defaultValue={editingCompany?.company_overview ?? ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Eligible Programs</Label>
                      <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 p-3">
                        {PROGRAM_OPTIONS.map((program) => {
                          const isSelected = selectedPrograms.includes(program);
                          return (
                            <button
                              key={program}
                              type="button"
                              onClick={() => toggleProgram(program)}
                              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
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
                      <p className="text-xs text-slate-500">
                        Click once to select. Click again to unselect.
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

                    <Button type="submit" size="sm">
                      {editingId ? "Update" : "Create"}
                    </Button>
                  </form>
                )}

                {companies.length === 0 && (
                  <p className="text-sm text-slate-500">No companies yet.</p>
                )}

                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 p-4 md:flex-row"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{company.name}</h4>
                        <div className="flex flex-wrap gap-1">
                          {(company.eligibility_programs.length > 0
                            ? company.eligibility_programs
                            : ["N/A"]
                          ).map((program) => (
                            <Badge key={program} variant="outline">
                              {program}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-slate-600">
                        {company.company_overview}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
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

                      <div className="space-y-1 pt-1 text-xs text-slate-500">
                        {(() => {
                          const creator = resolveCreator(company);
                          if (!creator) return null;
                          return (
                            <p>
                              Added by: {creator.full_name || creator.email}
                            </p>
                          );
                        })()}
                        {company.hr_name && <p>HR: {company.hr_name}</p>}
                        {company.email_address && (
                          <p>Email: {company.email_address}</p>
                        )}
                        {company.contact_number && (
                          <p>Number: {company.contact_number}</p>
                        )}
                        {company.location_address && (
                          <p>Location: {company.location_address}</p>
                        )}
                        {company.website_url && (
                          <p>
                            Link:{" "}
                            <a
                              href={normalizeUrl(company.website_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline"
                            >
                              {company.website_url}
                            </a>
                          </p>
                        )}
                        <Link
                          href={`/companyDetails/${company.id}`}
                          className="inline-block text-blue-600 underline"
                        >
                          Open company details
                        </Link>
                      </div>
                    </div>

                    <div className="flex gap-2 self-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(company.id);
                          setShowForm(false);
                          setSelectedPrograms(company.eligibility_programs);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <form action={handleDelete}>
                        <input type="hidden" name="id" value={company.id} />
                        <Button variant="ghost" size="icon" type="submit">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
