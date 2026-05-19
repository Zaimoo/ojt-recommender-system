"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type VerificationActionResult = { success: true } | { error: string };

async function ensureVerifiedCoordinator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, coordinator_status")
    .eq("id", user.id)
    .single();

  if (
    profile?.role !== "coordinator" ||
    profile?.coordinator_status !== "approved"
  ) {
    return { error: "Not authorized" } as const;
  }

  return { supabase, userId: user.id } as const;
}

export async function approveCoordinator(
  formData: FormData,
): Promise<VerificationActionResult> {
  const userId = (formData.get("user_id") as string)?.trim();
  if (!userId) return { error: "Missing user id." };

  const auth = await ensureVerifiedCoordinator();
  if ("error" in auth) return auth;

  const { error } = await auth.supabase
    .from("profiles")
    .update({
      coordinator_status: "approved",
      coordinator_reviewed_at: new Date().toISOString(),
      coordinator_reviewed_by: auth.userId,
      coordinator_denied_reason: null,
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/coordinator");
  return { success: true };
}

export async function denyCoordinator(
  formData: FormData,
): Promise<VerificationActionResult> {
  const userId = (formData.get("user_id") as string)?.trim();
  const reason = (formData.get("deny_reason") as string)?.trim();

  if (!userId) return { error: "Missing user id." };
  if (!reason) return { error: "Please provide a reason for denial." };

  const auth = await ensureVerifiedCoordinator();
  if ("error" in auth) return auth;

  const { error } = await auth.supabase
    .from("profiles")
    .update({
      coordinator_status: "denied",
      coordinator_reviewed_at: new Date().toISOString(),
      coordinator_reviewed_by: auth.userId,
      coordinator_denied_reason: reason,
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/coordinator");
  return { success: true };
}
