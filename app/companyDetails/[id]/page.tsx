import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplyModal } from "./apply-modal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !company) notFound();

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <main className="mx-auto max-w-4xl space-y-6">
        <Link href="/dashboard" className="text-sm text-blue-600 underline">
          Back to dashboard
        </Link>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-2xl text-slate-900">
                {company.name}
              </CardTitle>
              <ApplyModal companyId={company.id} companyName={company.name} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {company.logo_url ? (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <img
                  src={company.logo_url}
                  alt={`${company.name} logo`}
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No company logo/picture uploaded.
              </div>
            )}

            <p className="text-slate-700">
              {company.description || "No description available."}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Email Address
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {company.email_address || "Not provided"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Location Address
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {company.location_address || "Not provided"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Website / Social Media
                </p>
                {company.website_url ? (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-blue-600 underline"
                  >
                    {company.website_url}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-800">Not provided</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Contact Number
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {company.contact_number || "Not provided"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Required Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {company.required_skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Eligible Programs
              </p>
              <div className="flex flex-wrap gap-2">
                {company.eligibility_programs.map((program: string) => (
                  <Badge key={program} variant="outline">
                    {program}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
