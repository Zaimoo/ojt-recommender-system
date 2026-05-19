import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/app/account/account-form";
import { StudentSidebar } from "../_components/student-sidebar";

export default async function StudentAccountPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <StudentSidebar profile={profile} active="account" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">Account Settings</h1>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-2xl">
            <AccountForm profile={profile} />
          </div>
        </main>
      </div>
    </div>
  );
}
