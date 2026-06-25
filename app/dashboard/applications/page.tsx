import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentSidebar } from "../_components/student-sidebar";
import { FileText, ArrowUpRight, History } from "lucide-react";

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  company: { id: string; name: string }[] | { id: string; name: string } | null;
}

function resolveCompany(company: ApplicationRow["company"]): { id: string; name: string } | null {
  if (!company) return null;
  if (Array.isArray(company)) return company[0] ?? null;
  return company;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "placement": return "default";
    case "accepted": return "success";
    case "rejected": return "destructive";
    case "under_review": return "warning";
    default: return "secondary";
  }
}

function statusLabel(status: string) {
  if (status === "placement") return "Final Placement";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ApplicationHistoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, applicationsRes, placementRes, historyRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("company_applications")
      .select("id, status, created_at, company:companies!inner(id, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ojt_placements")
      .select("application_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("ojt_placement_history")
      .select("application_id")
      .eq("user_id", user.id),
  ]);

  const applications = (applicationsRes.data ?? []) as ApplicationRow[];
  const placementApplicationId = placementRes.data?.application_id ?? null;

  // Applications that were once the final placement but have since been changed.
  const formerPlacementIds = new Set(
    (historyRes.data ?? [])
      .map((h) => h.application_id as string)
      .filter((appId) => appId !== placementApplicationId),
  );

  const placementCount = applications.filter(
    (a) => a.id === placementApplicationId,
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <StudentSidebar profile={profileRes.data} active="applications" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">Application History</h1>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            {applications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No applications yet"
                className="py-20"
                description={
                  <>
                    Head to{" "}
                    <Link
                      href="/dashboard/recommendations"
                      className="text-blue-600 underline"
                    >
                      Recommendations
                    </Link>{" "}
                    to find companies and apply.
                  </>
                }
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">Your Applications</p>
                    <p className="text-xs text-slate-500">
                      {applications.length}{" "}
                      {applications.length === 1 ? "application" : "applications"}
                      {placementCount > 0 && " · final placement selected"}
                    </p>
                  </div>
                  {formerPlacementIds.size > 0 && (
                    <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <History className="h-3.5 w-3.5" />
                      Placement changed {formerPlacementIds.size}{" "}
                      {formerPlacementIds.size === 1 ? "time" : "times"}
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        <th scope="col" className="px-6 py-3">Company</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Submitted</th>
                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map((application) => {
                        const company = resolveCompany(application.company);
                        const isCurrentPlacement =
                          placementApplicationId === application.id;
                        const isFormerPlacement = formerPlacementIds.has(
                          application.id,
                        );
                        const displayStatus = isCurrentPlacement
                          ? "placement"
                          : application.status;
                        return (
                          <tr
                            key={application.id}
                            className="transition-colors hover:bg-slate-50/80"
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">
                                {company?.name ?? "Unknown company"}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant={statusBadgeVariant(displayStatus)}>
                                  {statusLabel(displayStatus)}
                                </Badge>
                                {isFormerPlacement && (
                                  <Badge
                                    variant="outline"
                                    className="border-slate-300 text-slate-500"
                                  >
                                    Former placement
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                              {formatDate(application.created_at)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/dashboard/applications/${application.id}`}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                                >
                                  Details <ArrowUpRight className="h-3 w-3" />
                                </Link>
                                {company?.id && (
                                  <Link
                                    href={`/companyDetails/${company.id}`}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                                  >
                                    Company <ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
