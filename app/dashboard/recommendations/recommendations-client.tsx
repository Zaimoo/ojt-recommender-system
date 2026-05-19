"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getRecommendations } from "@/app/actions/recommendations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, AlertCircle, BarChart3, TrendingUp } from "lucide-react";
import type { RecommendationResult } from "@/types";

export function RecommendationsClient() {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
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
      recommendations.reduce((sum, rec) => sum + rec.hybridScore, 0) / recommendations.length,
    );
    const programMatched = recommendations.filter((r) => r.programMatch).length;
    return { highestMatch, averageMatch, programMatched };
  }, [recommendations]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Generate button row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {recommendations.length > 0
              ? `Showing ${recommendations.length} matched companies`
              : "Click the button to generate AI-powered matches"}
          </p>
        </div>
        <Button
          onClick={handleGenerateRecommendations}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Generating…" : "Generate Recommendations"}
        </Button>
      </div>

      {recError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {recError}
        </div>
      )}

      {/* Insights stat row */}
      {insights && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Highest Match", value: `${insights.highestMatch}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Average Match", value: `${insights.averageMatch}%`, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Program Matches", value: String(insights.programMatched), icon: CheckCircle, color: "text-violet-600", bg: "bg-violet-50" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score bars */}
      {insights && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 font-semibold text-slate-900">Match Score Overview</p>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={`viz-${rec.company.id}`}>
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{rec.company.name}</span>
                  <span className="font-semibold text-slate-900">{rec.hybridScore}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${rec.hybridScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company cards */}
      {recommendations.length === 0 && !recError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">No recommendations yet</p>
          <p className="mt-1 text-sm text-slate-400">Click "Generate Recommendations" to find matches</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <p className="font-semibold text-slate-900">Top Matches</p>
          {recommendations.map((rec, idx) => (
            <Link
              key={rec.company.id}
              href={`/companyDetails/${rec.company.id}`}
              className="group flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    #{idx + 1}
                  </span>
                  <p className="font-semibold text-slate-900 group-hover:text-blue-600">
                    {rec.company.name}
                  </p>
                  {rec.programMatch && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Program Match
                    </Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  {truncateText(rec.company.company_overview)}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {rec.company.required_skills.slice(0, 4).map((skill) => {
                    const matched = studentSkills.includes(skill);
                    return (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className={matched ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                      >
                        {skill}
                      </Badge>
                    );
                  })}
                  {rec.company.required_skills.length > 4 && (
                    <span className="text-xs text-slate-400">+{rec.company.required_skills.length - 4} more</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge variant={scoreBadgeVariant(rec.hybridScore)} className="text-sm">
                  {rec.hybridScore}%
                </Badge>
                <span className="text-xs text-blue-500 group-hover:underline">View details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
