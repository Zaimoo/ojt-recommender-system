import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { StudentSidebar } from "@/app/dashboard/_components/student-sidebar";
import { CoordinatorSidebar } from "@/app/coordinator/_components/coordinator-sidebar";
import { SuperadminSidebar } from "@/app/superadmin/_components/superadmin-sidebar";
import { MapPin, Mail, Phone, Globe, User, ArrowLeft } from "lucide-react";

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
  const role = profileRes.data?.role;
  const isCoordinator = role === "coordinator";
  const isSuperadmin = role === "superadmin";
  const backHref = isSuperadmin
    ? "/superadmin?tab=companies"
    : isCoordinator
      ? "/coordinator?tab=companies"
      : "/dashboard/recommendations";
  const backLabel = isSuperadmin
    ? "Back to companies"
    : isCoordinator
      ? "Back to companies"
      : "Back to recommendations";

  const sidebar = isSuperadmin ? (
    <SuperadminSidebar profile={profileRes.data} active="companies" />
  ) : isCoordinator ? (
    <CoordinatorSidebar profile={profileRes.data} active="companies" />
  ) : (
    <StudentSidebar profile={profileRes.data} active="recommendations" />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebar}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">
            Company Details
          </h1>
          {!isCoordinator && !isSuperadmin && (
            <Link
              href={`/companyDetails/${company.id}/apply`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Apply Now
            </Link>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-5">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> {backLabel}
            </Link>

            {/* Company banner */}
            {company.logo_url ? (
              <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <Image
                  src={company.logo_url}
                  alt={`${company.name} logo`}
                  width={640}
                  height={360}
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="max-h-64 w-auto max-w-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-36 md:h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                No company image uploaded
              </div>
            )}

            {/* Company name + overview */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                {company.name}
              </h2>
              {company.company_overview && (
                <p className="mt-3 leading-relaxed text-slate-600">
                  {company.company_overview}
                </p>
              )}
            </div>

            {/* Info grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "HR Contact", value: company.hr_name, icon: User },
                {
                  label: "Email Address",
                  value: company.email_address,
                  icon: Mail,
                },
                {
                  label: "Location",
                  value: company.location_address,
                  icon: MapPin,
                },
                {
                  label: "Contact Number",
                  value: company.contact_number,
                  icon: Phone,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-800">
                      {value || "Not provided"}
                    </p>
                  </div>
                </div>
              ))}

              {/* Website */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Website / Social
                  </p>
                  {company.website_url ? (
                    <a
                      href={normalizeUrl(company.website_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block text-sm text-blue-600 hover:underline"
                    >
                      {company.website_url}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm text-slate-800">
                      Not provided
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Skills & Programs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Required Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {company.required_skills.length > 0 ? (
                    company.required_skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">None listed</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Eligible Programs
                </p>
                <div className="flex flex-wrap gap-2">
                  {company.eligibility_programs.length > 0 ? (
                    company.eligibility_programs.map((program: string) => (
                      <Badge key={program} variant="outline">
                        {program}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">None listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Apply CTA at bottom (student only) */}
            {!isCoordinator && (
              <div className="flex justify-end">
                <Link
                  href={`/companyDetails/${company.id}/apply`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Apply to {company.name}
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
