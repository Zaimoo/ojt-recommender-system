"use server";

import { revalidatePath } from "next/cache";
import { PROGRAM_OPTIONS, type ProgramOption } from "@/lib/constants/programs";
import { createClient } from "@/lib/supabase/server";

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
  const assignedProgram = (formData.get("assigned_program") as string)?.trim();
  const newEmail = (formData.get("email") as string)?.trim();
  const newPassword = (formData.get("new_password") as string) ?? "";

  if (assignedProgram) {
    const programId = assignedProgram.toUpperCase() as ProgramOption;
    if (!PROGRAM_OPTIONS.includes(programId)) {
      return { error: "Please select a valid program." };
    }
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
  if (assignedProgram) updates.program_id = assignedProgram.toUpperCase();

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
