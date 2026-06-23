import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar } from "../_components/student-sidebar";
import { CompaniesClient } from "./companies-client";

export default async function CompaniesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, companiesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const companies = companiesRes.data ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <StudentSidebar profile={profile} active="companies" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Companies</h1>
            <p className="text-xs text-slate-500">
              Browse partner companies and apply
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <CompaniesClient
            companies={companies}
            studentProgram={profile?.program_id ?? null}
          />
        </main>
      </div>
    </div>
  );
}
