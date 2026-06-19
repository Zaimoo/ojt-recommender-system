"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidContactNumber, isValidStudentId } from "@/lib/validation";

export type AccountActionResult = { success: true } | { error: string };

export async function updateAccount(
  formData: FormData,
): Promise<AccountActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single();

  const fullName = (formData.get("full_name") as string)?.trim();
  const contactNumber = (formData.get("contact_number") as string)?.trim();
  const studentId = (formData.get("student_id") as string)?.trim();
  const newEmail = (formData.get("email") as string)?.trim();
  const newPassword = (formData.get("new_password") as string) ?? "";
  const resume = formData.get("resume");

  if (contactNumber && !isValidContactNumber(contactNumber)) {
    return {
      error: "Invalid contact number. Use +63 966 368 5824 or 09663685824.",
    };
  }

  if (studentId && !isValidStudentId(studentId)) {
    return {
      error: "Invalid Student ID. Format: 2022-1894 (YYYY-0000).",
    };
  }

  if (newPassword.trim().length > 0 && newPassword.trim().length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (newEmail && newEmail !== profile?.email) {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) return { error: error.message };
  }

  if (newPassword.trim().length > 0) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.trim(),
    });
    if (error) return { error: error.message };
  }

  const updates: Record<string, string | null> = {};

  if (typeof fullName === "string") updates.full_name = fullName;
  if (typeof contactNumber === "string") updates.contact_number = contactNumber;
  if (typeof studentId === "string") updates.student_id = studentId;
  if (newEmail) updates.email = newEmail;

  if (resume instanceof File && resume.size > 0) {
    const safeName = resume.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/resume-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("candidate-resumes")
      .upload(storagePath, resume, {
        upsert: true,
        contentType: resume.type || "application/octet-stream",
      });

    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from("candidate-resumes").getPublicUrl(storagePath);

    updates.resume_path = storagePath;
    updates.resume_url = publicUrl;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/account");
  revalidatePath("/coordinator");
  revalidatePath("/coordinator/account");

  return { success: true };
}
