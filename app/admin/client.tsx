"use client";

import { useState } from "react";
import { signOut } from "@/app/actions/auth";
import {
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/app/actions/company";
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
  LogOut,
  User,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  X,
} from "lucide-react";
import type { Profile, Company } from "@/types";

interface StudentSummary {
  id: string;
  full_name: string;
  email: string;
  program_id: string | null;
}

interface Props {
  profile: Profile | null;
  companies: Company[];
  students: StudentSummary[];
}

export function AdminPanelClient({ profile, companies, students }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    const res = await createCompany(formData);
    setFormMsg(res?.error ?? "Company created!");
    if (!res?.error) setShowForm(false);
  }

  async function handleUpdate(formData: FormData) {
    const res = await updateCompany(formData);
    setFormMsg(res?.error ?? "Company updated!");
    if (!res?.error) setEditingId(null);
  }

  async function handleDelete(formData: FormData) {
    if (!confirm("Delete this company?")) return;
    await deleteCompany(formData);
  }

  const editingCompany = companies.find((c) => c.id === editingId);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              OJT Recommender — Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <User className="h-4 w-4" />
              {profile?.full_name || profile?.email}
            </div>
            <form action={signOut}>
              <Button variant="ghost" size="sm">
                <LogOut className="mr-1 h-4 w-4" /> Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <h2 className="text-2xl font-bold">Coordinator Panel</h2>

        {/* ── Summary Cards ──────────────────────────── */}
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
              <CardTitle className="text-lg">Registered Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{students.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Students Table ──────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-slate-500">No students yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2">Program</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">
                          {s.full_name || "—"}
                        </td>
                        <td className="py-2 pr-4">{s.email}</td>
                        <td className="py-2">
                          <Badge variant="secondary">
                            {s.program_id || "N/A"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Company Management ──────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Company Listings</CardTitle>
              <CardDescription>Manage OJT partner companies</CardDescription>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
              }}
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Company
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formMsg && <p className="text-sm text-green-600">{formMsg}</p>}

            {/* Create / Edit Form */}
            {(showForm || editingId) && (
              <form
                action={editingId ? handleUpdate : handleCreate}
                className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
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
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {editingId && (
                  <input type="hidden" name="id" value={editingId} />
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      name="name"
                      required
                      defaultValue={editingCompany?.name ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Required Skills (comma-separated)</Label>
                    <Input
                      name="required_skills"
                      placeholder="React, Node.js, SQL"
                      defaultValue={
                        editingCompany?.required_skills?.join(", ") ?? ""
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    name="description"
                    defaultValue={editingCompany?.description ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eligible Programs (comma-separated)</Label>
                  <Input
                    name="eligibility_programs"
                    placeholder="BSIT, BSCS"
                    defaultValue={
                      editingCompany?.eligibility_programs?.join(", ") ?? ""
                    }
                  />
                </div>
                <Button type="submit" size="sm">
                  {editingId ? "Update" : "Create"}
                </Button>
              </form>
            )}

            {/* Listing */}
            {companies.length === 0 && (
              <p className="text-sm text-slate-500">No companies yet.</p>
            )}

            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-start justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold">{company.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {company.description}
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
                  <div className="flex flex-wrap gap-1 pt-1">
                    {company.eligibility_programs.map((prog) => (
                      <Badge key={prog} variant="outline" className="text-xs">
                        {prog}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingId(company.id);
                      setShowForm(false);
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
      </main>
    </div>
  );
}
