import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentSidebar } from "@/app/dashboard/_components/student-sidebar";
import { CoordinatorSidebar } from "@/app/coordinator/_components/coordinator-sidebar";

interface Props {
  params: Promise<{ id: string }>;
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export default async function CompanyDetailsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, companyRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("companies").select("*").eq("id", id).single(),
  ]);

  if (companyRes.error || !companyRes.data) notFound();

  const company = companyRes.data;
  const isCoordinator = profileRes.data?.role === "coordinator";

  const sidebar = isCoordinator ? (
    <CoordinatorSidebar profile={profileRes.data} active="companies" />
  ) : (
    <StudentSidebar profile={profileRes.data} active="dashboard" />
  );

  const backHref = isCoordinator ? "/coordinator?tab=companies" : "/dashboard";
  const backLabel = isCoordinator ? "Back to companies" : "Back to dashboard";

  return (
    <div className="flex min-h-screen bg-slate-100">
      {sidebar}

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Company Details
            </h2>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Link href={backHref} className="text-sm text-blue-600 underline">
              {backLabel}
            </Link>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-2xl text-slate-900">
                    {company.name}
                  </CardTitle>
                  {!isCoordinator && (
                    <Link
                      href={`/companyDetails/${company.id}/apply`}
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Apply
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {company.logo_url ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <img
                      src={company.logo_url}
                      alt={`${company.name} logo`}
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    No company logo/picture uploaded.
                  </div>
                )}

                <p className="text-slate-700">
                  {company.company_overview || "No description available."}
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      HR Name
                    </p>
                    <p className="mt-2 text-sm text-slate-800">
                      {company.hr_name || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Email Address
                    </p>
                    <p className="mt-2 text-sm text-slate-800">
                      {company.email_address || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Location Address
                    </p>
                    <p className="mt-2 text-sm text-slate-800">
                      {company.location_address || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Website / Social Media
                    </p>
                    {company.website_url ? (
                      <a
                        href={normalizeUrl(company.website_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-blue-600 underline"
                      >
                        {company.website_url}
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-slate-800">
                        Not provided
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Contact Number
                    </p>
                    <p className="mt-2 text-sm text-slate-800">
                      {company.contact_number || "Not provided"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                    Required Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {company.required_skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                    Eligible Programs
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {company.eligibility_programs.map((program: string) => (
                      <Badge key={program} variant="outline">
                        {program}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
