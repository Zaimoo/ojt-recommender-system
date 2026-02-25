"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Student profile actions
// ─────────────────────────────────────────────────────────────

export async function updateStudentSkills(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const skillsRaw = formData.get("technical_skills") as string;
  const projectExp = formData.get("project_exp") as string;
  const technical_skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Upsert: insert if not exists, update if exists
  const { data: existing } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("student_profiles")
      .update({ technical_skills, project_exp: projectExp })
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("student_profiles")
      .insert({ user_id: user.id, technical_skills, project_exp: projectExp });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateStudentProgram(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const program_id = formData.get("program_id") as string;

  const { error } = await supabase
    .from("profiles")
    .update({ program_id })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
