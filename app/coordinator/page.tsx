import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProgramId } from "@/types";
import { CoordinatorPanelClient } from "./client";

interface Props {
  searchParams?: Promise<{ tab?: string }>;
}

interface PendingCoordinator {
  id: string;
  full_name: string | null;
  email: string;
  program_id: ProgramId | null;
  contact_number: string | null;
  created_at: string;
  coordinator_status: string | null;
  coordinator_denied_reason: string | null;
}

export default async function CoordinatorPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    profileRes,
    companiesRes,
    allStudentsRes,
    latestStudentsRes,
    pendingCoordinatorsRes,
  ] = await Promise.all([
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
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, program_id, contact_number, created_at, coordinator_status, coordinator_denied_reason",
      )
      .eq("role", "coordinator")
      .eq("coordinator_status", "pending")
      .order("created_at", { ascending: false }),
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
      allStudents={allStudentsRes.data ?? []}
      latestStudents={latestStudentsRes.data ?? []}
      pendingCoordinators={
        (pendingCoordinatorsRes.data ?? []) as PendingCoordinator[]
      }
      initialTab={resolvedSearchParams?.tab}
    />
  );
}
