import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoordinatorPanelClient } from "./client";

interface Props {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function CoordinatorPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, companiesRes, allStudentsRes, latestStudentsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, program_id, contact_number, student_id, created_at",
        )
        .eq("role", "student"),
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, program_id, contact_number, student_id, created_at",
        )
        .eq("role", "student")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const allStudents = allStudentsRes.data ?? [];
  const studentIds = allStudents.map((student) => student.id);
  const applicationsRes = studentIds.length
    ? await supabase
        .from("company_applications")
        .select("user_id, status")
        .in("user_id", studentIds)
    : { data: [] };

  const statusByStudentId = (applicationsRes.data ?? []).reduce(
    (acc, application) => {
      const statuses = acc[application.user_id] ?? [];
      statuses.push(application.status);
      acc[application.user_id] = statuses;
      return acc;
    },
    {} as Record<string, string[]>,
  );

  function deriveStudentStatus(statuses: string[] | undefined) {
    if (!statuses || statuses.length === 0) return null;
    if (statuses.includes("accepted")) return "accepted";
    if (statuses.includes("under_review")) return "under_review";
    if (statuses.includes("submitted")) return "submitted";
    if (statuses.includes("rejected")) return "rejected";
    return null;
  }

  const companies = companiesRes.data ?? [];
  const creatorIds = Array.from(
    new Set(companies.map((company) => company.created_by).filter(Boolean)),
  ) as string[];
  const creatorsRes = creatorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", creatorIds)
    : { data: [] };
  const creatorsById = (creatorsRes.data ?? []).reduce(
    (acc, creator) => {
      acc[creator.id] = creator;
      return acc;
    },
    {} as Record<
      string,
      { id: string; full_name: string | null; email: string }
    >,
  );

  return (
    <CoordinatorPanelClient
      profile={profileRes.data}
      companies={companies}
      companyCreators={creatorsById}
      allStudents={allStudents.map((student) => ({
        ...student,
        application_status: deriveStudentStatus(statusByStudentId[student.id]),
      }))}
      latestStudents={latestStudentsRes.data ?? []}
      initialTab={resolvedSearchParams?.tab}
    />
  );
}
