"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { signOut } from "@/app/actions/auth";
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
  LogOut,
  User,
  Briefcase,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
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

  async function handleGenerateRecommendations() {
    setLoading(true);
    setRecError(null);
    const result = await getRecommendations();
    if (result.error) {
      setRecError(result.error);
    } else {
      setRecommendations(result.data ?? []);
    }
    setLoading(false);
  }

  async function handleSkillsSubmit(formData: FormData) {
    const res = await updateStudentSkills(formData);
    setSkillMsg(res?.error ?? "Skills updated!");
  }

  async function handleProgramSubmit(formData: FormData) {
    const res = await updateStudentProgram(formData);
    setProgramMsg(res?.error ?? "Program updated!");
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

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3 pb-4">
            <div className="rounded-lg border border-slate-200 bg-white p-2 text-blue-600 shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                Student Dashboard
              </h1>
              <p className="text-xs text-slate-500">OJT Recommender</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {(profile?.full_name ||
                profile?.email ||
                "U")?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {profile?.full_name || profile?.email || "User"}
              </p>
              <p className="truncate text-xs text-slate-500">Student</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 shadow-sm"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/account"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            Account Settings
          </Link>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <form action={signOut} className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              type="submit"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Student Dashboard
            </h2>
          </div>
        </header>

        <main className="space-y-6 p-6 md:p-8">
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
