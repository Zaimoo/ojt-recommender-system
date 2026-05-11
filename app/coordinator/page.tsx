import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoordinatorPanelClient } from "./client";

export default async function CoordinatorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, companiesRes, allStudentsRes, latestStudentsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, email, program_id")
        .eq("role", "student"),
      supabase
        .from("profiles")
        .select("id, full_name, email, program_id, created_at")
        .eq("role", "student")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <CoordinatorPanelClient
      profile={profileRes.data}
      companies={companiesRes.data ?? []}
      allStudents={allStudentsRes.data ?? []}
      latestStudents={latestStudentsRes.data ?? []}
    />
  );
}
