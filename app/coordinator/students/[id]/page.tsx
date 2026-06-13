import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoordinatorSidebar } from "@/app/coordinator/_components/coordinator-sidebar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
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

export default async function CoordinatorStudentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, studentRes, studentProfileRes, applicationsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, program_id, contact_number, student_id, created_at",
        )
        .eq("id", id)
        .eq("role", "student")
        .single(),
      supabase
        .from("student_profiles")
        .select("technical_skills, project_exp")
        .eq("user_id", id)
        .single(),
      supabase
        .from("company_applications")
        .select("id, status, created_at, company:companies(id, name)")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (studentRes.error || !studentRes.data) notFound();

  const placementRes = await supabase
    .from("ojt_placements")
    .select(
      "application_id, moa_url, certificate_url, company:companies(id, name)",
    )
    .eq("user_id", id)
    .maybeSingle();

  const student = studentRes.data;
  const studentProfile = studentProfileRes.data;
  const applications = applicationsRes.data ?? [];
  const placement = placementRes.data;
  const placementCompany = placement
    ? Array.isArray(placement.company)
      ? placement.company[0]
      : placement.company
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <CoordinatorSidebar profile={profileRes.data} active="students" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">
            Student Details
          </h1>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Link
              href="/coordinator?tab=students"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back to students
            </Link>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Student</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {student.full_name || "—"}
                  </p>
                  <p className="text-sm text-slate-500">{student.email}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  Joined {formatDate(student.created_at)}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Program</p>
                  <p className="text-sm text-slate-700">
                    {student.program_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Contact</p>
                  <p className="text-sm text-slate-700">
                    {student.contact_number || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Student ID</p>
                  <p className="text-sm text-slate-700">
                    {student.student_id || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Project Experience
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {studentProfile?.project_exp ||
                  "No project experience provided."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Technical Skills
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {studentProfile?.technical_skills?.length ? (
                  studentProfile.technical_skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">None listed</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Final OJT Placement
              </p>
              {placementCompany ? (
                <div className="mt-2 space-y-2">
                  <p className="text-sm font-medium text-slate-900">
                    {placementCompany.name}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {placement?.moa_url ? (
                      <a
                        href={placement.moa_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        View MOA / LOA
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">
                        MOA / LOA not uploaded
                      </span>
                    )}
                    {placement?.certificate_url ? (
                      <a
                        href={placement.certificate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        View Certificate of Completion
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Certificate not uploaded
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  No final placement selected yet.
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <p className="font-semibold text-slate-900">
                  Application History
                </p>
                <p className="text-xs text-slate-500">
                  {applications.length} total
                </p>
              </div>

              {applications.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-400">
                  No applications yet.
                </p>
              ) : (
                <div className="w-full overflow-auto">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {applications.map((application) => {
                        const company = Array.isArray(application.company)
                          ? application.company[0]
                          : application.company;
                        return (
                          <tr
                            key={application.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-6 py-3 align-top">
                              <span>{company?.name || "Unknown company"}</span>
                              {placement?.application_id === application.id && (
                                <Badge variant="success" className="ml-2">
                                  Final placement
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-3 align-top">
                              <Badge
                                variant={statusBadgeVariant(application.status)}
                              >
                                {prettyStatus(application.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 align-top text-right text-xs text-slate-400">
                              {formatDate(application.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
