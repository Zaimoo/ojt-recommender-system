import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoordinatorSidebar } from "@/app/coordinator/_components/coordinator-sidebar";
import {
  approveCoordinator,
  denyCoordinator,
} from "@/app/actions/coordinator-verifications";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CoordinatorVerificationPage({ params }: Props) {
  const { id } = await params;
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

  const { data: coordinator } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, program_id, contact_number, created_at, coordinator_status",
    )
    .eq("id", id)
    .eq("role", "coordinator")
    .single();

  if (!coordinator) redirect("/coordinator?tab=verifications");

  if (coordinator.coordinator_status !== "pending") {
    redirect("/coordinator?tab=verifications");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <CoordinatorSidebar profile={profile} active="verifications" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Coordinator Verification
            </h1>
            <p className="text-xs text-slate-500">
              Review coordinator details before approving access.
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <Link
              href="/coordinator?tab=verifications"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back to requests
            </Link>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Coordinator</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {coordinator.full_name || "—"}
                  </p>
                  <p className="text-sm text-slate-500">{coordinator.email}</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Program</p>
                  <p className="text-sm text-slate-700">
                    {coordinator.program_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Contact</p>
                  <p className="text-sm text-slate-700">
                    {coordinator.contact_number || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Requested</p>
                  <p className="text-sm text-slate-700">
                    {formatDate(coordinator.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form
                action={approveCoordinator}
                className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm"
              >
                <input type="hidden" name="user_id" value={coordinator.id} />
                <p className="text-sm font-semibold text-slate-900">Approve</p>
                <p className="mt-1 text-xs text-slate-500">
                  Grant coordinator access immediately.
                </p>
                <Button
                  type="submit"
                  size="sm"
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve Coordinator
                </Button>
              </form>

              <form
                action={denyCoordinator}
                className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm"
              >
                <input type="hidden" name="user_id" value={coordinator.id} />
                <p className="text-sm font-semibold text-slate-900">Deny</p>
                <p className="mt-1 text-xs text-slate-500">
                  Provide a reason for denial.
                </p>
                <Input
                  name="deny_reason"
                  placeholder="Reason for denial"
                  className="mt-4"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="mt-4 w-full bg-rose-600 hover:bg-rose-700"
                >
                  Deny Coordinator
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
