import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar } from "@/app/dashboard/_components/student-sidebar";
import { ApplyForm } from "./apply-form";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyApplyPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, companyRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("companies").select("id, name, company_overview").eq("id", id).single(),
  ]);

  const company = companyRes.data;
  if (companyRes.error || !company) notFound();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <StudentSidebar profile={profileRes.data} active="recommendations" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">Apply to {company.name}</h1>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-2xl space-y-5">
            <Link
              href={`/companyDetails/${company.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back to company details
            </Link>

            {company.company_overview && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">About {company.name}</p>
                <p className="text-sm leading-relaxed text-slate-600">{company.company_overview}</p>
              </div>
            )}

            <ApplyForm companyId={company.id} companyName={company.name} />
          </div>
        </main>
      </div>
    </div>
  );
}
