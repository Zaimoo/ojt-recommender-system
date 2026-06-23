import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { StudentSidebar } from "@/app/dashboard/_components/student-sidebar";
import { CoordinatorSidebar } from "@/app/coordinator/_components/coordinator-sidebar";
import { SuperadminSidebar } from "@/app/superadmin/_components/superadmin-sidebar";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Briefcase,
  GraduationCap,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

// Deterministic gradient so logo-less companies still feel distinct.
const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export default async function CompanyDetailsPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { from } = await searchParams;
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
  const profile = profileRes.data;
  const role = profile?.role;
  const isCoordinator = role === "coordinator";
  const isSuperadmin = role === "superadmin";
  const isStudent = !isCoordinator && !isSuperadmin;

  // For students, pull technical skills so we can highlight overlaps.
  let studentSkillSet = new Set<string>();
  if (isStudent) {
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("technical_skills")
      .eq("user_id", user.id)
      .single();
    studentSkillSet = new Set(
      (studentProfile?.technical_skills ?? []).map((s: string) =>
        s.toLowerCase(),
      ),
    );
  }

  const matchedSkillCount = company.required_skills.filter((s: string) =>
    studentSkillSet.has(s.toLowerCase()),
  ).length;

  const isEligible =
    isStudent &&
    profile?.program_id != null &&
    company.eligibility_programs.includes(profile.program_id);

  const fromCompanies = from === "companies";
  const backHref = isSuperadmin
    ? "/superadmin?tab=companies"
    : isCoordinator
      ? "/coordinator?tab=companies"
      : fromCompanies
        ? "/dashboard/companies"
        : "/dashboard/recommendations";
  const backLabel =
    isSuperadmin || isCoordinator || fromCompanies
      ? "Back to companies"
      : "Back to recommendations";

  const sidebar = isSuperadmin ? (
    <SuperadminSidebar profile={profile} active="companies" />
  ) : isCoordinator ? (
    <CoordinatorSidebar profile={profile} active="companies" />
  ) : (
    <StudentSidebar
      profile={profile}
      active={fromCompanies ? "companies" : "recommendations"}
    />
  );

  const initial = company.name.trim()[0]?.toUpperCase() ?? "?";
  const applyHref = `/companyDetails/${company.id}/apply`;

  const contactItems = [
    { label: "HR Contact", value: company.hr_name, icon: User },
    { label: "Email Address", value: company.email_address, icon: Mail },
    { label: "Contact Number", value: company.contact_number, icon: Phone },
    { label: "Location", value: company.location_address, icon: MapPin },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebar}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">
            Company Details
          </h1>
          {isStudent && (
            <Link
              href={applyHref}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Apply Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> {backLabel}
            </Link>

            {/* ── Hero ──────────────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Identity row */}
              <div className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    {/* Logo tile */}
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      {company.logo_url ? (
                        <Image
                          src={company.logo_url}
                          alt={`${company.name} logo`}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(
                            company.name,
                          )}`}
                        >
                          <span className="text-3xl font-bold text-white">
                            {initial}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-slate-900">
                          {company.name}
                        </h2>
                        {isEligible && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Eligible for your program
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        {company.location_address && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {company.location_address}
                          </span>
                        )}
                        {company.hr_name && (
                          <span className="inline-flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4" />
                            {company.hr_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isStudent && (
                    <Link
                      href={applyHref}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      Apply Now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>

                {/* Program chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {company.eligibility_programs.length > 0 ? (
                    company.eligibility_programs.map((program: string) => (
                      <Badge key={program} variant="outline">
                        <GraduationCap className="mr-1 h-3 w-3" />
                        {program}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">
                      No eligible programs listed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Skill-match callout (students only) */}
            {isStudent && company.required_skills.length > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {matchedSkillCount > 0
                      ? `You match ${matchedSkillCount} of ${company.required_skills.length} required skills`
                      : "Your skills don't overlap yet"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {matchedSkillCount > 0
                      ? "Matching skills are highlighted below in green."
                      : "Add more skills in your dashboard to improve your match."}
                  </p>
                </div>
              </div>
            )}

            {/* ── Content grid ──────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main column */}
              <div className="space-y-6 lg:col-span-2">
                {/* About */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    About the Company
                  </h3>
                  <p className="mt-3 leading-relaxed text-slate-600">
                    {company.company_overview ||
                      "This company hasn't added an overview yet."}
                  </p>
                </section>

                {/* Required skills */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Required Skills
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {company.required_skills.length > 0 ? (
                      company.required_skills.map((skill: string) => {
                        const matched = studentSkillSet.has(skill.toLowerCase());
                        return (
                          <span
                            key={skill}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
                              matched
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {matched && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {skill}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-slate-400">
                        No specific skills listed.
                      </span>
                    )}
                  </div>
                </section>
              </div>

              {/* Sidebar column */}
              <div className="space-y-6">
                {/* Contact info */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Contact Information
                  </h3>
                  <div className="mt-4 space-y-4">
                    {contactItems.map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {label}
                          </p>
                          <p className="mt-0.5 break-words text-sm text-slate-800">
                            {value || "Not provided"}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Website */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Website / Social
                        </p>
                        {company.website_url ? (
                          <a
                            href={normalizeUrl(company.website_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 block break-words text-sm text-blue-600 hover:underline"
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
                </section>

                {/* Added by */}
                {company.created_by_name && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Listed By
                    </h3>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {company.created_by_name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <p className="text-sm text-slate-800">
                        {company.created_by_name}
                      </p>
                    </div>
                  </section>
                )}

                {/* Apply CTA card (student only) */}
                {isStudent && (
                  <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-sm">
                    <h3 className="font-semibold">Ready to apply?</h3>
                    <p className="mt-1 text-sm text-blue-100">
                      Send your application to {company.name} in just a few
                      clicks.
                    </p>
                    <Link
                      href={applyHref}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      Apply to {company.name}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </section>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
