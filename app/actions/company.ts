"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Company CRUD (coordinator only)
// ─────────────────────────────────────────────────────────────

export async function createCompany(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const skillsRaw = formData.get("required_skills") as string;
  const programsRaw = formData.get("eligibility_programs") as string;

  const required_skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const eligibility_programs = programsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("companies")
    .insert({ name, description, required_skills, eligibility_programs });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updateCompany(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const skillsRaw = formData.get("required_skills") as string;
  const programsRaw = formData.get("eligibility_programs") as string;

  const required_skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const eligibility_programs = programsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("companies")
    .update({ name, description, required_skills, eligibility_programs })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteCompany(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;

  const { error } = await supabase.from("companies").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
