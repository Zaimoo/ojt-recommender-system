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
  const [profileRes, studentRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  const profile = profileRes.data;
  const studentProfile = studentRes.data;

  return (
    <StudentDashboardClient profile={profile} studentProfile={studentProfile} />
  );
}
