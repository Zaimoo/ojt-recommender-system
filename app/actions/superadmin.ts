"use server";

import { createClient } from "@/lib/supabase/server";
import { createSuperadminClient } from "@/lib/supabase/superadmin";
import { logAudit } from "@/app/actions/audit";

export type SuperadminActionResult =
  | { success: true; userId: string }
  | { error: string };

export type SuperadminUpdateResult = { success: true } | { error: string };

export async function createCoordinatorAccount(
  formData: FormData,
): Promise<SuperadminActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return { error: "Only superadmins can create coordinator accounts." };
  }

  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) ?? "";
  const fullName = (formData.get("full_name") as string)?.trim() ?? "";
  const contactNumber =
    (formData.get("contact_number") as string)?.trim() ?? "";
  const programId = (formData.get("program_id") as string)?.trim() ?? "";

  if (!email) return { error: "Email is required." };
  if (!password.trim()) return { error: "Password is required." };
  if (!programId) return { error: "Program is required." };

  const admin = createSuperadminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "coordinator",
      contact_number: contactNumber,
      program_id: programId,
    },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Failed to create coordinator account." };
  }

  await logAudit({
    actorId: user.id,
    action: "coordinator.create",
    entityType: "profile",
    entityId: data.user.id,
    details: { email },
  });

  return { success: true, userId: data.user.id };
}

export async function updateCoordinatorAccount(
  formData: FormData,
): Promise<SuperadminUpdateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return { error: "Only superadmins can update coordinator accounts." };
  }

  const coordinatorId = (formData.get("id") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) ?? "";
  const fullName = (formData.get("full_name") as string)?.trim() ?? "";
  const contactNumber =
    (formData.get("contact_number") as string)?.trim() ?? "";
  const programId = (formData.get("program_id") as string)?.trim() ?? "";

  if (!coordinatorId) return { error: "Missing coordinator id." };
  if (!email) return { error: "Email is required." };
  if (!programId) return { error: "Program is required." };

  const admin = createSuperadminClient();
  const authUpdates: {
    email?: string;
    password?: string;
    user_metadata?: Record<string, string>;
  } = {
    email,
    user_metadata: {
      full_name: fullName,
      role: "coordinator",
      contact_number: contactNumber,
      program_id: programId,
    },
  };

  if (password.trim().length > 0) {
    authUpdates.password = password.trim();
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    coordinatorId,
    authUpdates,
  );

  if (updateError) {
    return { error: updateError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      email,
      full_name: fullName,
      contact_number: contactNumber,
      program_id: programId,
    })
    .eq("id", coordinatorId);

  if (profileError) {
    return { error: profileError.message };
  }

  await logAudit({
    actorId: user.id,
    action: "coordinator.update",
    entityType: "profile",
    entityId: coordinatorId,
    details: { email },
  });

  return { success: true };
}

export async function deleteCoordinatorAccount(
  formData: FormData,
): Promise<SuperadminUpdateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return { error: "Only superadmins can delete coordinator accounts." };
  }

  const coordinatorId = (formData.get("id") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!coordinatorId) return { error: "Missing coordinator id." };

  const admin = createSuperadminClient();
  const { error } = await admin.auth.admin.deleteUser(coordinatorId);

  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "coordinator.delete",
    entityType: "profile",
    entityId: coordinatorId,
    details: { email },
  });

  return { success: true };
}
