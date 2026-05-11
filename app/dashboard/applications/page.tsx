import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentSidebar } from "../_components/student-sidebar";

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  company: { id: string; name: string }[] | { id: string; name: string } | null;
}

function resolveCompany(
  company: ApplicationRow["company"],
): { id: string; name: string } | null {
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
    case "accepted":
      return "success";
    case "rejected":
      return "destructive";
    case "under_review":
      return "warning";
    default:
      return "secondary";
  }
}

function prettyStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function ApplicationHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, applicationsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("company_applications")
      .select("id, status, created_at, company:companies!inner(id, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const applications = applicationsRes.data;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar profile={profileRes.data} active="applications" />

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Application History
            </h2>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {!applications || applications.length === 0 ? (
                <p className="text-sm text-slate-500">
                  You have not submitted any applications yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {(applications as ApplicationRow[]).map((application) => {
                    const company = resolveCompany(application.company);

                    return (
                      <div
                        key={application.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {company?.name ?? "Unknown company"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Submitted {formatDate(application.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={statusBadgeVariant(application.status)}
                          >
                            {prettyStatus(application.status)}
                          </Badge>
                          <Link
                            href={`/dashboard/applications/${application.id}`}
                            className="text-xs font-medium text-blue-600 underline"
                          >
                            Details
                          </Link>
                          {company?.id && (
                            <Link
                              href={`/companyDetails/${company.id}`}
                              className="text-xs font-medium text-blue-600 underline"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
