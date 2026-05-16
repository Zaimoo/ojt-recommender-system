import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar } from "@/app/dashboard/_components/student-sidebar";
import { ApplyForm } from "./apply-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyApplyPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, companyRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("companies")
      .select("id, name, company_overview")
      .eq("id", id)
      .single(),
  ]);

  const company = companyRes.data;

  if (companyRes.error || !company) notFound();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar profile={profileRes.data} active="dashboard" />

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-slate-900">Apply</h2>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <Link
              href={`/companyDetails/${company.id}`}
              className="text-sm text-blue-600 underline"
            >
              Back to company details
            </Link>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Apply to {company.name}
              </h1>
              <p className="text-sm text-slate-600">
                {company.company_overview || "No description available."}
              </p>
            </div>

            <ApplyForm companyId={company.id} companyName={company.name} />
          </div>
        </main>
      </div>
    </div>
  );
}
