import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  updateApplicationStatus,
  setFinalPlacement,
  uploadPlacementDocument,
  uploadCompletionCertificate,
} from "@/app/actions/application";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentSidebar } from "../../_components/student-sidebar";
import { Button } from "@/components/ui/button";

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

function nextStatusOptions(status: string) {
  if (status === "submitted") {
    return [{ value: "under_review", label: "Under Review" }];
  }
  if (status === "under_review") {
    return [
      { value: "accepted", label: "Accepted" },
      { value: "rejected", label: "Rejected" },
    ];
  }
  return [];
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

  const placementRes = await supabase
    .from("ojt_placements")
    .select("application_id, moa_url, certificate_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const placement = placementRes.data;
  const isFinalPlacement = placement?.application_id === application.id;
  const hasOtherPlacement = !!placement && !isFinalPlacement;

  const statusOptions = nextStatusOptions(application.status);

  const updateStatusAction = async (formData: FormData) => {
    "use server";
    await updateApplicationStatus(formData);
  };

  const selectPlacementAction = async (formData: FormData) => {
    "use server";
    await setFinalPlacement(formData);
  };

  const uploadMoaAction = async (formData: FormData) => {
    "use server";
    await uploadPlacementDocument(formData);
  };

  const uploadCertificateAction = async (formData: FormData) => {
    "use server";
    await uploadCompletionCertificate(formData);
  };

  const company = Array.isArray(application.company)
    ? application.company[0]
    : application.company;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <StudentSidebar profile={profileRes.data} active="applications" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Application Details
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-3xl space-y-4">
            <Link
              href="/dashboard/applications"
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
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
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase text-slate-500">
                    Update status
                  </p>
                  {statusOptions.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-600">
                      This application is already finalized.
                    </p>
                  ) : (
                    <form
                      action={updateStatusAction}
                      className="mt-3 flex flex-wrap items-center gap-3"
                    >
                      <input
                        type="hidden"
                        name="application_id"
                        value={application.id}
                      />
                      <select
                        name="next_status"
                        defaultValue={statusOptions[0].value}
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Update status
                      </Button>
                    </form>
                  )}
                </div>

                {application.status === "accepted" && (
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs uppercase text-slate-500">
                        Final OJT Placement
                      </p>
                      {isFinalPlacement && (
                        <Badge variant="success">Selected placement</Badge>
                      )}
                    </div>

                    {isFinalPlacement ? (
                      <div className="mt-3 space-y-4">
                        <p className="text-sm text-slate-600">
                          This company is your final OJT placement. Upload your
                          signed MOA / LOA, and your certificate of completion
                          once the OJT is finished.
                        </p>

                        <form
                          action={uploadMoaAction}
                          className="space-y-2"
                        >
                          <label className="text-xs font-medium text-slate-700">
                            MOA / LOA (PDF or image)
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="file"
                              name="moa"
                              accept=".pdf,image/*"
                              required
                              className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                            >
                              Upload MOA / LOA
                            </Button>
                            {placement?.moa_url && (
                              <a
                                href={placement.moa_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 underline"
                              >
                                View current
                              </a>
                            )}
                          </div>
                        </form>

                        <form
                          action={uploadCertificateAction}
                          className="space-y-2"
                        >
                          <label className="text-xs font-medium text-slate-700">
                            Certificate of Completion (PDF or image)
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="file"
                              name="certificate"
                              accept=".pdf,image/*"
                              required
                              className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                            >
                              Upload Certificate
                            </Button>
                            {placement?.certificate_url && (
                              <a
                                href={placement.certificate_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 underline"
                              >
                                View current
                              </a>
                            )}
                          </div>
                        </form>
                      </div>
                    ) : hasOtherPlacement ? (
                      <p className="mt-2 text-sm text-slate-600">
                        You have already chosen a different company as your final
                        OJT placement. Selecting this one will replace it and
                        clear any uploaded documents.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">
                        Choose this company as your final OJT placement.
                      </p>
                    )}

                    {!isFinalPlacement && (
                      <form action={selectPlacementAction} className="mt-3">
                        <input
                          type="hidden"
                          name="application_id"
                          value={application.id}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {hasOtherPlacement
                            ? "Set as final placement instead"
                            : "Select as final placement"}
                        </Button>
                      </form>
                    )}
                  </div>
                )}

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
                  <p className="text-xs uppercase text-slate-500">
                    Project Experience
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {application.message || "No project experience provided."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {application.resume_url && (
                    <a
                      href={application.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      View resume
                    </a>
                  )}
                  {company?.id && (
                    <Link
                      href={`/companyDetails/${company.id}`}
                      className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
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
