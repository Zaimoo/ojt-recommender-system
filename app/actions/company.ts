"use server";

import { revalidatePath } from "next/cache";
import { PROGRAM_OPTIONS, type ProgramOption } from "@/lib/constants/programs";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/app/actions/audit";

type CompanyPayload = {
  name: string;
  company_overview: string;
  hr_name: string | null;
  logo_url: string | null;
  email_address: string | null;
  location_address: string | null;
  website_url: string | null;
  contact_number: string | null;
  created_by?: string | null;
  required_skills: string[];
  eligibility_programs: ProgramOption[];
};

type ParseCompanyPayloadResult =
  | { ok: true; payload: CompanyPayload }
  | { ok: false; error: string };

export type CompanyActionResult = { success: true } | { error: string };

function optionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseSkills(value: string): string[] {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadCompanyImage(
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  const supabase = await createClient();
  const safeName = sanitizeFileName(file.name);
  const path = `company-logos/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("company-assets")
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (uploadError) {
    return { error: `Image upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("company-assets").getPublicUrl(path);

  return { publicUrl };
}

function parseCompanyPayload(formData: FormData): ParseCompanyPayloadResult {
  const name = (formData.get("name") as string)?.trim();
  const companyOverview =
    (formData.get("company_overview") as string)?.trim() ?? "";
  const requiredSkillsRaw = (formData.get("required_skills") as string) ?? "";
  const selectedPrograms = formData
    .getAll("eligibility_programs")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toUpperCase() as ProgramOption)
    .filter((value) => PROGRAM_OPTIONS.includes(value));
  const existingLogoUrl = optionalText(formData.get("existing_logo_url"));

  if (!name) return { ok: false, error: "Company name is required." };
  if (selectedPrograms.length === 0) {
    return { ok: false, error: "Please select at least one eligible program." };
  }

  return {
    ok: true,
    payload: {
      name,
      company_overview: companyOverview,
      hr_name: optionalText(formData.get("hr_name")),
      logo_url: existingLogoUrl,
      email_address: optionalText(formData.get("email_address")),
      location_address: optionalText(formData.get("location_address")),
      website_url: optionalText(formData.get("website_url")),
      contact_number: optionalText(formData.get("contact_number")),
      required_skills: parseSkills(requiredSkillsRaw),
      eligibility_programs: selectedPrograms,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Company CRUD (coordinator only)
// ─────────────────────────────────────────────────────────────

export async function createCompany(
  formData: FormData,
): Promise<CompanyActionResult> {
  const supabase = await createClient();
  const parsed = parseCompanyPayload(formData);

  if (!parsed.ok) return { error: parsed.error };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const image = formData.get("company_image");
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadCompanyImage(image);
    if ("error" in uploaded) return uploaded;
    parsed.payload.logo_url = uploaded.publicUrl;
  }

  const { data: createdCompany, error } = await supabase
    .from("companies")
    .insert({ ...parsed.payload, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (createdCompany?.id) {
    await logAudit({
      actorId: user.id,
      action: "company.create",
      entityType: "company",
      entityId: createdCompany.id,
    });
  }

  revalidatePath("/coordinator");
  revalidatePath("/dashboard");
  revalidatePath("/superadmin");
  return { success: true };
}

export async function updateCompany(
  formData: FormData,
): Promise<CompanyActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const id = (formData.get("id") as string)?.trim();
  if (!id) return { error: "Missing company id." };

  const parsed = parseCompanyPayload(formData);
  if (!parsed.ok) return { error: parsed.error };

  const image = formData.get("company_image");
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadCompanyImage(image);
    if ("error" in uploaded) return uploaded;
    parsed.payload.logo_url = uploaded.publicUrl;
  }

  const { error } = await supabase
    .from("companies")
    .update(parsed.payload)
    .eq("id", id);

  if (error) return { error: error.message };

  if (user) {
    await logAudit({
      actorId: user.id,
      action: "company.update",
      entityType: "company",
      entityId: id,
    });
  }

  revalidatePath("/coordinator");
  revalidatePath("/dashboard");
  revalidatePath("/superadmin");
  revalidatePath(`/companyDetails/${id}`);
  return { success: true };
}

export async function deleteCompany(
  formData: FormData,
): Promise<CompanyActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const id = (formData.get("id") as string)?.trim();
  if (!id) return { error: "Missing company id." };

  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return { error: error.message };

  if (user) {
    await logAudit({
      actorId: user.id,
      action: "company.delete",
      entityType: "company",
      entityId: id,
    });
  }

  revalidatePath("/coordinator");
  revalidatePath("/dashboard");
  revalidatePath("/superadmin");
  revalidatePath(`/companyDetails/${id}`);
  return { success: true };
}
