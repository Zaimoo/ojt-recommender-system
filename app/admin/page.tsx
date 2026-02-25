import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminPanelClient } from "./client";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch data in parallel
  const [profileRes, companiesRes, studentsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email, program_id")
      .eq("role", "student"),
  ]);

  return (
    <AdminPanelClient
      profile={profileRes.data}
      companies={companiesRes.data ?? []}
      students={studentsRes.data ?? []}
    />
  );
}
