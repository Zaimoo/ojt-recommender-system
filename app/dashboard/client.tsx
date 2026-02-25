"use client";

import { useState } from "react";
import { signOut } from "@/app/actions/auth";
import {
  updateStudentSkills,
  updateStudentProgram,
} from "@/app/actions/student";
import { getRecommendations } from "@/app/actions/recommendations";
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              OJT Recommender
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
        <h2 className="text-2xl font-bold">Student Dashboard</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Skills Form ──────────────────────────── */}
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
                    placeholder="Describe your relevant project experience…"
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

          {/* ── Program Form ─────────────────────────── */}
          <Card>
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
                  <Input
                    id="program_id"
                    name="program_id"
                    placeholder="BSIT, BSCS, BSIS, …"
                    defaultValue={profile?.program_id ?? ""}
                  />
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

        {/* ── Recommendations ─────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Company Recommendations</CardTitle>
              <CardDescription>
                AI-powered matches based on your skills &amp; program
              </CardDescription>
            </div>
            <Button onClick={handleGenerateRecommendations} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Generating…" : "Generate Recommendations"}
            </Button>
          </CardHeader>
          <CardContent>
            {recError && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {recError}
              </div>
            )}

            {recommendations.length === 0 && !recError && (
              <p className="text-sm text-slate-500">
                Click &quot;Generate Recommendations&quot; to see your matches.
              </p>
            )}

            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.company.id}
                  className="flex items-start justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">
                        #{idx + 1}
                      </span>
                      <h4 className="font-semibold">{rec.company.name}</h4>
                      {rec.programMatch && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" /> Program Match
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {rec.company.description}
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
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={scoreBadgeVariant(rec.hybridScore)}>
                      {rec.hybridScore}% match
                    </Badge>
                    <span className="text-xs text-slate-400">
                      Skill: {rec.similarityScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
