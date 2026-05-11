import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/app/account/account-form";
import { Briefcase, LogOut } from "lucide-react";

export default async function StudentAccountPage() {
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
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-2 text-blue-600 shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                Student Dashboard
              </h1>
              <p className="text-xs text-slate-500">OJT Recommender</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/account"
            className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 shadow-sm"
          >
            Account Settings
          </Link>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <form action={signOut} className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              type="submit"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </form>
        </div>
      </aside>

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
