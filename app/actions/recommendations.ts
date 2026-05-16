"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRecommendations } from "@/lib/algorithm";
import type { Company, RecommendationResult } from "@/types";

/**
 * Server Action: compute recommendations for the current student.
 * Runs TF-IDF + hybrid scoring on the server side.
 */
export async function getRecommendations(): Promise<{
  data?: RecommendationResult[];
  studentSkills?: string[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch student profile
  const { data: studentProfile, error: spErr } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (spErr || !studentProfile) {
    return { error: "Please update your skills first." };
  }

  // Fetch user profile for program_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("program_id")
    .eq("id", user.id)
    .single();

  // Fetch all companies
  const { data: companies, error: cErr } = await supabase
    .from("companies")
    .select("*");

  if (cErr || !companies || companies.length === 0) {
    return { error: "No companies available yet." };
  }

  const results = generateRecommendations(
    {
      technical_skills: studentProfile.technical_skills,
      program_id: profile?.program_id ?? null,
    },
    companies as Company[],
  );

  return { data: results, studentSkills: studentProfile.technical_skills };
}
