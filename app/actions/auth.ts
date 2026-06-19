"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidContactNumber, isValidStudentId } from "@/lib/validation";
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
  const role = "student" as const;

  if (!studentId.trim()) {
    return { error: "Student ID number is required." };
  }

  if (!isValidStudentId(studentId)) {
    return { error: "Invalid Student ID. Format: 2022-1894 (YYYY-0000)." };
  }

  if (contactNumber.trim() && !isValidContactNumber(contactNumber)) {
    return {
      error: "Invalid contact number. Use +63 966 368 5824 or 09663685824.",
    };
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
          program_id: null,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {
      redirectTo: "/dashboard",
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
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      const role = profile?.role;

      // Deactivated coordinators cannot sign in.
      if (role === "coordinator" && profile?.is_active === false) {
        await supabase.auth.signOut();
        return {
          error:
            "Your coordinator account has been deactivated. Please contact the administrator.",
        };
      }

      return {
        redirectTo:
          role === "superadmin"
            ? "/superadmin"
            : role === "coordinator"
              ? "/coordinator"
              : "/dashboard",
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
