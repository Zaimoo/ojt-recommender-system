import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, company_overview")
    .eq("id", id)
    .single();

  if (error || !company) notFound();

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <main className="mx-auto max-w-2xl space-y-6">
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
      </main>
    </div>
  );
}
