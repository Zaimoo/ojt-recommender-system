"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  updateStudentSkills,
  updateStudentProgram,
} from "@/app/actions/student";
import { PROGRAM_OPTIONS } from "@/lib/constants/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudentSidebar } from "./_components/student-sidebar";
import { Sparkles, FileText, CheckCircle2, Circle } from "lucide-react";
import type { Profile, StudentProfile } from "@/types";

interface Props {
  profile: Profile | null;
  studentProfile: StudentProfile | null;
  skillSuggestions: string[];
}

export function StudentDashboardClient({
  profile,
  studentProfile,
  skillSuggestions,
}: Props) {
  const [skillMsg, setSkillMsg] = useState<string | null>(null);
  const [programMsg, setProgramMsg] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState(
    studentProfile?.technical_skills?.join(", ") ?? "",
  );
  const skillsInputRef = useRef<HTMLInputElement | null>(null);
  const [skillHighlightIndex, setSkillHighlightIndex] = useState(0);

  async function handleSkillsSubmit(formData: FormData) {
    const res = await updateStudentSkills(formData);
    setSkillMsg(res?.error ?? "Skills updated successfully!");
  }

  async function handleProgramSubmit(formData: FormData) {
    const res = await updateStudentProgram(formData);
    setProgramMsg(res?.error ?? "Program updated successfully!");
  }

  function getActiveSkillToken(value: string) {
    const lastCommaIndex = value.lastIndexOf(",");
    return lastCommaIndex >= 0
      ? value.slice(lastCommaIndex + 1).trim()
      : value.trim();
  }

  function applySkillSuggestion(suggestion: string) {
    const lastCommaIndex = skillsInput.lastIndexOf(",");
    let prefix = "";
    if (lastCommaIndex >= 0) {
      prefix = skillsInput.slice(0, lastCommaIndex + 1).trimEnd();
      prefix = prefix ? `${prefix} ` : "";
    }
    setSkillsInput(`${prefix}${suggestion}, `);
    setSkillHighlightIndex(0);
    requestAnimationFrame(() => skillsInputRef.current?.focus());
  }

  const activeSkillToken = getActiveSkillToken(skillsInput);
  const selectedSkills = skillsInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const filteredSkillSuggestions = skillSuggestions
    .filter((s) => {
      if (!activeSkillToken) return false;
      return (
        s.toLowerCase().includes(activeSkillToken.toLowerCase()) &&
        !selectedSkills.includes(s)
      );
    })
    .slice(0, 8);

  const clampedHighlightIndex =
    skillHighlightIndex >= filteredSkillSuggestions.length
      ? 0
      : skillHighlightIndex;

  function handleSkillsKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (filteredSkillSuggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSkillHighlightIndex((p) =>
        p + 1 >= filteredSkillSuggestions.length ? 0 : p + 1,
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSkillHighlightIndex((p) =>
        p - 1 < 0 ? filteredSkillSuggestions.length - 1 : p - 1,
      );
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const s = filteredSkillSuggestions[clampedHighlightIndex];
      if (s) applySkillSuggestion(s);
    }
    if (event.key === "Escape") setSkillHighlightIndex(0);
  }

  const completionItems = [
    { label: "Full name", done: !!profile?.full_name },
    { label: "Contact number", done: !!profile?.contact_number },
    { label: "Student ID", done: !!profile?.student_id },
    { label: "Program", done: !!profile?.program_id },
    {
      label: "Skills",
      done: (studentProfile?.technical_skills?.length ?? 0) > 0,
    },
    { label: "Project experience", done: !!studentProfile?.project_exp },
  ];
  const completedCount = completionItems.filter((i) => i.done).length;
  const completionPercent = Math.round(
    (completedCount / completionItems.length) * 100,
  );

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <StudentSidebar profile={profile} active="dashboard" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Hello, {firstName} 👋
            </h1>
            <p className="text-xs text-slate-500">
              Here&apos;s your OJT dashboard
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/recommendations"
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    Get Recommendations
                  </p>
                  <p className="text-xs text-slate-500">
                    AI-matched companies for your skills
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/applications"
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    My Applications
                  </p>
                  <p className="text-xs text-slate-500">
                    Track submitted applications
                  </p>
                </div>
              </Link>
            </div>

            {/* Profile Completion */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Profile Completion
                  </p>
                  <p className="text-xs text-slate-500">
                    Complete your profile to improve matches
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {completionPercent}%
                </span>
              </div>
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {completionItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-sm"
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                    )}
                    <span
                      className={
                        item.done ? "text-slate-600" : "text-slate-400"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills & Program */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Skills */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="mb-1 font-semibold text-slate-900">Your Skills</p>
                <p className="mb-4 text-xs text-slate-500">
                  Comma-separated technical skills
                </p>
                <form action={handleSkillsSubmit} className="space-y-4">
                  <div className="relative space-y-2">
                    <Label htmlFor="technical_skills">Technical Skills</Label>
                    <Input
                      id="technical_skills"
                      name="technical_skills"
                      placeholder="React, Python, SQL, Figma"
                      value={skillsInput}
                      onChange={(e) => {
                        setSkillsInput(e.target.value);
                        setSkillHighlightIndex(0);
                      }}
                      onKeyDown={handleSkillsKeyDown}
                      ref={skillsInputRef}
                    />
                    {filteredSkillSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredSkillSuggestions.map((skill, index) => (
                          <button
                            key={skill}
                            type="button"
                            className={`block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 ${index === skillHighlightIndex ? "bg-slate-100" : ""}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setSkillHighlightIndex(index)}
                            onClick={() => applySkillSuggestion(skill)}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_exp">Project Experience</Label>
                    <textarea
                      id="project_exp"
                      name="project_exp"
                      rows={3}
                      placeholder="Describe your relevant project experience..."
                      defaultValue={studentProfile?.project_exp ?? ""}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 resize-none"
                    />
                  </div>
                  {skillMsg && (
                    <p
                      className={`rounded-lg px-3 py-2 text-sm ${skillMsg.includes("!") && !skillMsg.includes("error") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {skillMsg}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Skills
                  </Button>
                </form>
              </div>

              {/* Program */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="mb-1 font-semibold text-slate-900">
                  Program / Course
                </p>
                <p className="mb-4 text-xs text-slate-500">
                  Set your program for eligibility matching
                </p>
                <form action={handleProgramSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="program_id">Program</Label>
                    <select
                      id="program_id"
                      name="program_id"
                      defaultValue={profile?.program_id ?? "BSIS"}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {PROGRAM_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  {programMsg && (
                    <p
                      className={`rounded-lg px-3 py-2 text-sm ${programMsg.includes("!") && !programMsg.includes("error") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {programMsg}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Program
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
