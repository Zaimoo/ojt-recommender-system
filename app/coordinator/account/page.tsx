import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/app/account/account-form";
import { CoordinatorSidebar } from "@/app/coordinator/_components/coordinator-sidebar";

export default async function CoordinatorAccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <CoordinatorSidebar profile={profile} active="account" />

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Account Settings
            </h2>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <div className="mx-auto max-w-3xl">
            <AccountForm profile={profile} />
          </div>
        </main>
      </div>
    </div>
  );
}
