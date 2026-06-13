import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { StudentSidebar } from "../_components/student-sidebar";
import { FileText, ArrowUpRight } from "lucide-react";

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
    case "accepted": return "success";
    case "rejected": return "destructive";
    case "under_review": return "warning";
    default: return "secondary";
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ApplicationHistoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, applicationsRes, placementRes] = await Promise.all([
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
  ]);

  const applications = applicationsRes.data;
  const placementApplicationId = placementRes.data?.application_id ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <StudentSidebar profile={profileRes.data} active="applications" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">Application History</h1>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            {!applications || applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center">
                <FileText className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-500">No applications yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Head to{" "}
                  <Link href="/dashboard/recommendations" className="text-blue-600 underline">
                    Recommendations
                  </Link>{" "}
                  to find companies and apply.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <p className="font-semibold text-slate-900">Your Applications</p>
                  <p className="text-xs text-slate-500">{applications.length} total</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {(applications as ApplicationRow[]).map((application) => {
                    const company = resolveCompany(application.company);
                    return (
                      <div
                        key={application.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {company?.name ?? "Unknown company"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Submitted {formatDate(application.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {placementApplicationId === application.id && (
                            <Badge variant="success">Final placement</Badge>
                          )}
                          <Badge variant={statusBadgeVariant(application.status)}>
                            {statusLabel(application.status)}
                          </Badge>
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
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
