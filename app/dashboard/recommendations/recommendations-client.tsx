"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getRecommendations } from "@/app/actions/recommendations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";
import type { RecommendationResult } from "@/types";

export function RecommendationsClient() {
  const [recommendations, setRecommendations] = useState<
    RecommendationResult[]
  >([]);
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  async function handleGenerateRecommendations() {
    setLoading(true);
    setRecError(null);
    const result = await getRecommendations();
    if (result.error) {
      setRecError(result.error);
    } else {
      setRecommendations(result.data ?? []);
      setStudentSkills(result.studentSkills ?? []);
    }
    setLoading(false);
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
    <div className="mx-auto max-w-5xl space-y-6">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Company Recommendations (Top 10)
            </CardTitle>
            <CardDescription>
              AI-powered matches based on your skills and program
            </CardDescription>
            <p className="mt-1 text-xs text-blue-600">
              Tip: Recommendation cards are clickable. Open one for full company
              details.
            </p>
          </div>
          <Button onClick={handleGenerateRecommendations} disabled={loading}>
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
                      {rec.company.required_skills.slice(0, 4).map((skill) => {
                        const matched = studentSkills.includes(skill);
                        return (
                          <Badge
                            key={skill}
                            variant={matched ? "secondary" : "secondary"}
                            className={
                              matched
                                ? "text-xs bg-emerald-100 text-emerald-800 border-transparent"
                                : "text-xs"
                            }
                          >
                            {skill}
                          </Badge>
                        );
                      })}
                      {rec.company.required_skills.length > 4 && (
                        <span className="text-xs text-slate-500">
                          +{rec.company.required_skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <Badge variant={scoreBadgeVariant(rec.hybridScore)}>
                      {rec.hybridScore}% match
                    </Badge>
                    <span className="text-xs text-blue-600">View details</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
