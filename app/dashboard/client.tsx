"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  updateStudentSkills,
  updateStudentProgram,
} from "@/app/actions/student";
import { getRecommendations } from "@/app/actions/recommendations";
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
  Sparkles,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { StudentSidebar } from "./_components/student-sidebar";
import type { Profile, StudentProfile, RecommendationResult } from "@/types";

interface Props {
  profile: Profile | null;
  studentProfile: StudentProfile | null;
}

export function StudentDashboardClient({ profile, studentProfile }: Props) {
  const [recommendations, setRecommendations] = useState<
    RecommendationResult[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [skillMsg, setSkillMsg] = useState<string | null>(null);
  const [programMsg, setProgramMsg] = useState<string | null>(null);
  const [lastSkillsUpdate, setLastSkillsUpdate] = useState<string | null>(null);
  const [lastProgramUpdate, setLastProgramUpdate] = useState<string | null>(
    null,
  );
  const [lastRecRun, setLastRecRun] = useState<string | null>(null);

  async function handleGenerateRecommendations() {
    setLoading(true);
    setRecError(null);
    const result = await getRecommendations();
    if (result.error) {
      setRecError(result.error);
    } else {
      setRecommendations(result.data ?? []);
      setLastRecRun(new Date().toISOString());
    }
    setLoading(false);
  }

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

  function scoreBadgeVariant(score: number) {
    if (score >= 70) return "success";
    if (score >= 40) return "warning";
    return "destructive";
  }

  function truncateText(text: string, maxLength = 110) {
    if (!text) return "No description provided.";
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
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

  const insights = useMemo(() => {
    if (recommendations.length === 0) return null;

    const highestMatch = recommendations[0]?.hybridScore ?? 0;
    const averageMatch = Math.round(
      recommendations.reduce((sum, rec) => sum + rec.hybridScore, 0) /
        recommendations.length,
    );
    const programMatched = recommendations.filter((r) => r.programMatch).length;

    return {
      highestMatch,
      averageMatch,
      programMatched,
    };
  }, [recommendations]);

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
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Recommendations run</span>
                  <span className="font-medium text-slate-900">
                    {formatTimestamp(lastRecRun)}
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
                  <div className="space-y-2">
                    <Label htmlFor="technical_skills">Technical Skills</Label>
                    <Input
                      id="technical_skills"
                      name="technical_skills"
                      placeholder="React, Python, SQL, Figma"
                      defaultValue={
                        studentProfile?.technical_skills?.join(", ") ?? ""
                      }
                    />
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

          {insights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-4 w-4 text-blue-600" /> Recommendation
                  Visualization
                </CardTitle>
                <CardDescription>
                  Quick score summary for your top 10 recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Highest Match
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {insights.highestMatch}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Average Match
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {insights.averageMatch}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Program Matches
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {insights.programMatched}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={`viz-${rec.company.id}`}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{rec.company.name}</span>
                        <span>{rec.hybridScore}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${rec.hybridScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card id="recommendations">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Company Recommendations (Top 10)
                </CardTitle>
                <CardDescription>
                  AI-powered matches based on your skills and program
                </CardDescription>
                <p className="mt-1 text-xs text-blue-600">
                  Tip: Recommendation cards are clickable. Open one for full
                  company details.
                </p>
              </div>
              <Button
                onClick={handleGenerateRecommendations}
                disabled={loading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? "Generating..." : "Generate Recommendations"}
              </Button>
            </CardHeader>
            <CardContent>
              {recError && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {recError}
                </div>
              )}

              {recommendations.length === 0 && !recError && (
                <p className="text-sm text-slate-500">
                  Click "Generate Recommendations" to see your matches.
                </p>
              )}

              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <Link
                    key={rec.company.id}
                    href={`/companyDetails/${rec.company.id}`}
                    className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                            #{idx + 1}
                          </span>
                          <p className="text-base font-semibold text-slate-900 group-hover:text-blue-600">
                            {rec.company.name}
                          </p>
                          {rec.programMatch && (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="h-3 w-3" /> Program Match
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {truncateText(rec.company.company_overview)}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rec.company.required_skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-blue-600">
                          View details <ArrowUpRight className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex min-w-24 flex-col items-end gap-1">
                        <Badge variant={scoreBadgeVariant(rec.hybridScore)}>
                          {rec.hybridScore}% match
                        </Badge>
                        <span className="text-xs text-slate-400">
                          Skill: {rec.similarityScore}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
