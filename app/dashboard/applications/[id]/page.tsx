import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentSidebar } from "../../_components/student-sidebar";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

export default async function ApplicationDetailsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, applicationRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("company_applications")
      .select(
        "id, status, created_at, applicant_name, applicant_email, message, resume_url, company:companies!inner(id, name, email_address)",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
  ]);

  const { data: application, error } = applicationRes;

  if (error || !application) notFound();

  const company = Array.isArray(application.company)
    ? application.company[0]
    : application.company;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar profile={profileRes.data} active="applications" />

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Application Details
            </h2>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <div className="mx-auto max-w-3xl space-y-4">
            <Link
              href="/dashboard/applications"
              className="text-sm text-blue-600 underline"
            >
              Back to application history
            </Link>

            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">
                  {company?.name ?? "Unknown company"}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <Badge variant={statusBadgeVariant(application.status)}>
                    {prettyStatus(application.status)}
                  </Badge>
                  <span>
                    Submitted {formatDateTime(application.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Applicant
                    </p>
                    <p className="mt-2 text-sm text-slate-900">
                      {application.applicant_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {application.applicant_email}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Company Email
                    </p>
                    <p className="mt-2 text-sm text-slate-900">
                      {company?.email_address ?? "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase text-slate-500">Message</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {application.message || "No message provided."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {application.resume_url && (
                    <a
                      href={application.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-blue-600 underline"
                    >
                      View resume
                    </a>
                  )}
                  {company?.id && (
                    <Link
                      href={`/companyDetails/${company.id}`}
                      className="text-sm font-medium text-blue-600 underline"
                    >
                      View company details
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
