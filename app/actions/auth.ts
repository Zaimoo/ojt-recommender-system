"use server";

import { createClient } from "@/lib/supabase/server";
import { PROGRAM_OPTIONS, type ProgramOption } from "@/lib/constants/programs";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// Auth actions
// ─────────────────────────────────────────────────────────────

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const contactNumber = (formData.get("contact_number") as string) ?? "";
  const studentId = (formData.get("student_id") as string) ?? "";
  const assignedProgram = (formData.get("assigned_program") as string) ?? "";
  const requestedRole = (formData.get("role") as string) || "student";
  const role = requestedRole === "coordinator" ? "coordinator" : "student";

  const programId = assignedProgram.trim().toUpperCase() as ProgramOption;

  if (role === "student" && !studentId.trim()) {
    return { error: "Student ID number is required." };
  }

  if (role === "coordinator" && !PROGRAM_OPTIONS.includes(programId)) {
    return { error: "Please select an assigned program." };
  }

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          contact_number: contactNumber.trim(),
          student_id: studentId.trim(),
          program_id: role === "coordinator" ? programId : null,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {
      redirectTo: role === "coordinator" ? "/coordinator" : "/dashboard",
    };
  } catch (err) {
    console.error("[signUp] Unexpected error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Determine where to redirect based on role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role;
      return {
        redirectTo: role === "coordinator" ? "/coordinator" : "/dashboard",
      };
    }

    return { redirectTo: "/dashboard" };
  } catch (err) {
    console.error("[signIn] Unexpected error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
