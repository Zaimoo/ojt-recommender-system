import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperadminPanelClient } from "./client";
import type { ProgramId, Company } from "@/types";

interface Props {
  searchParams?: Promise<{ tab?: string }>;
}

interface StudentSummary {
  id: string;
  full_name: string | null;
  email: string;
  program_id: ProgramId | null;
  contact_number: string | null;
  student_id: string | null;
  created_at: string;
}

interface CoordinatorSummary {
  id: string;
  full_name: string | null;
  email: string;
  program_id: ProgramId | null;
  contact_number: string | null;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
  details: Record<string, unknown> | null;
}

export default async function SuperadminPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, studentsRes, coordinatorsRes, companiesRes, auditRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, program_id, contact_number, student_id, created_at",
        )
        .eq("role", "student")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, email, program_id, contact_number, created_at")
        .eq("role", "coordinator")
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("audit_logs")
        .select(
          "id, action, entity_type, entity_id, created_at, details, actor:profiles(full_name, email)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

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
    {} as Record<string, { id: string; full_name: string | null; email: string }>,
  );

  return (
    <SuperadminPanelClient
      profile={profileRes.data}
      students={(studentsRes.data ?? []) as StudentSummary[]}
      coordinators={(coordinatorsRes.data ?? []) as CoordinatorSummary[]}
      companies={companies as Company[]}
      companyCreators={creatorsById}
      auditLogs={((auditRes.data ?? []) as unknown) as AuditLogEntry[]}
      initialTab={resolvedSearchParams?.tab}
    />
  );
}
