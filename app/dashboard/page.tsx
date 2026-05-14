import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentDashboardClient } from "./client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile + student_profile in parallel
  const [profileRes, studentRes, skillsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase.from("companies").select("required_skills"),
  ]);

  const profile = profileRes.data;
  const studentProfile = studentRes.data;

  const skillSuggestions = Array.from(
    new Set((skillsRes.data ?? []).flatMap((row) => row.required_skills ?? [])),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <StudentDashboardClient
      profile={profile}
      studentProfile={studentProfile}
      skillSuggestions={skillSuggestions}
    />
  );
}
