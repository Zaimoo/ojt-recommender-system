"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  updateStudentSkills,
  updateStudentProgram,
} from "@/app/actions/student";
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
import { StudentSidebar } from "./_components/student-sidebar";
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
  const [lastSkillsUpdate, setLastSkillsUpdate] = useState<string | null>(null);
  const [lastProgramUpdate, setLastProgramUpdate] = useState<string | null>(
    null,
  );
  const [skillsInput, setSkillsInput] = useState(
    studentProfile?.technical_skills?.join(", ") ?? "",
  );
  const skillsInputRef = useRef<HTMLInputElement | null>(null);
  const [skillHighlightIndex, setSkillHighlightIndex] = useState(0);

  async function handleSkillsSubmit(formData: FormData) {
    const res = await updateStudentSkills(formData);
    setSkillMsg(res?.error ?? "Skills updated!");
    if (!res?.error) setLastSkillsUpdate(new Date().toISOString());
  }

  async function handleProgramSubmit(formData: FormData) {
    const res = await updateStudentProgram(formData);
    setProgramMsg(res?.error ?? "Program updated!");
    if (!res?.error) setLastProgramUpdate(new Date().toISOString());
  }

  function formatTimestamp(value: string | null) {
    if (!value) return "Not yet";
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getActiveSkillToken(value: string) {
    const lastCommaIndex = value.lastIndexOf(",");
    const token = lastCommaIndex >= 0 ? value.slice(lastCommaIndex + 1) : value;
    return token.trim();
  }

  function applySkillSuggestion(suggestion: string) {
    const lastCommaIndex = skillsInput.lastIndexOf(",");
    let prefix = "";
    if (lastCommaIndex >= 0) {
      prefix = skillsInput.slice(0, lastCommaIndex + 1).trimEnd();
      prefix = prefix ? `${prefix} ` : "";
    }
    const nextValue = `${prefix}${suggestion}, `;
    setSkillsInput(nextValue);
    setSkillHighlightIndex(0);
    requestAnimationFrame(() => skillsInputRef.current?.focus());
  }

  const activeSkillToken = getActiveSkillToken(skillsInput);
  const selectedSkills = skillsInput
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
      setSkillHighlightIndex(0);
      return;
    }
    setSkillHighlightIndex(0);
  }, [activeSkillToken, filteredSkillSuggestions.length]);

  function handleSkillsKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (filteredSkillSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSkillHighlightIndex((prev) =>
        prev + 1 >= filteredSkillSuggestions.length ? 0 : prev + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSkillHighlightIndex((prev) =>
        prev - 1 < 0 ? filteredSkillSuggestions.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = filteredSkillSuggestions[skillHighlightIndex];
      if (selected) applySkillSuggestion(selected);
    }

    if (event.key === "Escape") {
      setSkillHighlightIndex(0);
    }
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

  const completedCount = completionItems.filter((item) => item.done).length;
  const completionPercent = Math.round(
    (completedCount / completionItems.length) * 100,
  );
  const missingItems = completionItems
    .filter((item) => !item.done)
    .map((item) => item.label);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar profile={profile} active="dashboard" />

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Student Dashboard
            </h2>
          </div>
        </header>

        <main className="space-y-6 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Completion</CardTitle>
                <CardDescription>
                  Complete your profile to improve recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Progress</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {completionPercent}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                {missingItems.length === 0 ? (
                  <p className="text-sm text-emerald-600">
                    Your profile is complete.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Missing:</p>
                    <div className="flex flex-wrap gap-2">
                      {missingItems.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Latest changes in your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Skills updated</span>
                  <span className="font-medium text-slate-900">
                    {formatTimestamp(lastSkillsUpdate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Program updated</span>
                  <span className="font-medium text-slate-900">
                    {formatTimestamp(lastProgramUpdate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="skills" className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Skills</CardTitle>
                <CardDescription>
                  Enter your technical skills (comma-separated)
                </CardDescription>
              </CardHeader>
              <form action={handleSkillsSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="technical_skills">Technical Skills</Label>
                    <Input
                      id="technical_skills"
                      name="technical_skills"
                      placeholder="React, Python, SQL, Figma"
                      value={skillsInput}
                      onChange={(event) => {
                        setSkillsInput(event.target.value);
                        setSkillHighlightIndex(0);
                      }}
                      onKeyDown={handleSkillsKeyDown}
                      ref={skillsInputRef}
                    />
                    {filteredSkillSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-sm">
                        {filteredSkillSuggestions.map((skill, index) => (
                          <button
                            key={skill}
                            type="button"
                            className={`block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 ${
                              index === skillHighlightIndex
                                ? "bg-slate-100"
                                : ""
                            }`}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setSkillHighlightIndex(index)}
                            onClick={() => applySkillSuggestion(skill)}
                            aria-selected={index === skillHighlightIndex}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_exp">Project Experience</Label>
                    <Textarea
                      id="project_exp"
                      name="project_exp"
                      placeholder="Describe your relevant project experience..."
                      defaultValue={studentProfile?.project_exp ?? ""}
                    />
                  </div>
                  {skillMsg && (
                    <p className="text-sm text-green-600">{skillMsg}</p>
                  )}
                  <Button type="submit" size="sm">
                    Save Skills
                  </Button>
                </CardContent>
              </form>
            </Card>

            <Card id="program">
              <CardHeader>
                <CardTitle className="text-lg">Program / Course</CardTitle>
                <CardDescription>
                  Set your program for eligibility matching
                </CardDescription>
              </CardHeader>
              <form action={handleProgramSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="program_id">Program ID</Label>
                    <select
                      id="program_id"
                      name="program_id"
                      defaultValue={profile?.program_id ?? "BSIS"}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {PROGRAM_OPTIONS.map((program) => (
                        <option key={program} value={program}>
                          {program}
                        </option>
                      ))}
                    </select>
                  </div>
                  {programMsg && (
                    <p className="text-sm text-green-600">{programMsg}</p>
                  )}
                  <Button type="submit" size="sm">
                    Save Program
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
              <CardDescription>
                Generate your matches on a dedicated page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/dashboard/recommendations"
                className="text-sm font-medium text-blue-600 underline"
              >
                Open recommendations
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
