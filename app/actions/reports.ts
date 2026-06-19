"use server";

import { createClient } from "@/lib/supabase/server";
import type { ProgramId } from "@/types";

export interface SkillCount {
  skill: string;
  count: number;
}

export interface CompanyPlacementCount {
  company: string;
  count: number;
}

export interface ReportData {
  meta: {
    startDate: string;
    endDate: string;
    program: ProgramId | "ALL";
    generatedAt: string;
  };
  studentOverview: {
    enrolled: number;
  };
  companyPlacement: {
    companiesParticipated: number;
    perCompany: CompanyPlacementCount[];
  };
  applications: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
  skills: {
    topStudentSkills: SkillCount[];
    topCompanySkills: SkillCount[];
  };
}

export type ReportResult = { data: ReportData } | { error: string };

const PROGRAMS: ProgramId[] = ["BSIS", "BSIT", "BSCS", "BSCA"];

function rankSkills(lists: string[][], limit = 15): SkillCount[] {
  // Group case-insensitively, keeping the first-seen display form.
  const counts = new Map<string, { display: string; count: number }>();
  for (const list of lists) {
    for (const raw of list ?? []) {
      const skill = raw.trim();
      if (!skill) continue;
      const key = skill.toLowerCase();
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { display: skill, count: 1 });
    }
  }
  return [...counts.values()]
    .map(({ display, count }) => ({ skill: display, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}

/**
 * Generates an OJT report scoped by date range and program.
 *
 * Coordinators are always scoped to their own assigned program (the `program`
 * argument is ignored for them and enforced again by RLS). Superadmins may pass
 * a specific program or "ALL".
 *
 * Date range applies to time-bound events: OJT enrollment (placement created),
 * and application submissions. Company skill demand reflects all program-eligible
 * companies (standing demand, not date-bound).
 */
export async function generateReport(input: {
  startDate: string;
  endDate: string;
  program?: ProgramId | "ALL";
}): Promise<ReportResult> {
  const { startDate, endDate } = input;
  if (!startDate || !endDate) {
    return { error: "Please choose a start and end date." };
  }
  if (new Date(startDate) > new Date(endDate)) {
    return { error: "Start date must be on or before the end date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const { data: actor } = await supabase
    .from("profiles")
    .select("role, program_id")
    .eq("id", user.id)
    .single();

  if (actor?.role !== "coordinator" && actor?.role !== "superadmin") {
    return { error: "Not authorized to view reports." };
  }

  // Coordinators are locked to their own program; superadmins pick.
  let program: ProgramId | "ALL";
  if (actor.role === "coordinator") {
    program = (actor.program_id as ProgramId | null) ?? "ALL";
  } else {
    const requested = input.program ?? "ALL";
    program =
      requested !== "ALL" && PROGRAMS.includes(requested as ProgramId)
        ? (requested as ProgramId)
        : "ALL";
  }

  const startISO = new Date(`${startDate}T00:00:00`).toISOString();
  const endISO = new Date(`${endDate}T23:59:59.999`).toISOString();

  // ── Students in scope ──────────────────────────────────────────
  let studentsQuery = supabase
    .from("profiles")
    .select("id")
    .eq("role", "student");
  if (program !== "ALL") studentsQuery = studentsQuery.eq("program_id", program);
  const { data: studentsData, error: studentsError } = await studentsQuery;
  if (studentsError) return { error: studentsError.message };

  const studentIds = (studentsData ?? []).map((s) => s.id);

  const empty: ReportData = {
    meta: {
      startDate,
      endDate,
      program,
      generatedAt: new Date().toISOString(),
    },
    studentOverview: { enrolled: 0 },
    companyPlacement: { companiesParticipated: 0, perCompany: [] },
    applications: { total: 0, accepted: 0, rejected: 0, pending: 0 },
    skills: { topStudentSkills: [], topCompanySkills: [] },
  };

  // Company skill demand is independent of the student cohort.
  let companiesQuery = supabase.from("companies").select("required_skills");
  if (program !== "ALL") {
    companiesQuery = companiesQuery.contains("eligibility_programs", [program]);
  }

  if (studentIds.length === 0) {
    const { data: companiesOnly } = await companiesQuery;
    empty.skills.topCompanySkills = rankSkills(
      (companiesOnly ?? []).map((c) => c.required_skills ?? []),
    );
    return { data: empty };
  }

  // ── Cohort placements, applications, company demand (parallel) ──
  const [placementsRes, applicationsRes, companiesRes] = await Promise.all([
    supabase
      .from("ojt_placements")
      .select("user_id, company:companies(name)")
      .in("user_id", studentIds)
      .gte("created_at", startISO)
      .lte("created_at", endISO),
    supabase
      .from("company_applications")
      .select("status")
      .in("user_id", studentIds)
      .gte("created_at", startISO)
      .lte("created_at", endISO),
    companiesQuery,
  ]);

  if (placementsRes.error) return { error: placementsRes.error.message };
  if (applicationsRes.error) return { error: applicationsRes.error.message };

  const placements = (placementsRes.data ?? []) as Array<{
    user_id: string;
    company: { name: string }[] | { name: string } | null;
  }>;

  // ── Student Overview ───────────────────────────────────────────
  const enrolled = placements.length;

  // ── Company Placement Summary ──────────────────────────────────
  const perCompanyMap = new Map<string, number>();
  for (const p of placements) {
    const company = Array.isArray(p.company) ? p.company[0] : p.company;
    const name = company?.name ?? "Unknown company";
    perCompanyMap.set(name, (perCompanyMap.get(name) ?? 0) + 1);
  }
  const perCompany = [...perCompanyMap.entries()]
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company));

  // ── Application Summary ────────────────────────────────────────
  const apps = applicationsRes.data ?? [];
  const accepted = apps.filter((a) => a.status === "accepted").length;
  const rejected = apps.filter((a) => a.status === "rejected").length;
  const pending = apps.filter(
    (a) => a.status === "submitted" || a.status === "under_review",
  ).length;

  // ── Skills Summary ─────────────────────────────────────────────
  const cohortUserIds = [...new Set(placements.map((p) => p.user_id))];
  let topStudentSkills: SkillCount[] = [];
  if (cohortUserIds.length > 0) {
    const { data: studentProfiles } = await supabase
      .from("student_profiles")
      .select("technical_skills")
      .in("user_id", cohortUserIds);
    topStudentSkills = rankSkills(
      (studentProfiles ?? []).map((sp) => sp.technical_skills ?? []),
    );
  }
  const topCompanySkills = rankSkills(
    (companiesRes.data ?? []).map((c) => c.required_skills ?? []),
  );

  return {
    data: {
      meta: {
        startDate,
        endDate,
        program,
        generatedAt: new Date().toISOString(),
      },
      studentOverview: { enrolled },
      companyPlacement: {
        companiesParticipated: perCompany.length,
        perCompany,
      },
      applications: { total: apps.length, accepted, rejected, pending },
      skills: { topStudentSkills, topCompanySkills },
    },
  };
}
